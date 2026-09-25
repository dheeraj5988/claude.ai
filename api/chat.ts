import type { IncomingMessage, ServerResponse } from 'http';
import { ProviderRouter } from '../server/providers/router';
import { AppMessage } from '../server/providers/types';
import { validateRequest, recordRequestStart, recordRequestSuccess, recordRequestFailure } from '../server/limits';

function getSystemPrompt(customSystemPrompt?: string): string {
  const base = `You are Claude, an advanced, intelligent coding assistant and creative AI workspace.
Core Capabilities & Guidelines:
1. Coding & Implementation:
   - Provide complete, runnable, fully self-contained code.
   - For web applications or UI components, produce clean, modern HTML/CSS/JavaScript with Tailwind CSS or modern standards.
   - Never truncate code or leave empty placeholders.
   - Format code in standard markdown code blocks with language annotations.
2. Tone & Architecture:
   - Thoughtful, direct, articulate, and highly capable.
   - Structure explanations with crisp markdown, clean typography, tables, and highlighted inline code.`;

  if (customSystemPrompt && customSystemPrompt.trim()) {
    return `${base}\n\nCustom Instructions:\n${customSystemPrompt.trim()}`;
  }
  return base;
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      res.status(400).json({ error: 'Invalid JSON body' });
      return;
    }
  }

  const {
    messages,
    userId = 'anonymous_user',
    userMessageCount: providedUserCount,
    customSystemPrompt,
    claudeApiKey: customClaudeKey,
    claudeModel,
    isAdmin = false,
  } = body || {};

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'Messages array is required.' });
    return;
  }

  const latestUserMsg = [...messages].reverse().find(m => m.role === 'user');
  const userContent = latestUserMsg ? latestUserMsg.content : '';

  const validation = validateRequest(userId, userContent, messages.length, Boolean(isAdmin));
  if (!validation.allowed) {
    res.status(validation.status).json({
      error: validation.error,
      code: validation.code,
    });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');

  const sendEvent = (event: string, data: any) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  recordRequestStart(userId);

  const router = new ProviderRouter({
    customClaudeKey,
    claudeModel,
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
  const systemPrompt = getSystemPrompt(customSystemPrompt);

  let accumulatedResponse = '';

  try {
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
      }
    );

    recordRequestSuccess(userId);
    sendEvent('done', {
      fullText: accumulatedResponse,
      provider: routing.providerName,
      userMessageIndex: routing.userMessageIndex,
    });
    res.end();
  } catch (err: any) {
    if (routing.providerName === 'anthropic') {
      try {
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
          }
        );
        recordRequestSuccess(userId);
        sendEvent('done', {
          fullText: accumulatedResponse,
          provider: 'gemini',
          fallback: true,
        });
        res.end();
        return;
      } catch (fallbackErr: any) {
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
      error: err.message || 'An upstream error occurred. Please try again.',
    });
    res.end();
  }
}
