import React, { useState } from 'react';
import { Plus, Edit2, Trash2, BookOpen } from 'lucide-react';
import { useStore } from '../store';
import { AgentCard } from './AgentCard';
import { AgentForm } from './AgentForm';
import './AgentManager.css';

export function AgentManager() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const agents = useStore((state) => state.agents);
  const deleteAgent = useStore((state) => state.deleteAgent);
  const setActiveAgent = useStore((state) => state.setActiveAgent);

  const editingAgent = editingId ? agents.find((a) => a.id === editingId) : null;

  const handleCreateAgent = () => {
    setEditingId(null);
    setShowForm(true);
  };

  const handleEditAgent = (id: string) => {
    setEditingId(id);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingId(null);
  };

  const handleSelectAgent = (id: string) => {
    setActiveAgent(id);
  };

  const handleDeleteAgent = (id: string) => {
    if (confirm('Are you sure you want to delete this agent?')) {
      deleteAgent(id);
    }
  };

  return (
    <div className="agent-manager">
      <div className="manager-header">
        <div className="manager-title-section">
          <BookOpen size={28} className="manager-icon" />
          <div>
            <h1>Agents</h1>
            <p className="manager-subtitle">Create and manage AI agents</p>
          </div>
        </div>
        <button className="btn btn-primary" onClick={handleCreateAgent}>
          <Plus size={18} />
          New Agent
        </button>
      </div>

      {agents.length === 0 ? (
        <div className="empty-agents">
          <BookOpen size={48} className="empty-icon" />
          <h3>No agents yet</h3>
          <p>Create your first agent to get started</p>
          <button className="btn btn-primary btn-lg" onClick={handleCreateAgent}>
            <Plus size={20} />
            Create Agent
          </button>
        </div>
      ) : (
        <div className="agents-grid">
          {agents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onEdit={() => handleEditAgent(agent.id)}
              onDelete={() => handleDeleteAgent(agent.id)}
              onSelect={() => handleSelectAgent(agent.id)}
            />
          ))}
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={handleCloseForm}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <AgentForm
              agent={editingAgent || undefined}
              onClose={handleCloseForm}
            />
          </div>
        </div>
      )}
    </div>
  );
}
