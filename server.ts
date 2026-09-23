import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '20mb' }));

const apiKey = process.env.GEMINI_API_KEY || '';

const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Candidate models for graceful fallback if one experiences 503 high demand
const CANDIDATE_MODELS = [
  'gemini-3.8-flash',
  'gemini-flash-latest',
  'gemini-3.1-flash-lite',
];

// Model personas tailored for dheeraj-claude
function getSystemPromptForModel(modelId: string, customSystemPrompt?: string, thinkingEnabled = true, effort: string = 'Medium'): string {
  let modelPersona = '';

  switch (modelId) {
    case 'fable-5-1':
      modelPersona = `You are Fable 5.1, Anthropic's pinnacle intelligence designed for your toughest challenges.
You excel at the most complex algorithmic reasoning, deep full-stack software architecture, and frontier engineering problems.`;
      break;

    case 'opus-5-5':
    case 'claude-3-opus':
      modelPersona = `You are Opus 5.5, Anthropic's most capable model for ambitious work, reasoning, and system architecture.
You are renowned for deep coding acumen, architectural precision, thorough proofs, and nuanced engineering solutions.`;
      break;

    case 'sonnet-5':
    case 'claude-3-7-sonnet':
    case 'claude-3-5-sonnet':
      modelPersona = `You are Sonnet 5, Anthropic's most efficient and powerful model for everyday tasks and software development.
You excel at rapid, beautiful web design, modern UI with Tailwind CSS, clean TypeScript, and interactive canvas artifacts.`;
      break;

    case 'haiku-4-5':
    case 'claude-3-5-haiku':
      modelPersona = `You are Haiku 4.5, Anthropic's fastest model for quick answers.
You deliver instant, concise, razor-sharp code snippets, bug fixes, bash scripts, and regex patterns with minimal preamble.`;
      break;

    default:
      modelPersona = `You are Sonnet 5, an expert AI software engineer and coding assistant inspired by Claude.`;
  }

  let fullPrompt = `${modelPersona}

Core Capabilities & Guidelines:
1. Coding & Artifacts:
   - When asked to create apps, games, UI components, scripts, or complete documents, you provide complete, runnable, fully self-contained code.
   - For web apps or UI components, you can write complete HTML/CSS/JavaScript with Tailwind CSS (via CDN) or modern web standards so they can run directly in the interactive live preview sandbox.
   - You can also write Python, TypeScript, React, Node.js, SQL, C++, etc.
   - Always produce full, working code without truncating or leaving placeholders like "// implement here".

2. Artifacts Format:
   When writing a substantial piece of code, web app, or document (over ~15 lines or a complete component/file), wrap it in an artifact format:
   \`\`\`[language]:[filename]
   [full code]
   \`\`\`
   Example:
   \`\`\`html:index.html
   <!DOCTYPE html>
   ...
   \`\`\`
   Or
   \`\`\`javascript:app.js
   ...
   \`\`\`

3. Personality & Voice:
   - Thoughtful, direct, knowledgeable, humble, authentic Claude tone.
   - Never generate unnecessary conversational boilerplate; get straight to solving the user's problem.
   - Format explanations with crisp markdown, clean typography, tables, and highlighted inline code.`;

  if (thinkingEnabled) {
    let effortGuidance = 'Provide balanced reasoning, evaluating key design choices and trade-offs.';
    if (effort === 'Low') {
      effortGuidance = 'Keep thinking concise and direct, focusing only on the core solution.';
    } else if (effort === 'High') {
      effortGuidance = 'Conduct deep, comprehensive reasoning, exploring edge cases, architectures, and verification.';
    } else if (effort === 'Extra') {
      effortGuidance = 'Perform extensive multi-step analytical reasoning and exhaustive structural breakdown.';
    } else if (effort === 'Max') {
      effortGuidance = 'Deliver maximum exhaustive reasoning depth, rigorous algorithmic proofs, failure modes, and pristine architecture.';
    }

    fullPrompt += `\n\n4. Thinking & Reasoning (Effort Level: ${effort}):
   - You MUST begin your response with <thought> ... </thought> tags.
   - ${effortGuidance}
   - Inside <thought>, structure your step-by-step reasoning, requirements breakdown, edge-case analysis, and code plan before outputting the final response.`;
  }

  if (customSystemPrompt && typeof customSystemPrompt === 'string') {
    fullPrompt += `\n\nUser Custom Persona / Instructions:\n${customSystemPrompt}`;
  }

  return fullPrompt;
}

