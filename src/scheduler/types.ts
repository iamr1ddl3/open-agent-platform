export interface ScheduleJob {
  id: string;
  name: string;
  description: string;
  agentId: string;
  task: string;
  schedule: string;
  cronExpression: string;
  enabled: boolean;
  lastRun?: string;
  nextRun?: string;
  lastResult?: string;
  lastError?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ScheduleLog {
  id: string;
  jobId: string;
  executedAt: string;
  status: 'success' | 'failure';
  result?: string;
  error?: string;
  duration: number;
}

export interface CronSchedule {
  minute: number[];
  hour: number[];
  dayOfMonth: number[];
  month: number[];
  dayOfWeek: number[];
}
