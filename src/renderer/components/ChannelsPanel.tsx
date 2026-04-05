import React, { useState } from 'react';
import { Plus, Mail, MessageCircle, Send, Trash2 } from 'lucide-react';
import './ChannelsPanel.css';

interface Channel {
  id: string;
  name: string;
  type: 'email' | 'slack' | 'discord' | 'telegram';
  connected: boolean;
  lastSyncAt?: Date;
  config: Record<string, any>;
}

export function ChannelsPanel() {
  const [channels, setChannels] = useState<Channel[]>([
    {
      id: '1',
      name: 'Work Email',
      type: 'email',
      connected: true,
      lastSyncAt: new Date(),
      config: { email: 'work@example.com' },
    },
    {
      id: '2',
      name: 'Slack - #general',
      type: 'slack',
      connected: false,
      config: { workspace: 'myworkspace', channel: 'general' },
    },
  ]);

  const [showConnectForm, setShowConnectForm] = useState(false);
  const [selectedType, setSelectedType] = useState<Channel['type']>('email');

  const handleRemoveChannel = (id: string) => {
    if (confirm('Remove this channel connection?')) {
      setChannels((prev) => prev.filter((c) => c.id !== id));
    }
  };

  const channelIcons = {
    email: Mail,
    slack: MessageCircle,
    discord: Send,
    telegram: Send,
  };

  const channelLabels = {
    email: 'Email',
    slack: 'Slack',
    discord: 'Discord',
    telegram: 'Telegram',
  };

  return (
    <div className="channels-panel">
      <div className="panel-header">
        <div className="panel-title-section">
          <Mail size={28} className="panel-icon" />
          <div>
            <h1>Channels</h1>
            <p className="panel-subtitle">Connect communication platforms</p>
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowConnectForm(true)}>
          <Plus size={18} />
          Connect Channel
        </button>
      </div>

      <div className="channels-list">
        {channels.length === 0 ? (
          <div className="empty-state">
            <Mail size={48} className="empty-icon" />
            <h3>No channels connected</h3>
            <p>Connect a communication platform to enable integrations</p>
          </div>
        ) : (
          channels.map((channel) => {
            const IconComponent = channelIcons[channel.type];
            return (
              <div key={channel.id} className="channel-card card">
                <div className="channel-card-header">
                  <div className="channel-icon-box">
                    <IconComponent size={24} />
                  </div>
                  <div className="channel-info">
                    <h3>{channel.name}</h3>
                    <p className="channel-type">{channelLabels[channel.type]}</p>
                  </div>
                  <div className="channel-status">
                    <div className={`status-badge ${channel.connected ? 'connected' : 'disconnected'}`}>
                      {channel.connected ? 'Connected' : 'Disconnected'}
                    </div>
                  </div>
                </div>

                {channel.lastSyncAt && (
                  <div className="channel-sync-info">
                    <span className="sync-label">Last synced</span>
                    <span className="sync-time">
                      {new Date(channel.lastSyncAt).toLocaleString()}
                    </span>
                  </div>
                )}

                <div className="channel-actions">
                  <button className="btn btn-secondary btn-sm">Configure</button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleRemoveChannel(channel.id)}
                  >
                    <Trash2 size={14} />
                    Disconnect
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {showConnectForm && (
        <div className="modal-overlay" onClick={() => setShowConnectForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Connect Channel</h2>
            </div>
            <div className="modal-body">
              <div className="channel-type-selector">
                {(Object.keys(channelLabels) as Channel['type'][]).map((type) => (
                  <button
                    key={type}
                    className={`type-option ${selectedType === type ? 'active' : ''}`}
                    onClick={() => setSelectedType(type)}
                  >
                    {channelLabels[type]}
                  </button>
                ))}
              </div>

              <form className="form">
                <div className="form-group">
                  <label className="form-label">
                    {selectedType === 'email' ? 'Email Address' : 'API Key'}
                  </label>
                  <input
                    type={selectedType === 'email' ? 'email' : 'text'}
                    className="form-control"
                    placeholder={
                      selectedType === 'email'
                        ? 'your@email.com'
                        : 'Enter your API key'
                    }
                  />
                </div>

                {selectedType !== 'email' && (
                  <div className="form-group">
                    <label className="form-label">Workspace/Server</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Workspace name or ID"
                    />
                  </div>
                )}
              </form>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowConnectForm(false)}
              >
                Cancel
              </button>
              <button className="btn btn-primary">Connect</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
