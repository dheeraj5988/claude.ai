export type ModelId =
  | 'fable-5-1'
  | 'opus-5-5'
  | 'sonnet-5'
  | 'haiku-4-5'
  | 'fable-5'
  | 'opus-5'
  | 'opus-4-8'
  | 'opus-4-7'
  | 'opus-4-6'
  | 'opus-3'
  | 'sonnet-4-6';

export type EffortLevel = 'Low' | 'Medium' | 'High' | 'Extra' | 'Max';

export interface ModelOption {
  id: ModelId;
  name: string;
  subtitle: string;
  badge?: string;
  upgradeBadge?: string;
}

export interface Attachment {
  id: string;
  name: string;
  language: string;
  content: string;
  size?: number;
  lineCount?: number;
  type: 'code' | 'file';
}

export interface Artifact {
  id: string;
  title: string;
  filename: string;
  language: string;
  code: string;
  userEditedCode?: string;
  type: 'code' | 'web-app' | 'svg' | 'markdown' | 'script';
  messageId: string;
  version: number;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  rawContent?: string;
  thought?: string;
  thoughtDurationSeconds?: number;
  isThinking?: boolean;
  attachments?: Attachment[];
  artifacts?: Artifact[];
  timestamp: number;
  status?: 'sending' | 'streaming' | 'completed' | 'error';
  error?: string;
  modelUsed?: string;
  effortUsed?: EffortLevel;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
  isPinned?: boolean;
  model: ModelId;
  effort: EffortLevel;
  thinkingEnabled: boolean;
  customSystemPrompt?: string;
}

export interface ConsoleEntry {
  id: string;
  type: 'log' | 'info' | 'warn' | 'error';
  content: string;
  timestamp: string;
}
