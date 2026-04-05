import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useStore, Agent } from '../store';
import './AgentForm.css';

interface AgentFormProps {
  agent?: Agent;
  onClose: () => void;
}

const TOOLS = [
  'web_search',
  'code_execution',
  'file_operations',
  'database_query',
  'api_call',
  'email_send',
];

const SKILLS = [
  'data_analysis',
  'content_writing',
  'translation',
  'code_generation',
  'research',
  'summarization',
];

export function AgentForm({ agent, onClose }: AgentFormProps) {
  const [name, setName] = useState(agent?.name || '');
  const [description, setDescription] = useState(agent?.description || '');
  const [systemPrompt, setSystemPrompt] = useState(agent?.systemPrompt || '');
  const [provider, setProvider] = useState<'openai' | 'anthropic' | 'google' | 'ollama'>(
    agent?.provider || 'openai'
  );
  const [model, setModel] = useState(agent?.model || 'gpt-4');
  const [selectedTools, setSelectedTools] = useState<string[]>(agent?.tools || []);
  const [selectedSkills, setSelectedSkills] = useState<string[]>(agent?.skills || []);
  const [temperature, setTemperature] = useState(agent?.temperature || 0.7);
  const [maxTokens, setMaxTokens] = useState(agent?.maxTokens || 2000);

  const addAgent = useStore((state) => state.addAgent);
  const updateAgent = useStore((state) => state.updateAgent);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !systemPrompt.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    if (agent) {
      updateAgent(agent.id, {
        name,
        description,
        systemPrompt,
        provider,
        model,
        tools: selectedTools,
        skills: selectedSkills,
        temperature,
        maxTokens,
      });
    } else {
      addAgent({
        name,
        description,
        systemPrompt,
        provider,
        model,
        tools: selectedTools,
        skills: selectedSkills,
        temperature,
        maxTokens,
      });
    }

    onClose();
  };

  const toggleTool = (tool: string) => {
    setSelectedTools((prev) =>
      prev.includes(tool) ? prev.filter((t) => t !== tool) : [...prev, tool]
    );
  };

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const modelsByProvider = {
    openai: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    anthropic: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
    google: ['gemini-pro', 'gemini-pro-vision'],
    ollama: ['llama2', 'mistral', 'neural-chat'],
  };

  return (
    <div className="agent-form">
      <div className="modal-header">
        <h2 className="modal-title">{agent ? 'Edit Agent' : 'Create New Agent'}</h2>
        <button className="modal-close-btn" onClick={onClose}>
          <X size={24} />
        </button>
      </div>

      <div className="modal-body">
        <form onSubmit={handleSubmit} className="form">
          <div className="form-group">
            <label className="form-label">Agent Name *</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g., Research Assistant"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-control"
              placeholder="Describe what this agent does"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div className="form-group">
            <label className="form-label">System Prompt *</label>
            <textarea
              className="form-control"
              placeholder="Define how the agent should behave and respond"
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              rows={4}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Provider</label>
              <select
                className="form-control"
                value={provider}
                onChange={(e) => {
                  setProvider(e.target.value as any);
                  setModel(modelsByProvider[e.target.value as keyof typeof modelsByProvider][0]);
                }}
              >
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
                <option value="google">Google</option>
                <option value="ollama">Ollama</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Model</label>
              <select
                className="form-control"
                value={model}
                onChange={(e) => setModel(e.target.value)}
              >
                {modelsByProvider[provider].map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Temperature: {temperature.toFixed(2)}</label>
              <input
                type="range"
                className="form-control"
                min="0"
                max="2"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
              />
              <small className="form-help">Controls randomness: 0 = deterministic, 2 = chaotic</small>
            </div>

            <div className="form-group">
              <label className="form-label">Max Tokens</label>
              <input
                type="number"
                className="form-control"
                min="100"
                max="32000"
                value={maxTokens}
                onChange={(e) => setMaxTokens(parseInt(e.target.value))}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Tools</label>
            <div className="checkbox-group">
              {TOOLS.map((tool) => (
                <label key={tool} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={selectedTools.includes(tool)}
                    onChange={() => toggleTool(tool)}
                  />
                  <span>{tool.replace(/_/g, ' ')}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Skills</label>
            <div className="checkbox-group">
              {SKILLS.map((skill) => (
                <label key={skill} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={selectedSkills.includes(skill)}
                    onChange={() => toggleSkill(skill)}
                  />
                  <span>{skill.replace(/_/g, ' ')}</span>
                </label>
              ))}
            </div>
          </div>
        </form>
      </div>

      <div className="modal-footer">
        <button className="btn btn-secondary" onClick={onClose}>
          Cancel
        </button>
        <button className="btn btn-primary" onClick={handleSubmit}>
          {agent ? 'Update Agent' : 'Create Agent'}
        </button>
      </div>
    </div>
  );
}
