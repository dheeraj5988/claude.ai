import { GoogleGenAI } from '@google/genai';
import { AppMessage, ChatProvider, StreamCallbacks } from './types';

const CANDIDATE_GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-3.8-flash',
  'gemini-flash-latest',
  'gemini-3.1-flash-lite',
];

export class GeminiProvider implements ChatProvider {
  name: 'gemini' = 'gemini';
  private apiKeys: string[] = [];
  private preferredModel?: string;

  constructor(apiKey?: string, additionalKeys?: string[], preferredModel?: string) {
    const keys: string[] = [];
    if (apiKey && apiKey.trim()) {
      keys.push(apiKey.trim());
    }
    if (additionalKeys && Array.isArray(additionalKeys)) {
      for (const k of additionalKeys) {
        if (k && typeof k === 'string' && k.trim() && !keys.includes(k.trim())) {
          keys.push(k.trim());
        }
      }
    }
    const envKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
    if (envKey && !keys.includes(envKey.trim())) {
      keys.push(envKey.trim());
    }

    this.apiKeys = keys;
    this.preferredModel = preferredModel;
  }

  isAvailable(): boolean {
    return this.apiKeys.length > 0;
  }

  getKeyCount(): number {
    return this.apiKeys.length;
  }

  /**
   * Transforms full multi-turn conversation history (including initial Claude responses)
   * into alternating user/model content structures for the Gemini API.
   * This ensures 100% context retention when handing off from Claude to Gemini.
   */
  private formatContents(messages: AppMessage[]): { role: 'user' | 'model'; parts: { text: string }[] }[] {
    const valid = messages
      .filter(m => m.content && m.content.trim().length > 0)
      .map(m => ({
        role: (m.role === 'assistant' ? 'model' : 'user') as 'user' | 'model',
        parts: [{ text: m.content.trim() }],
      }));

    if (valid.length === 0) {
      return [{ role: 'user', parts: [{ text: 'Hello' }] }];
    }

    // Ensure valid alternation and starts with user
    const contents: { role: 'user' | 'model'; parts: { text: string }[] }[] = [];
    for (const msg of valid) {
      if (contents.length === 0) {
        if (msg.role === 'user') {
          contents.push({ ...msg });
        } else {
          contents.push({ role: 'user', parts: [{ text: 'Hello' }] });
          contents.push({ ...msg });
        }
      } else {
        const last = contents[contents.length - 1];
        if (last.role === msg.role) {
          last.parts[0].text += `\n\n${msg.parts[0].text}`;
        } else {
          contents.push({ ...msg });
        }
      }
    }

    return contents;
  }

  private getModelList(): string[] {
    const list: string[] = [];
    if (this.preferredModel && !list.includes(this.preferredModel)) {
      list.push(this.preferredModel);
    }
    for (const m of CANDIDATE_GEMINI_MODELS) {
      if (!list.includes(m)) {
        list.push(m);
      }
    }
    return list;
  }

  async generateReply(
    messages: AppMessage[],
    options?: { systemPrompt?: string }
  ): Promise<string> {
    if (!this.isAvailable()) {
      throw new Error('No Google Gemini API key configured in Admin Panel or environment.');
    }

    const contents = this.formatContents(messages);
    const models = this.getModelList();
    let lastError: any = null;

    // Iterate through configured keys pool
    for (let keyIdx = 0; keyIdx < this.apiKeys.length; keyIdx++) {
      const activeKey = this.apiKeys[keyIdx];
      const ai = new GoogleGenAI({
        apiKey: activeKey,
        httpOptions: {
          headers: {
            'User-Agent': 'claude-ai-workspace',
          },
        },
      });

      for (const model of models) {
        try {
          const response = await ai.models.generateContent({
            model,
            contents: contents as any,
            config: options?.systemPrompt
              ? { systemInstruction: options.systemPrompt }
              : undefined,
          });

          if (response && response.text) {
            return response.text;
          }
        } catch (err: any) {
          lastError = err;
          console.warn(
            `[Claude Backend] Gemini Key #${keyIdx + 1} with model ${model} failed:`,
            err.message
          );
        }
      }
    }

    throw new Error(`All Gemini keys and candidate models failed: ${lastError?.message || 'Unknown error'}`);
  }

  async streamReply(
    messages: AppMessage[],
    callbacks: StreamCallbacks,
    options?: { systemPrompt?: string; signal?: AbortSignal }
  ): Promise<string> {
    if (!this.isAvailable()) {
      throw new Error('No Google Gemini API key configured in Admin Panel or environment.');
    }

    const contents = this.formatContents(messages);
    const models = this.getModelList();
    let lastError: any = null;

    // Failover across multiple Gemini API keys configured in the Admin Panel pool
    for (let keyIdx = 0; keyIdx < this.apiKeys.length; keyIdx++) {
      if (options?.signal?.aborted) {
        throw new Error('Request aborted by client');
      }

      const activeKey = this.apiKeys[keyIdx];
      const ai = new GoogleGenAI({
        apiKey: activeKey,
        httpOptions: {
          headers: {
            'User-Agent': 'claude-ai-workspace',
          },
        },
      });

      for (const model of models) {
        try {
          if (options?.signal?.aborted) {
            throw new Error('Request aborted by client');
          }

          const stream = await ai.models.generateContentStream({
            model,
            contents: contents as any,
            config: options?.systemPrompt
              ? { systemInstruction: options.systemPrompt }
              : undefined,
          });

          // Test first chunk to ensure stream connection is valid
          let firstChunk: any = null;
          for await (const chunk of stream) {
            firstChunk = chunk;
            break;
          }

          let fullText = '';
          if (firstChunk?.text) {
            fullText += firstChunk.text;
            callbacks.onChunk(firstChunk.text);
          }

          for await (const chunk of stream) {
            if (options?.signal?.aborted) {
              throw new Error('Request aborted by client');
            }
            if (chunk.text) {
              fullText += chunk.text;
              callbacks.onChunk(chunk.text);
            }
          }

          callbacks.onDone?.(fullText);
          return fullText;
        } catch (err: any) {
          if (options?.signal?.aborted) {
            throw err;
          }
          lastError = err;
          console.warn(
            `[Claude Backend] Gemini Key #${keyIdx + 1} with model ${model} failed, testing failover:`,
            err.message
          );
        }
      }
    }

    throw new Error(`All Gemini keys in the pool failed: ${lastError?.message || 'Unknown error'}`);
  }
}
