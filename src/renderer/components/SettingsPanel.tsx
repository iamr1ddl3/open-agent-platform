import React, { useState } from 'react';
import { Settings, Save, Shield, Info } from 'lucide-react';
import { useStore } from '../store';
import './SettingsPanel.css';

export function SettingsPanel() {
  const settings = useStore((state) => state.settings);
  const updateSettings = useStore((state) => state.updateSettings);
  const updateProvider = useStore((state) => state.updateProvider);

  const [selectedProvider, setSelectedProvider] = useState<string>('openai');
  const [testStatus, setTestStatus] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState(false);

  const handleApiKeyChange = (provider: string, apiKey: string) => {
    updateProvider(provider, { apiKey });
  };

  const handleTestConnection = async (provider: string) => {
    try {
      // First ensure the key is sent to main process
      const providerConfig = settings.llmProviders[provider];
      if (providerConfig?.apiKey) {
        await (window as any).oap.llm.configure(provider, {
          apiKey: providerConfig.apiKey,
          baseUrl: providerConfig.baseUrl,
          model: providerConfig.models[0] || '',
        });
      }
      const result = await (window as any).oap.llm.testConnection(provider);
      setTestStatus((prev) => ({ ...prev, [provider]: result }));
      setTimeout(() => {
        setTestStatus((prev) => ({ ...prev, [provider]: false }));
      }, 3000);
    } catch (error) {
      console.error('Connection test failed:', error);
      setTestStatus((prev) => ({ ...prev, [provider]: false }));
    }
  };

  const handleSaveSettings = async () => {
    try {
      // Send all configured API keys to the main process
      for (const [name, provider] of Object.entries(settings.llmProviders)) {
        if (provider.apiKey) {
          await (window as any).oap.llm.configure(name, {
            apiKey: provider.apiKey,
            baseUrl: provider.baseUrl,
            model: provider.models[0] || '',
          });
        }
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  return (
    <div className="settings-panel">
      <div className="panel-header">
        <div className="panel-title-section">
          <Settings size={28} className="panel-icon" />
          <div>
            <h1>Settings</h1>
            <p className="panel-subtitle">Configure application preferences</p>
          </div>
        </div>
        {saved && (
          <div className="save-indicator">
            <span className="checkmark">✓</span> Saved
          </div>
        )}
      </div>

      <div className="settings-sections">
        {/* LLM Providers Section */}
        <div className="settings-section">
          <h2 className="section-title">LLM Providers</h2>
          <p className="section-description">Configure API keys for language models</p>

          <div className="providers-grid">
            {Object.entries(settings.llmProviders).map(([name, provider]) => (
              <div key={name} className="provider-card card">
                <div className="provider-header">
                  <h3>{provider.name.charAt(0).toUpperCase() + provider.name.slice(1)}</h3>
                  <div className={`status-dot ${provider.isConfigured ? 'configured' : ''}`} />
                </div>

                <div className="form-group">
                  <label className="form-label">API Key</label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Enter your API key"
                    defaultValue={provider.apiKey || ''}
                    onChange={(e) => handleApiKeyChange(name, e.target.value)}
                  />
                </div>

                {name === 'ollama' && (
                  <div className="form-group">
                    <label className="form-label">Base URL</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="http://localhost:11434"
                      defaultValue={provider.baseUrl || ''}
                    />
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Models</label>
                  <div className="models-list">
                    {provider.models.length === 0 ? (
                      <p className="no-models">No models available</p>
                    ) : (
                      provider.models.map((model) => (
                        <div key={model} className="model-item">
                          {model}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleTestConnection(name)}
                >
                  {testStatus[name] ? '✓ Connected' : 'Test Connection'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Default Settings Section */}
        <div className="settings-section">
          <h2 className="section-title">Default Configuration</h2>
          <div className="form-group">
            <label className="form-label">Default Provider</label>
            <select
              className="form-control"
              value={settings.defaultProvider}
              onChange={(e) => updateSettings({ defaultProvider: e.target.value as any })}
            >
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="google">Google</option>
              <option value="ollama">Ollama</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Default Model</label>
            <input
              type="text"
              className="form-control"
              value={settings.defaultModel}
              onChange={(e) => updateSettings({ defaultModel: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Theme</label>
            <select
              className="form-control"
              value={settings.appTheme}
              onChange={(e) => updateSettings({ appTheme: e.target.value as any })}
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Font Size</label>
            <select
              className="form-control"
              value={settings.fontSize}
              onChange={(e) => updateSettings({ fontSize: e.target.value as any })}
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>
        </div>

        {/* Security Section */}
        <div className="settings-section">
          <h2 className="section-title">
            <Shield size={20} className="section-icon" />
            Security
          </h2>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={settings.requireToolApproval}
                onChange={(e) => updateSettings({ requireToolApproval: e.target.checked })}
              />
              <span>
                <strong>Require tool approval</strong>
                <small>Ask for confirmation before executing tools</small>
              </span>
            </label>
          </div>
        </div>

        {/* About Section */}
        <div className="settings-section">
          <h2 className="section-title">
            <Info size={20} className="section-icon" />
            About
          </h2>

          <div className="about-info">
            <div className="info-item">
              <span className="info-label">Application</span>
              <span className="info-value">OpenAgentPlatform</span>
            </div>
            <div className="info-item">
              <span className="info-label">Version</span>
              <span className="info-value">0.1.0</span>
            </div>
            <div className="info-item">
              <span className="info-label">License</span>
              <span className="info-value">MIT</span>
            </div>
          </div>

          <div className="about-links">
            <a href="#" className="about-link">
              Documentation
            </a>
            <a href="#" className="about-link">
              GitHub Repository
            </a>
            <a href="#" className="about-link">
              Report an Issue
            </a>
          </div>
        </div>
      </div>

      <div className="settings-footer">
        <button className="btn btn-primary btn-lg" onClick={handleSaveSettings}>
          <Save size={18} />
          Save Settings
        </button>
      </div>
    </div>
  );
}
