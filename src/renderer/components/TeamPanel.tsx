import React, { useEffect, useState } from 'react';

interface Team {
  id: string;
  name: string;
  description: string;
  agents: string[];
}

export default function TeamPanel() {
  const [teams, setTeams] = useState<Team[]>([]);

  useEffect(() => {
    const loadTeams = async () => {
      try {
        const teamsList = await (window as any).oap.teams.list();
        setTeams(teamsList);
      } catch (error) {
        console.error('Failed to load teams:', error);
      }
    };
    loadTeams();
  }, []);

  return (
    <div className="team-panel">
      <h2>Teams</h2>
      <div className="teams-grid">
        {teams.map(team => (
          <div key={team.id} className="team-card">
            <h3>{team.name}</h3>
            <p>{team.description}</p>
            <p>Agents: {team.agents.length}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
