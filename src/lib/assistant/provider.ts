import type { Json } from '../domain/model';
export type AssistantContext = {
  scene: string;
  participants: string[];
  state: Record<string, Json>;
  question: string;
};
export interface AssistantProvider {
  readonly name: string;
  suggest(
    context: AssistantContext,
    signal?: AbortSignal
  ): Promise<{ text: string; proposedChanges: Json[] }>;
}
// Providers run on the server. Suggestions must be reviewed before applying domain mutations.
export type AssistantSettings = {
  enabled: false;
  provider: 'local-compatible' | 'openai-compatible';
  endpoint: string;
};
export const defaultAssistantSettings: AssistantSettings = {
  enabled: false,
  provider: 'local-compatible',
  endpoint: 'http://localhost:11434/v1'
};
