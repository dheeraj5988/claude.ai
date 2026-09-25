import { AppMessage, ChatProvider, RoutingResult } from './types';
import { ClaudeProvider } from './claude';
import { GeminiProvider } from './gemini';

export interface RouterOptions {
  customClaudeKey?: string;
  customGeminiKey?: string;
  geminiApiKeys?: string[];
  claudeModel?: string;
  geminiModel?: string;
  claudeFirstCount?: number;
}

export class ProviderRouter {
  private claudeProvider: ClaudeProvider;
  private geminiProvider: GeminiProvider;
  private claudeFirstCount: number;

  constructor(options?: RouterOptions) {
    this.claudeProvider = new ClaudeProvider(options?.customClaudeKey, options?.claudeModel);
    this.geminiProvider = new GeminiProvider(
      options?.customGeminiKey,
      options?.geminiApiKeys,
      options?.geminiModel
    );
    this.claudeFirstCount =
      typeof options?.claudeFirstCount === 'number' && options.claudeFirstCount >= 1
        ? options.claudeFirstCount
        : 2;
  }

  /**
   * Calculates the number of previous user messages in the conversation
   * (excluding the latest pending user message being responded to).
   *
   * Dynamic Routing Logic:
   * - User message count < claudeFirstCount (default: 0 and 1) → Anthropic Claude API
   * - User message count >= claudeFirstCount (from count 2 onwards) → Google Gemini Multi-Key Pool
   * - Full context from all previous Claude & user turns is passed seamlessly into Gemini.
   */
  resolveProvider(
    messages: AppMessage[],
    providedCount?: number
  ): RoutingResult {
    let priorUserCount = 0;

    if (typeof providedCount === 'number' && providedCount >= 0) {
      priorUserCount = providedCount;
    } else {
      const userMessages = messages.filter(m => m.role === 'user');
      priorUserCount = Math.max(0, userMessages.length - 1);
    }

    if (priorUserCount < this.claudeFirstCount) {
      // Prior user messages under threshold (e.g. first 2 messages) → Anthropic Claude
      if (this.claudeProvider.isAvailable()) {
        return {
          provider: this.claudeProvider,
          providerName: 'anthropic',
          userMessageIndex: priorUserCount,
          reason: `User message count is ${priorUserCount} (< ${this.claudeFirstCount}) -> routed to Anthropic Claude`,
        };
      } else {
        // Fallback to Gemini if Anthropic key is unconfigured
        return {
          provider: this.geminiProvider,
          providerName: 'gemini',
          userMessageIndex: priorUserCount,
          reason: `User message count is ${priorUserCount}, Anthropic key unconfigured -> fallback to Gemini`,
        };
      }
    }

    // From threshold (e.g. 2 messages) onwards → Google Gemini Multi-Key Pool with full prior context
    return {
      provider: this.geminiProvider,
      providerName: 'gemini',
      userMessageIndex: priorUserCount,
      reason: `User message count is ${priorUserCount} (>= ${this.claudeFirstCount}) -> routed to Gemini multi-key pool`,
    };
  }

  getClaudeProvider(): ClaudeProvider {
    return this.claudeProvider;
  }

  getGeminiProvider(): GeminiProvider {
    return this.geminiProvider;
  }

  getThreshold(): number {
    return this.claudeFirstCount;
  }
}
