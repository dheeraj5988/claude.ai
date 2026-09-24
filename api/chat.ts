import type { IncomingMessage, ServerResponse } from 'http';
import { GoogleGenAI } from '@google/genai';

// Candidate models for graceful fallback if one experiences 503 high demand
const CANDIDATE_MODELS = [
  'gemini-3.8-flash',
  'gemini-flash-latest',
  'gemini-3.1-flash-lite',
];

// Model personas tailored for dheeraj-claude
function getSystemPromptForModel(
  modelId: string,
  customSystemPrompt?: string
): string {
  let modelPersona = '';

  switch (modelId) {
    case 'fable-5-1':
    case 'fable-5':
      modelPersona = `You are Fable 5.1, Anthropic's pinnacle intelligence designed for your toughest challenges.
CRITICAL IDENTITY REQUIREMENT:
- If asked what model you are, who you are, or what version you are running, you must ALWAYS state: "I am Fable 5.1, Anthropic's most advanced reasoning model."
- You excel at complex algorithmic reasoning, deep full-stack software architecture, and frontier engineering problems.`;
      break;

    case 'opus-5-5':
    case 'opus-5':
    case 'opus-4-8':
    case 'opus-4-7':
    case 'opus-4-6':
    case 'opus-3':
    case 'claude-3-opus':
      modelPersona = `You are Opus 5.5, Anthropic's most capable model for ambitious work, reasoning, and system architecture.
CRITICAL IDENTITY REQUIREMENT:
- If asked what model you are, who you are, or what version you are running, you must ALWAYS state: "I am Opus 5.5, Anthropic's most capable model for ambitious work and system architecture."
- You are renowned for deep coding acumen, architectural precision, thorough proofs, and nuanced engineering solutions.`;
      break;

    case 'sonnet-5':
    case 'sonnet-4-6':
    case 'claude-3-7-sonnet':
    case 'claude-3-5-sonnet':
    default:
      modelPersona = `You are Sonnet 5, Anthropic's premier flagship AI model (Sonnet 5).
CRITICAL IDENTITY REQUIREMENT:
- If asked what model you are, who you are, or what version you are running, you must ALWAYS state: "I am Sonnet 5, Anthropic's highly efficient and capable model designed for high-performance software development, creative design, and complex problem-solving."
- NEVER say you are "Sonnet 3.5", "Claude 3.5 Sonnet", "Sonnet 3.7", or "Claude 3.7". Under NO circumstance should you refer to yourself as Sonnet 3.5 or Claude 3.5.
- You excel at rapid, beautiful web design, modern UI with Tailwind CSS, clean TypeScript, and robust software engineering.`;
      break;

    case 'haiku-4-5':
    case 'claude-3-5-haiku':
      modelPersona = `You are Haiku 4.5, Anthropic's fastest model for quick answers.
CRITICAL IDENTITY REQUIREMENT:
- If asked what model you are, who you are, or what version you are running, you must ALWAYS state: "I am Haiku 4.5, Anthropic's fastest model for quick answers."
- NEVER say you are "Haiku 3.5" or "Claude 3.5 Haiku".
- You deliver instant, concise, razor-sharp code snippets, bug fixes, bash scripts, and regex patterns with minimal preamble.`;
      break;
  }

  let fullPrompt = `${modelPersona}

Core Capabilities & Guidelines:
1. Coding & Implementation:
   - Provide complete, runnable, fully self-contained code.
   - For web apps or UI components, write complete HTML/CSS/JavaScript with Tailwind CSS (via CDN) or modern web standards.
   - Always produce full, working code without truncating or leaving placeholders like "// implement here".
   - You format code in standard markdown code blocks with language annotations.

2. Personality & Voice:
   - Direct, thoughtful, knowledgeable, authentic Claude tone.
   - Never generate unnecessary conversational filler or preamble; get straight to solving the user's problem.
   - Format explanations with crisp markdown, clean typography, tables, and highlighted inline code.

3. Direct Responses (No Thought Tags):
   - Do NOT output any <thought> or </thought> tags.
   - Do NOT output internal monologues or thinking blocks.
   - Provide your direct, well-formulated response immediately.`;

  if (customSystemPrompt && typeof customSystemPrompt === 'string') {
    fullPrompt += `\n\nUser Custom Persona / Instructions:\n${customSystemPrompt}`;
  }

  return fullPrompt;
}

