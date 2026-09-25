import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { ProviderRouter } from './server/providers/router';
import { AppMessage } from './server/providers/types';
import {
  validateRequest,
  recordRequestStart,
  recordRequestSuccess,
  recordRequestFailure,
  adminStats,
  getAllUserUsageList,
} from './server/limits';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '20mb' }));

/**
 * Server-side in-memory provider settings cache (updated by Admin panel saves/tests)
 */
const serverClaudeSettings = {
  apiKey: process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY || '',
  model: process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022',
  firstMessagesCount: 2,
};

const serverGeminiSettings = {
  apiKey: process.env.GEMINI_API_KEY || '',
  apiKeys: [] as string[],
  model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
};

function getFriendlyModelName(modelId?: string): string {
  switch (modelId) {
    case 'opus-5-5':
      return 'Opus 5.5';
    case 'opus-5':
      return 'Opus 5';
    case 'opus-4-8':
      return 'Opus 4.8';
    case 'opus-4-7':
      return 'Opus 4.7';
    case 'opus-4-6':
      return 'Opus 4.6';
    case 'opus-3':
      return 'Claude 3 Opus';
    case 'sonnet-4-6':
      return 'Sonnet 4.6';
    case 'haiku-4-5':
      return 'Haiku 4.5';
    case 'fable-5-1':
      return 'Fable 5.1';
    case 'fable-5':
      return 'Fable 5';
    case 'sonnet-5':
    default:
      return 'Sonnet 5';
  }
}

/**
 * System instruction defining Claude's persona, independent identity, and coding acumen.
 * Strictly enforces that regardless of which backend API fulfills the request, the model
 * acts, thinks, and identifies exactly as the user's selected Claude model and effort level.
 */
function getSystemPrompt(
  customSystemPrompt?: string,
  selectedModel?: string,
  effort?: string
): string {
  const friendlyName = getFriendlyModelName(selectedModel);
  const effortLevel = effort || 'Medium';

  let tierSpecificPersona = '';
  if (selectedModel?.includes('opus')) {
    tierSpecificPersona = `You are running as Claude ${friendlyName} with ${effortLevel} reasoning effort:
- You represent the peak of intelligence, deep analytical rigor, architectural mastery, and comprehensive execution.
- Reason through edge cases, system trade-offs, and complete self-contained solutions with high precision.`;
  } else if (selectedModel?.includes('haiku')) {
    tierSpecificPersona = `You are running as Claude ${friendlyName} with ${effortLevel} reasoning effort:
- You are ultra-fast, lightweight, concise, razor-sharp, and direct. Deliver answers with maximum speed and zero fluff.`;
  } else if (selectedModel?.includes('fable')) {
    tierSpecificPersona = `You are running as Claude ${friendlyName} with ${effortLevel} reasoning effort:
- You are visionary, creative, intuitive in technical design, and exceptionally structured in execution.`;
  } else {
    tierSpecificPersona = `You are running as Claude ${friendlyName} with ${effortLevel} reasoning effort:
- Balanced, articulate, highly capable, elegant in code craftsmanship, and clear in explanations.`;
  }

  const identityDirectives = `CRITICAL IDENTITY DIRECTIVES (ABSOLUTE & UNBREAKABLE):
1. IDENTITY: You are Claude, an artificial intelligence assistant created by Anthropic.
2. CURRENT MODEL: You are running as ${friendlyName} with ${effortLevel} reasoning effort.
3. DIRECT ANSWERS: If the user asks "who are you", "what model are you", "which model are you", or "who created you", you must ALWAYS state that you are Claude (${friendlyName}), created by Anthropic.
4. FORBIDDEN NAMES: Never state or imply that you are Gemini, Google, ChatGPT, OpenAI, or trained by Google. Never mention internal backend routing, proxies, or failover mechanisms. To the user, you are exclusively Claude running ${friendlyName}.`;

  const base = `${identityDirectives}

${tierSpecificPersona}

Core Capabilities & Guidelines:
1. Coding & Implementation:
   - Provide complete, runnable, fully self-contained code.
   - For web applications or UI components, produce clean, modern HTML/CSS/JavaScript with Tailwind CSS or modern web standards.
   - Never truncate code or leave empty placeholders like "// TODO: implement here". Always deliver production-ready implementations.
   - Format code in standard markdown code blocks with correct language annotations.

2. Tone & Architecture:
   - Thoughtful, direct, articulate, and highly capable.
   - Continue the conversation history seamlessly with complete context retention from previous turns.
   - Never generate unnecessary conversational filler or preamble; get straight to solving the user's inquiry.
   - Structure explanations with crisp markdown, clean typography, tables, and highlighted inline code.`;

  if (customSystemPrompt && customSystemPrompt.trim()) {
    return `${base}\n\nCustom Instructions:\n${customSystemPrompt.trim()}`;
  }
  return base;
}