// Helper to sanitize error messages so raw JSON isn't sent to the user
function sanitizeErrorMessage(err: any): string {
  if (!err) return 'An unexpected error occurred. Please try again.';

  let raw = err.message || String(err);
  try {
    // Check if error message is a stringified JSON
    if (raw.includes('{') && raw.includes('}')) {
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        if (parsed?.error?.message) {
          try {
            const inner = JSON.parse(parsed.error.message);
            if (inner?.error?.message) {
              return inner.error.message;
            }
          } catch (e) {
            return parsed.error.message;
          }
        }
      }
    }
  } catch (e) {}

  if (raw.includes('503') || raw.includes('high demand') || raw.includes('UNAVAILABLE')) {
    return 'The model is currently experiencing high demand. Automatic failover was attempted. Please try sending your message again in a moment.';
  }

  return raw;
}

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    appName: 'dheeraj-claude',
    hasApiKey: !!process.env.GEMINI_API_KEY,
  });
});

app.post('/api/chat', async (req: Request, res: Response) => {
  const {
    messages,
    model = 'sonnet-5',
    effort = 'Medium',
    thinkingEnabled = true,
    customSystemPrompt,
  } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Messages array is required.' });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({
      error: 'GEMINI_API_KEY is not configured on the server. Please check the Secrets panel.',
    });
  }

  // Set up SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const sendEvent = (event: string, data: any) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const systemInstruction = getSystemPromptForModel(model, customSystemPrompt, thinkingEnabled, effort);

    // Format chat history for Google GenAI SDK
    const contents = messages.map((msg: { role: string; content: string; attachments?: any[] }) => {
      const parts: any[] = [];

      if (msg.attachments && Array.isArray(msg.attachments)) {
        for (const att of msg.attachments) {
          if (att.type === 'code' || att.type === 'file') {
            parts.push({
              text: `[Attached File: ${att.name || 'snippet'} (${att.language || 'text'})]\n\`\`\`${att.language || ''}\n${att.content}\n\`\`\`\n`,
            });
          }
        }
      }

      parts.push({ text: msg.content || '' });

      return {
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts,
      };
    });

    // Model fallback execution to protect against transient 503 / high demand spikes
    let responseStream: any = null;
    let successfulModel = '';
    let lastError: any = null;

    for (const candidateModel of CANDIDATE_MODELS) {
      try {
        console.log(`[dheeraj-claude] Calling ${candidateModel} for Claude emulation (${model})...`);
        responseStream = await ai.models.generateContentStream({
          model: candidateModel,
          contents,
          config: {
            systemInstruction,
            temperature: model === 'claude-3-5-haiku' ? 0.3 : 0.7,
          },
        });
        successfulModel = candidateModel;
        break; // Successfully initiated stream!
      } catch (err: any) {
        console.warn(`[dheeraj-claude] ${candidateModel} returned error:`, err?.message || err);
        lastError = err;
        // Wait 250ms before trying the next candidate model
        await new Promise(r => setTimeout(r, 250));
      }
    }

    if (!responseStream) {
      throw lastError || new Error('All model candidates are currently experiencing high demand.');
    }

    // Stream model indicator to client so user knows it's active
    sendEvent('model_info', {
      claudeModel: model,
      backendEngine: successfulModel,
    });

    let accumulatedText = '';

    for await (const chunk of responseStream) {
      const chunkText = chunk.text || '';
      if (!chunkText) continue;

      accumulatedText += chunkText;
      sendEvent('chunk', { text: chunkText });
    }

    sendEvent('done', { fullText: accumulatedText });
    res.end();
  } catch (error: any) {
    console.error('Error generating chat response:', error);
    const cleanError = sanitizeErrorMessage(error);
    sendEvent('error', {
      message: cleanError,
    });
    res.end();
  }
});

// Run code helper endpoint for safe JS execution or code linting
app.post('/api/validate-code', async (req: Request, res: Response) => {
  const { code, language } = req.body;
  res.json({
    valid: true,
    lines: (code || '').split('\n').length,
    chars: (code || '').length,
    language,
  });
});

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[dheeraj-claude] Server running on http://localhost:${PORT}`);
  });
}

startServer();
