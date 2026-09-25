export type AppMessage = {
  role: 'user' | 'assistant';
  content: string;
  createdAt?: string;
};

export type StreamCallbacks = {
  onChunk: (text: string) => void;
  onError?: (err: Error) => void;
  onDone?: (fullText: string) => void;
};

export interface ChatProvider {
  name: 'anthropic' | 'gemini' | 'claude';
  generateReply(messages: AppMessage[], options?: { systemPrompt?: string }): Promise<string>;
  streamReply(
    messages: AppMessage[],
    callbacks: StreamCallbacks,
    options?: { systemPrompt?: string; signal?: AbortSignal }
  ): Promise<string>;
  isAvailable(): boolean;
}

export type RoutingResult = {
  provider: ChatProvider;
  providerName: 'anthropic' | 'gemini';
  userMessageIndex: number;
  reason: string;
};
