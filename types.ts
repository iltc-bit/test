
export interface JournalMetadata {
  id: string;
  name: string;
  url: string;
  description: string;
  rulesSummary: string;
}

export interface ProcessingState {
  status: 'idle' | 'reading' | 'analyzing' | 'generating' | 'completed' | 'error';
  message: string;
  error?: string;
}

export interface FormattedDocument {
  title: string;
  references: string[];
}
