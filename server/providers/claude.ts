import { AppMessage, ChatProvider, StreamCallbacks } from './types';

export class ClaudeProvider implements ChatProvider {
  name: 'anthropic' = 'anthropic';
  private apiKey: string;
  private model: string;

  constructor(apiKey?: string, model?: string) {
    this.apiKey = apiKey || process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY || '';
    this.model = model || process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022';
  }

  isAvailable(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  /**
   * Sanitizes message list for Anthropic API:
   * 1. Must start with a user message.
   * 2. Roles must strictly alternate between 'user' and 'assistant'.
   * 3. Merges consecutive messages of the same role.
   */
  private formatMessages(messages: AppMessage[]): { role: 'user' | 'assistant'; content: string }[] {
    const valid = messages
      .filter(m => m.content && m.content.trim().length > 0)
      .map(m => ({
        role: m.role,
        content: m.content.trim(),
      }));

    if (valid.length === 0) {
      return [{ role: 'user', content: 'Hello' }];
    }

    // Ensure starts with user
    const formatted: { role: 'user' | 'assistant'; content: string }[] = [];
    for (const msg of valid) {
      if (formatted.length === 0) {
        if (msg.role === 'user') {
          formatted.push({ ...msg });
        } else {
          // If first message is assistant, prepend a generic user greeting
          formatted.push({ role: 'user', content: 'Hello' });
          formatted.push({ ...msg });
        }
      } else {
        const last = formatted[formatted.length - 1];
        if (last.role === msg.role) {
          last.content += `\n\n${msg.content}`;
        } else {
          formatted.push({ ...msg });
        }
      }
    }

    return formatted;
  }

  async generateReply(
    messages: AppMessage[],
    options?: { systemPrompt?: string }
  ): Promise<string> {
    if (!this.isAvailable()) {
      throw new Error('Anthropic Claude API key is not configured.');
    }

    const payloadMessages = this.formatMessages(messages);
    const body: Record<string, unknown> = {
      model: this.model,
      max_tokens: 4096,
      messages: payloadMessages,
    };

    if (options?.systemPrompt) {
      body.system = options.systemPrompt;
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text();
      let parsedMessage = errText;
      try {
        const parsed = JSON.parse(errText);
        parsedMessage = parsed.error?.message || errText;
      } catch {
        // use raw errText
      }
      throw new Error(`Anthropic API error (${response.status}): ${parsedMessage}`);
    }

    const data = await response.json();
    const textBlock = data.content?.find((c: { type: string; text?: string }) => c.type === 'text');
    return textBlock?.text || '';
  }

  async streamReply(
    messages: AppMessage[],
    callbacks: StreamCallbacks,
    options?: { systemPrompt?: string; signal?: AbortSignal }
  ): Promise<string> {
    if (!this.isAvailable()) {
      throw new Error('Anthropic Claude API key is not configured.');
    }

    const payloadMessages = this.formatMessages(messages);
    const body: Record<string, unknown> = {
      model: this.model,
      max_tokens: 4096,
      stream: true,
      messages: payloadMessages,
    };

    if (options?.systemPrompt) {
      body.system = options.systemPrompt;
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: options?.signal,
    });

    if (!response.ok) {
      const errText = await response.text();
      let parsedMessage = errText;
      try {
        const parsed = JSON.parse(errText);
        parsedMessage = parsed.error?.message || errText;
      } catch {
        // use raw errText
      }
      throw new Error(`Anthropic API error (${response.status}): ${parsedMessage}`);
    }

    if (!response.body) {
      throw new Error('Anthropic API returned empty response body.');
    }

    let fullText = '';
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data:')) continue;
          const dataStr = trimmed.slice(5).trim();
          if (dataStr === '[DONE]') continue;

          try {
            const event = JSON.parse(dataStr);
            if (event.type === 'content_block_delta' && event.delta?.text) {
              const delta = event.delta.text;
              fullText += delta;
              callbacks.onChunk(delta);
            } else if (event.type === 'error') {
              throw new Error(event.error?.message || 'Anthropic stream error');
            }
          } catch (e: any) {
            if (e.message && e.message.includes('Anthropic stream error')) {
              throw e;
            }
            // non-fatal JSON parse error for partial lines
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    callbacks.onDone?.(fullText);
    return fullText;
  }
}
