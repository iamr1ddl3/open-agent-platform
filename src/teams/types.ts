export interface TeamConfig {
  id: string;
  name: string;
  description: string;
  leadAgentId: string;
  memberAgentIds: string[];
  strategy: 'sequential' | 'parallel' | 'delegated';
  maxRounds: number;
  createdAt: string;
  updatedAt?: string;
}

export interface TeamMessage {
  from: string;
  to: string;
  content: string;
  type: 'task' | 'result' | 'question' | 'delegation' | 'status';
  timestamp: string;
}

export interface SubTask {
  id: string;
  assignedTo: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  result?: string;
  error?: string;
  createdAt: string;
  completedAt?: string;
}

export interface TeamExecutionState {
  teamId: string;
  executionId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  task: string;
  messages: TeamMessage[];
  subTasks: SubTask[];
  results: Record<string, any>;
  round: number;
  startedAt: string;
  completedAt?: string;
  error?: string;
}

export interface TeamExecutionLog {
  executionId: string;
  teamId: string;
  task: string;
  status: 'success' | 'failure';
  duration: number;
  summary: string;
  createdAt: string;
}
