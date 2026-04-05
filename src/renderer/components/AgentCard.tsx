import React from 'react';

interface AgentCardProps {
  agentId: string;
  name: string;
  description: string;
  status: 'idle' | 'running' | 'paused' | 'error';
  onSelect?: (agentId: string) => void;
}

export default function AgentCard({
  agentId,
  name,
  description,
  status,
  onSelect,
}: AgentCardProps) {
  const statusColor: Record<string, string> = {
    idle: '#10b981',
    running: '#f59e0b',
    paused: '#6b7280',
    error: '#ef4444',
  };

  return (
    <div className="agent-card" onClick={() => onSelect?.(agentId)}>
      <div className="agent-header">
        <h3>{name}</h3>
        <span
          className="status-indicator"
          style={{ backgroundColor: statusColor[status] }}
        />
      </div>
      <p className="agent-description">{description}</p>
      <div className="agent-footer">
        <span className="status-text">{status}</span>
      </div>
    </div>
  );
}
