import React, { useState } from 'react';
import Layout from './components/Layout';
import ChatPanel from './components/ChatPanel';
import Sidebar from './components/Sidebar';
import './styles/globals.css';

export default function App() {
  const [activeTab, setActiveTab] = useState<'chat' | 'agents' | 'teams' | 'automations' | 'skills' | 'settings'>('chat');

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      <div className="app-container">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <main className="main-content">
          {activeTab === 'chat' && <ChatPanel />}
          {activeTab === 'agents' && <div>Agents Panel</div>}
          {activeTab === 'teams' && <div>Teams Panel</div>}
          {activeTab === 'automations' && <div>Automations Panel</div>}
          {activeTab === 'skills' && <div>Skills Marketplace</div>}
          {activeTab === 'settings' && <div>Settings Panel</div>}
        </main>
      </div>
    </Layout>
  );
}
