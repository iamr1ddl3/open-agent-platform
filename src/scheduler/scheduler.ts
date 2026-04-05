import { Schedule } from '../core/types';
import { v4 as uuidv4 } from 'uuid';
import * as cron from 'node-cron';

export class Scheduler {
  private jobs: Map<string, { schedule: Schedule; task: cron.ScheduledTask | null }> = new Map();

  createJob(config: any): Schedule {
    const job: Schedule = {
      id: uuidv4(),
      name: config.name,
      cronExpression: config.cronExpression,
      agentId: config.agentId,
      task: config.task,
      enabled: config.enabled ?? true,
    };

    if (job.enabled) {
      const cronTask = cron.schedule(job.cronExpression, () => {
        // Execute job
      });
      this.jobs.set(job.id, { schedule: job, task: cronTask });
    } else {
      this.jobs.set(job.id, { schedule: job, task: null });
    }

    return job;
  }

  toggleJob(jobId: string, enabled: boolean): void {
    const job = this.jobs.get(jobId);
    if (!job) throw new Error(`Job not found: ${jobId}`);

    if (enabled && !job.task) {
      job.task = cron.schedule(job.schedule.cronExpression, () => {
        // Execute job
      });
    } else if (!enabled && job.task) {
      job.task.stop();
      job.task = null;
    }
    job.schedule.enabled = enabled;
  }

  deleteJob(jobId: string): void {
    const job = this.jobs.get(jobId);
    if (job?.task) {
      job.task.stop();
    }
    this.jobs.delete(jobId);
  }

  listJobs(): Schedule[] {
    return Array.from(this.jobs.values()).map(j => j.schedule);
  }
}
