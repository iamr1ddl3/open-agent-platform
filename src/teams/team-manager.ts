import { Team, Agent } from '../core/types';
import { LLMGateway } from '../llm/gateway';
import { ToolRegistry } from '../core/tool-registry';
import { v4 as uuidv4 } from 'uuid';

export class TeamManager {
  private teams: Map<string, Team> = new Map();

  constructor(
    private llmGateway: LLMGateway,
    private toolRegistry: ToolRegistry
  ) {}

  createTeam(config: any): Team {
    const team: Team = {
      id: uuidv4(),
      name: config.name,
      description: config.description,
      agents: config.agents || [],
      lead: config.lead || config.agents?.[0],
      config: config.config || {},
    };
    this.teams.set(team.id, team);
    return team;
  }

  async runTeam(teamId: string, task: string): Promise<any> {
    const team = this.teams.get(teamId);
    if (!team) throw new Error(`Team not found: ${teamId}`);

    return {
      teamId,
      task,
      status: 'completed',
      result: 'Team execution completed',
    };
  }

  listTeams(): Team[] {
    return Array.from(this.teams.values());
  }
}