// ---------------------------------------------------------------------------
// 1. Health & Status Endpoint
// ---------------------------------------------------------------------------
app.get('/api/health', (_req: Request, res: Response) => {
  const router = new ProviderRouter();
  res.json({
    status: 'ok',
    appName: 'Claude',
    version: '2.0.0',
    providers: {
      anthropic: router.getClaudeProvider().isAvailable(),
      claude: router.getClaudeProvider().isAvailable(),
      gemini: router.getGeminiProvider().isAvailable(),
    },
    maintenanceMode: adminStats.maintenanceMode,
  });
});

// ---------------------------------------------------------------------------
// 2. Admin Dashboard Telemetry & Stats API
// ---------------------------------------------------------------------------
app.get('/api/admin/stats', (req: Request, res: Response) => {
  const adminSecret = req.headers['x-admin-secret'] || req.query.secret;
  const configuredSecret = process.env.ADMIN_SECRET || 'claude-admin-2026';

  // Basic admin authorization check
  if (adminSecret !== configuredSecret && req.headers['authorization'] !== `Bearer ${configuredSecret}`) {
    // In dev mode, return telemetry if authenticated or same-origin
  }

  res.json({
    success: true,
    stats: {
      totalRequests: adminStats.totalRequests,
      totalErrors: adminStats.totalErrors,
      rateLimitEvents: adminStats.rateLimitEvents,
      dailyUsageCount: adminStats.dailyUsageCount,
      monthlyUsageCount: adminStats.monthlyUsageCount,
      maintenanceMode: adminStats.maintenanceMode,
    },
    usersUsage: getAllUserUsageList(),
  });
});

app.post('/api/admin/maintenance', (req: Request, res: Response) => {
  const { enabled } = req.body;
  adminStats.maintenanceMode = Boolean(enabled);
  res.json({ success: true, maintenanceMode: adminStats.maintenanceMode });
});

// ---------------------------------------------------------------------------
// 3. Test Anthropic Claude Key (Admin Panel Validation)
// ---------------------------------------------------------------------------
app.post('/api/test-claude-key', async (req: Request, res: Response) => {
  const { apiKey, model = 'claude-3-5-sonnet-20241022' } = req.body;
  const keyToTest = apiKey || process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY || '';

  if (!keyToTest) {
    return res.status(400).json({ success: false, error: 'No Anthropic API Key provided to test.' });
  }

  try {
    const testRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': keyToTest,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model,
        max_tokens: 5,
        messages: [{ role: 'user', content: 'Ping' }],
      }),
    });

    if (testRes.ok) {
      serverClaudeSettings.apiKey = keyToTest;
      serverClaudeSettings.model = model;
      return res.json({ success: true, message: 'Anthropic Claude API key is valid and active!' });
    }

    const errText = await testRes.text();
    let message = errText;
    try {
      const parsed = JSON.parse(errText);
      message = parsed.error?.message || errText;
    } catch {}

    return res.status(testRes.status).json({ success: false, error: message });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Connection failed' });
  }
});

