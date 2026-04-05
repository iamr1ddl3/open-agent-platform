import React, { useEffect, useState } from 'react';

interface Automation {
  id: string;
  name: string;
  cronExpression: string;
  enabled: boolean;
}

export default function AutomationsPanel() {
  const [automations, setAutomations] = useState<Automation[]>([]);

  useEffect(() => {
    const loadAutomations = async () => {
      try {
        const jobs = await (window as any).oap.scheduler.list();
        setAutomations(jobs);
      } catch (error) {
        console.error('Failed to load automations:', error);
      }
    };
    loadAutomations();
  }, []);

  return (
    <div className="automations-panel">
      <h2>Automations</h2>
      <div className="automations-list">
        {automations.map(auto => (
          <div key={auto.id} className="automation-item">
            <h4>{auto.name}</h4>
            <p>Schedule: {auto.cronExpression}</p>
            <p>Status: {auto.enabled ? 'Enabled' : 'Disabled'}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
