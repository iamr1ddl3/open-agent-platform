import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useStore, Automation } from '../store';
import './AutomationForm.css';

interface AutomationFormProps {
  automation?: Automation;
  onClose: () => void;
}

export function AutomationForm({ automation, onClose }: AutomationFormProps) {
  const [name, setName] = useState(automation?.name || '');
  const [description, setDescription] = useState(automation?.description || '');
  const [agentId, setAgentId] = useState(automation?.agentId || '');
  const [taskPrompt, setTaskPrompt] = useState(automation?.taskPrompt || '');
  const [schedule, setSchedule] = useState(automation?.schedule || 'daily');
  const [cronExpression, setCronExpression] = useState(automation?.cronExpression || '0 9 * * *');

  const agents = useStore((state) => state.agents);
  const addAutomation = useStore((state) => state.addAutomation);
  const updateAutomation = useStore((state) => state.updateAutomation);

  const schedulePresets: Record<string, string> = {
    hourly: '0 * * * *',
    daily: '0 9 * * *',
    weekly: '0 9 * * 0',
    monthly: '0 9 1 * *',
  };

  const handleScheduleChange = (value: string) => {
    setSchedule(value);
    if (schedulePresets[value]) {
      setCronExpression(schedulePresets[value]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !agentId || !taskPrompt.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    if (automation) {
      updateAutomation(automation.id, {
        name,
        description,
        agentId,
        taskPrompt,
        schedule,
        cronExpression,
      });
    } else {
      addAutomation({
        name,
        description,
        agentId,
        taskPrompt,
        schedule,
        cronExpression,
        enabled: true,
      });
    }

    onClose();
  };

  return (
    <div className="automation-form">
      <div className="modal-header">
        <h2 className="modal-title">{automation ? 'Edit Automation' : 'Create New Automation'}</h2>
        <button className="modal-close-btn" onClick={onClose}>
          <X size={24} />
        </button>
      </div>

      <div className="modal-body">
        <form onSubmit={handleSubmit} className="form">
          <div className="form-group">
            <label className="form-label">Automation Name *</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g., Daily Report Generation"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-control"
              placeholder="Describe what this automation does"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Agent *</label>
            <select
              className="form-control"
              value={agentId}
              onChange={(e) => setAgentId(e.target.value)}
              required
            >
              <option value="">Select an agent</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name} ({agent.model})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Task Prompt *</label>
            <textarea
              className="form-control"
              placeholder="Describe the task for the agent to perform"
              value={taskPrompt}
              onChange={(e) => setTaskPrompt(e.target.value)}
              rows={4}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Schedule</label>
            <select
              className="form-control"
              value={schedule}
              onChange={(e) => handleScheduleChange(e.target.value)}
            >
              <option value="custom">Custom</option>
              <option value="hourly">Hourly</option>
              <option value="daily">Daily at 9 AM</option>
              <option value="weekly">Weekly (Monday 9 AM)</option>
              <option value="monthly">Monthly (1st at 9 AM)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Cron Expression</label>
            <input
              type="text"
              className="form-control font-mono"
              placeholder="0 9 * * * (minute hour day month day-of-week)"
              value={cronExpression}
              onChange={(e) => setCronExpression(e.target.value)}
            />
            <small className="form-help">
              Enter a valid cron expression. Examples: "0 9 * * *" (daily at 9am), "0 */6 * * *" (every 6 hours)
            </small>
          </div>
        </form>
      </div>

      <div className="modal-footer">
        <button className="btn btn-secondary" onClick={onClose}>
          Cancel
        </button>
        <button className="btn btn-primary" onClick={handleSubmit}>
          {automation ? 'Update Automation' : 'Create Automation'}
        </button>
      </div>
    </div>
  );
}