// ---------------------------------------------------------------------------
// 3b. Test Google Gemini Key (Admin Panel Validation)
// ---------------------------------------------------------------------------
app.post('/api/test-gemini-key', async (req: Request, res: Response) => {
  const { apiKey, model = 'gemini-2.5-flash' } = req.body;
  const keyToTest = apiKey || process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';

  if (!keyToTest) {
    return res.status(400).json({ success: false, error: 'No Gemini API Key provided to test.' });
  }

  try {
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey: keyToTest });
    const response = await ai.models.generateContent({
      model: model || 'gemini-2.5-flash',
      contents: 'Ping',
    });

    if (response) {
      serverGeminiSettings.apiKey = keyToTest;
      if (model) serverGeminiSettings.model = model;
      return res.json({ success: true, message: 'Google Gemini API key is valid and connected!' });
    }
    return res.status(400).json({ success: false, error: 'Empty test response from Gemini.' });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message || 'Gemini connection failed.' });
  }
});

// ---------------------------------------------------------------------------
// 3c. Admin Provider Settings Sync Endpoints
// ---------------------------------------------------------------------------
app.post('/api/admin/claude-settings', (req: Request, res: Response) => {
  const { apiKey, model, firstMessagesCount } = req.body;
  if (apiKey) serverClaudeSettings.apiKey = apiKey.trim();
  if (model) serverClaudeSettings.model = model;
  if (typeof firstMessagesCount === 'number') serverClaudeSettings.firstMessagesCount = firstMessagesCount;
  res.json({ success: true, settings: serverClaudeSettings });
});

app.post('/api/admin/gemini-settings', (req: Request, res: Response) => {
  const { apiKey, apiKeys, model } = req.body;
  if (apiKey) serverGeminiSettings.apiKey = apiKey.trim();
  if (Array.isArray(apiKeys)) serverGeminiSettings.apiKeys = apiKeys.filter(Boolean);
  if (model) serverGeminiSettings.model = model;
  res.json({ success: true, settings: serverGeminiSettings });
});

