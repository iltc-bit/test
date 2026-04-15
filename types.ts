
export interface Platform {
  id: string;
  name: string;
  width: number;
  height: number;
  category: string;
  note?: string;
}

export type ProcessStatus = 'idle' | 'processing' | 'done' | 'error';

export interface ProcessState {
  status: ProcessStatus;
  message: string;
}
