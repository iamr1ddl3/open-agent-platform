import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useStore, Team } from '../store';
import './TeamForm.css';

interface TeamFormProps {
  team?: Team;
  onClose: () => void;
}

export function TeamForm({ team, onClose }: TeamFormProps) {
  const [name, setName] = useState(team?.name || '');
  const [description, setDescription] = useState(team?.description || '');
  const [leadAgentId, setLeadAgentId] = useState(team?.leadAgentId || '');
  const [memberAgentIds, setMemberAgentIds] = useState<string[]>(team?.memberAgentIds || []);
  const [strategy, setStrategy] = useState<'sequential' | 'parallel' | 'delegated'>(
    team?.strategy || 'sequential'
  );

  const agents = useStore((state) => state.agents);
  const addTeam = useStore((state) => state.addTeam);
  const updateTeam = useStore((state) => state.updateTeam);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !leadAgentId) {
      alert('Please fill in all required fields');
      return;
    }

    if (team) {
      updateTeam(team.id, {
        name,
        description,
        leadAgentId,
        memberAgentIds,
        strategy,
      });
    } else {
      addTeam({
        name,
        description,
        leadAgentId,
        memberAgentIds,
        strategy,
      });
    }

    onClose();
  };

  const toggleMember = (agentId: string) => {
    setMemberAgentIds((prev) =>
      prev.includes(agentId) ? prev.filter((id) => id !== agentId) : [...prev, agentId]
    );
  };

  const availableMembers = agents.filter((a) => a.id !== leadAgentId);

  return (
    <div className="team-form">
      <div className="modal-header">
        <h2 className="modal-title">{team ? 'Edit Team' : 'Create New Team'}</h2>
        <button className="modal-close-btn" onClick={onClose}>
          <X size={24} />
        </button>
      </div>

      <div className="modal-body">
        <form onSubmit={handleSubmit} className="form">
          <div className="form-group">
            <label className="form-label">Team Name *</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g., Research Team"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-control"
              placeholder="Describe the purpose of this team"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Lead Agent *</label>
            <select
              className="form-control"
              value={leadAgentId}
              onChange={(e) => setLeadAgentId(e.target.value)}
              required
            >
              <option value="">Select a lead agent</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name} ({agent.model})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Team Members</label>
            <div className="checkbox-group">
              {availableMembers.map((agent) => (
                <label key={agent.id} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={memberAgentIds.includes(agent.id)}
                    onChange={() => toggleMember(agent.id)}
                  />
                  <span>{agent.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Coordination Strategy</label>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  name="strategy"
                  value="sequential"
                  checked={strategy === 'sequential'}
                  onChange={(e) => setStrategy(e.target.value as any)}
                />
                <span>
                  <strong>Sequential</strong>
                  <small>Agents work one after another</small>
                </span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="strategy"
                  value="parallel"
                  checked={strategy === 'parallel'}
                  onChange={(e) => setStrategy(e.target.value as any)}
                />
                <span>
                  <strong>Parallel</strong>
                  <small>Agents work simultaneously</small>
                </span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="strategy"
                  value="delegated"
                  checked={strategy === 'delegated'}
                  onChange={(e) => setStrategy(e.target.value as any)}
                />
                <span>
                  <strong>Delegated</strong>
                  <small>Lead agent delegates tasks</small>
                </span>
              </label>
            </div>
          </div>
        </form>
      </div>

      <div className="modal-footer">
        <button className="btn btn-secondary" onClick={onClose}>
          Cancel
        </button>
        <button className="btn btn-primary" onClick={handleSubmit}>
          {team ? 'Update Team' : 'Create Team'}
        </button>
      </div>
    </div>
  );
}