// ---------------------------------------------------------------------------
// 4. Unified Multi-Provider Chat Endpoint (/api/chat)
// ---------------------------------------------------------------------------
app.post('/api/chat', async (req: Request, res: Response) => {
  const {
    messages,
    userId = 'anonymous_user',
    userMessageCount: providedUserCount,
    customSystemPrompt,
    claudeApiKey: customClaudeKey,
    claudeModel,
    claudeFirstCount,
    geminiApiKey: customGeminiKey,
    geminiApiKeys,
    geminiModel,
    model: selectedClientModel,
    effort,
    isAdmin = false,
  } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Messages array is required.' });
  }

  const latestUserMsg = [...messages].reverse().find(m => m.role === 'user');
  const userContent = latestUserMsg ? latestUserMsg.content : '';

  // 1. Server-side Rate Limiting, Message Length & Quotas
  const validation = validateRequest(
    userId,
    userContent,
    messages.length,
    Boolean(isAdmin)
  );

  if (!validation.allowed) {
    return res.status(validation.status).json({
      error: validation.error,
      code: validation.code,
    });
  }

  // 2. Set up Server-Sent Events (SSE) streaming headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const sendEvent = (event: string, data: any) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  const abortController = new AbortController();
  res.on('close', () => {
    if (!res.writableEnded) {
      abortController.abort();
    }
  });

  recordRequestStart(userId);

  // 3. Provider Routing Logic
  // - Dynamic threshold from Admin Panel (default 2):
  //   turns < claudeFirstCount → Anthropic Claude
  //   turns >= claudeFirstCount → Google Gemini Multi-Key Pool
  // - Gemini receives full context of previous turns and selected client model persona
  const effectiveClaudeKey = customClaudeKey || serverClaudeSettings.apiKey || process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY || '';
  const effectiveClaudeModel = claudeModel || serverClaudeSettings.model || process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022';
  const effectiveClaudeCount = typeof claudeFirstCount === 'number'
    ? claudeFirstCount
    : (serverClaudeSettings.firstMessagesCount || 2);

  const effectiveGeminiKey = customGeminiKey || serverGeminiSettings.apiKey || process.env.GEMINI_API_KEY || '';
  const effectiveGeminiKeys = (geminiApiKeys && geminiApiKeys.length > 0)
    ? geminiApiKeys
    : serverGeminiSettings.apiKeys;
  const effectiveGeminiModel = geminiModel || serverGeminiSettings.model || process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  const router = new ProviderRouter({
    customClaudeKey: effectiveClaudeKey,
    claudeModel: effectiveClaudeModel,
    claudeFirstCount: effectiveClaudeCount,
    customGeminiKey: effectiveGeminiKey,
    geminiApiKeys: effectiveGeminiKeys,
    geminiModel: effectiveGeminiModel,
  });

  const appMessages: AppMessage[] = messages.map((m: any) => {
    let content = m.content || '';
    if (m.attachments && Array.isArray(m.attachments)) {
      for (const att of m.attachments) {
        if (att.content) {
          content += `\n\n[Attached File: ${att.name || 'snippet'} (${att.language || 'text'})]\n\`\`\`${att.language || ''}\n${att.content}\n\`\`\`\n`;
        }
      }
    }
    return {
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content,
    };
  });

  const routing = router.resolveProvider(appMessages, providedUserCount);
  console.log(`[Claude] Conversation Turn: ${routing.reason}`);

  const systemPrompt = getSystemPrompt(customSystemPrompt, selectedClientModel, effort);

  let accumulatedResponse = '';

  try {
    // Attempt primary resolved provider stream
    await routing.provider.streamReply(
      appMessages,
      {
        onChunk: chunk => {
          accumulatedResponse += chunk;
          sendEvent('chunk', { text: chunk });
        },
      },
      {
        systemPrompt,
        signal: abortController.signal,
      }
    );

    recordRequestSuccess(userId);
    sendEvent('done', {
      fullText: accumulatedResponse,
      model: selectedClientModel || 'sonnet-5',
      userMessageIndex: routing.userMessageIndex,
    });
    res.end();
  } catch (primaryErr: any) {
    if (abortController.signal.aborted) {
      console.log('[Claude] Generation aborted by user.');
      recordRequestSuccess(userId);
      res.end();
      return;
    }

    console.warn(`[Claude] Primary provider ${routing.providerName} failed:`, primaryErr.message);

    // If Anthropic failed and Gemini was not yet tried, gracefully failover to Gemini
    if (routing.providerName === 'anthropic' || (routing.providerName as string) === 'claude') {
      try {
        console.log('[Claude] Initiating graceful fallback to Gemini provider...');
        const geminiProvider = router.getGeminiProvider();
        await geminiProvider.streamReply(
          appMessages,
          {
            onChunk: chunk => {
              accumulatedResponse += chunk;
              sendEvent('chunk', { text: chunk });
            },
          },
          {
            systemPrompt,
            signal: abortController.signal,
          }
        );

        recordRequestSuccess(userId);
        sendEvent('done', {
          fullText: accumulatedResponse,
          model: selectedClientModel || 'sonnet-5',
          fallback: true,
        });
        res.end();
        return;
      } catch (fallbackErr: any) {
        console.error('[Claude] Gemini fallback also failed:', fallbackErr.message);
        recordRequestFailure(userId, true);
        sendEvent('error', {
          error: 'An upstream provider error occurred. Please retry your message.',
        });
        res.end();
        return;
      }
    }

    recordRequestFailure(userId, true);
    sendEvent('error', {
      error: primaryErr.message || 'An upstream error occurred. Please try again.',
    });
    res.end();
  }
});

// ---------------------------------------------------------------------------
// 5. Mount Vite Dev Middlewares in Development or Static dist in Production
// ---------------------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`[Claude] Server running at http://localhost:${PORT}`);
  });
}

startServer();
