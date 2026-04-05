import { Skill } from '../core/types';

export class SkillRegistry {
  private skills: Map<string, Skill> = new Map();

  install(skillPath: string): void {
    // Load skill from path or package
    const skill: Skill = {
      id: skillPath,
      name: skillPath,
      version: '1.0.0',
      description: 'Loaded skill',
      tools: [],
      commands: [],
    };
    this.skills.set(skillPath, skill);
  }

  uninstall(skillId: string): void {
    this.skills.delete(skillId);
  }

  getSkill(skillId: string): Skill | undefined {
    return this.skills.get(skillId);
  }

  listSkills(): Skill[] {
    return Array.from(this.skills.values());
  }
}