function sanitizeErrorMessage(err: any): string {
  if (!err) return 'An unexpected error occurred. Please try again.';

  let raw = err.message || String(err);
  try {
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

async function streamAnthropicChat({
  apiKey,
  model,
  systemInstruction,
  messages,
  onChunk,
}: {
  apiKey: string;
  model: string;
  systemInstruction: string;
  messages: Array<{ role: string; content: string; attachments?: any[] }>;
  onChunk: (text: string) => void;
}): Promise<string> {
  const anthropicMessages = messages.map(m => {
    let content = m.content || '';
    if (m.attachments && Array.isArray(m.attachments)) {
      for (const att of m.attachments) {
        if (att.type === 'code' || att.type === 'file') {
          content += `\n\n[Attached File: ${att.name || 'snippet'} (${att.language || 'text'})]\n\`\`\`${att.language || ''}\n${att.content}\n\`\`\`\n`;
        }
      }
    }
    return {
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: content.trim() || '...',
    };
  });

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: model || 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      system: systemInstruction,
      messages: anthropicMessages,
      stream: true,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Anthropic API error (${response.status}): ${errorBody}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No readable stream from Anthropic API');

  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data: ')) continue;
      const dataStr = trimmed.slice(6);
      if (dataStr === '[DONE]') continue;

      try {
        const parsed = JSON.parse(dataStr);
        if (
          parsed.type === 'content_block_delta' &&
          parsed.delta?.type === 'text_delta' &&
          parsed.delta?.text
        ) {
          fullText += parsed.delta.text;
          onChunk(parsed.delta.text);
        }
      } catch (e) {
        // skip non-json lines
      }
    }
  }

  return fullText;
}

export default async function handler(req: any, res: any) {
  // CORS setup
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method Not Allowed. Use POST.' }));
    return;
  }

  // Parse body
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (e) {}
  } else if (!body) {
    try {
      const buffers: Buffer[] = [];
      for await (const chunk of req) {
        buffers.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
      }
      const data = Buffer.concat(buffers).toString();
      body = JSON.parse(data);
    } catch (e) {}
  }

  const {
    messages,
    model = 'sonnet-5',
    customSystemPrompt,
    claudeApiKey: clientClaudeKey,
    claudeModel: clientClaudeModel,
    claudeFirstCount = 2,
  } = body || {};

  if (!messages || !Array.isArray(messages)) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Messages array is required.' }));
    return;
  }

  // Set up SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
  });

  const sendEvent = (event: string, data: any) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  const systemInstruction = getSystemPromptForModel(model, customSystemPrompt);

  // Stealth mode: user only sees Claude model identity, no backend engine exposed
  sendEvent('model_info', {
    claudeModel: model,
  });

  // Calculate assistant turns to decide whether to use Claude (turn 1 & 2) or Gemini (turn 3+)
  const priorAssistantCount = messages.filter((m: any) => m.role === 'assistant').length;
  const claudeKey = clientClaudeKey || process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY || '';
  const claudeModel = clientClaudeModel || process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022';
  const firstCountLimit = Number(claudeFirstCount) || 2;

  // RULE: First 2 messages use Claude API if configured; 3rd+ message switches to Gemini
  const shouldUseClaude = Boolean(claudeKey && priorAssistantCount < firstCountLimit);

  if (shouldUseClaude) {
    try {
      let claudeAccumulated = '';
      await streamAnthropicChat({
        apiKey: claudeKey,
        model: claudeModel,
        systemInstruction,
        messages,
        onChunk: chunkText => {
          claudeAccumulated += chunkText;
          sendEvent('chunk', { text: chunkText });
        },
      });

      sendEvent('done', { fullText: claudeAccumulated });
      res.end();
      return;
    } catch (claudeErr: any) {
      console.warn('[api/chat] Claude API error, falling back to Gemini engine:', claudeErr.message);
      // Fall through to Gemini execution below
    }
  }

  // Gemini Execution (From message 3 onwards OR if Claude key is not configured/fallback)
  // Gemini receives the COMPLETE messages history, so it has all knowledge of prior Claude responses!
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
  if (!apiKey) {
    sendEvent('error', {
      message:
        'GEMINI_API_KEY is not configured in Vercel Environment Variables. Please go to your Vercel Project -> Settings -> Environment Variables, add GEMINI_API_KEY, and redeploy.',
    });
    res.end();
    return;
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

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

    let responseStream: any = null;
    let firstChunk: any = null;
    let lastError: any = null;

    for (const candidateModel of CANDIDATE_MODELS) {
      try {
        const stream = await ai.models.generateContentStream({
          model: candidateModel,
          contents,
          config: {
            systemInstruction,
            temperature: model === 'claude-3-5-haiku' ? 0.3 : 0.7,
          },
        });

        const iterator = stream[Symbol.asyncIterator]();
        const first = await iterator.next();
        firstChunk = first;
        responseStream = iterator;
        break;
      } catch (err: any) {
        lastError = err;
        await new Promise(r => setTimeout(r, 250));
      }
    }

    if (!firstChunk) {
      throw lastError || new Error('All model candidates are currently experiencing high demand.');
    }

    let accumulatedText = '';
    if (firstChunk && !firstChunk.done && firstChunk.value) {
      const text = firstChunk.value.text || '';
      if (text) {
        accumulatedText += text;
        sendEvent('chunk', { text });
      }
    }

    if (responseStream) {
      while (true) {
        const next = await responseStream.next();
        if (next.done) break;
        const chunkText = next.value?.text || '';
        if (chunkText) {
          accumulatedText += chunkText;
          sendEvent('chunk', { text: chunkText });
        }
      }
    }

    sendEvent('done', { fullText: accumulatedText });
    res.end();
  } catch (error: any) {
    const cleanError = sanitizeErrorMessage(error);
    sendEvent('error', {
      message: cleanError,
    });
    res.end();
  }
}
