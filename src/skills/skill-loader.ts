import * as fs from 'fs';
import * as path from 'path';
import { SkillManifest, InstalledSkill, SkillLoadError } from './types';

export class SkillLoader {
  private manifestSchema: Record<string, any> = {
    id: 'string',
    name: 'string',
    version: 'string',
    description: 'string',
    author: 'string',
    category: 'string',
    tags: 'array',
  };

  async loadSkillManifest(skillPath: string): Promise<SkillManifest> {
    const manifestPath = path.join(skillPath, 'skill.json');

    if (!fs.existsSync(manifestPath)) {
      throw new Error(`Manifest not found at ${manifestPath}`);
    }

    try {
      const content = fs.readFileSync(manifestPath, 'utf-8');
      const manifest: SkillManifest = JSON.parse(content);

      this.validateManifest(manifest);

      return manifest;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(`Invalid JSON in skill manifest: ${error.message}`);
      }
      throw error;
    }
  }

  async loadSkillFromDirectory(skillPath: string): Promise<InstalledSkill> {
    const manifest = await this.loadSkillManifest(skillPath);

    const stats = fs.statSync(skillPath);
    const installedAt = new Date(stats.birthtime).toISOString();

    return {
      manifest,
      path: skillPath,
      enabled: true,
      installedAt,
    };
  }

  async loadSkillsFromDirectory(skillsDir: string): Promise<{
    skills: InstalledSkill[];
    errors: SkillLoadError[];
  }> {
    const skills: InstalledSkill[] = [];
    const errors: SkillLoadError[] = [];

    if (!fs.existsSync(skillsDir)) {
      return { skills, errors };
    }

    const entries = fs.readdirSync(skillsDir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const skillPath = path.join(skillsDir, entry.name);

      try {
        const skill = await this.loadSkillFromDirectory(skillPath);
        skills.push(skill);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        errors.push({
          skillId: entry.name,
          error: message,
        });
      }
    }

    return { skills, errors };
  }

  async loadToolHandler(
    skillPath: string,
    handlerPath: string
  ): Promise<(params: Record<string, any>) => Promise<any>> {
    const fullPath = path.join(skillPath, handlerPath);

    if (!fs.existsSync(fullPath)) {
      throw new Error(`Tool handler not found at ${fullPath}`);
    }

    try {
      const module = require(fullPath);
      const handler = module.default || module.handler;

      if (typeof handler !== 'function') {
        throw new Error('Handler must export a default function or named "handler"');
      }

      return handler;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to load handler ${handlerPath}: ${message}`);
    }
  }

  async resolveDependencies(
    skill: InstalledSkill,
    installedSkills: Map<string, InstalledSkill>
  ): Promise<InstalledSkill[]> {
    const resolved: InstalledSkill[] = [];
    const visited = new Set<string>();

    const visit = (skillId: string): void => {
      if (visited.has(skillId)) return;
      visited.add(skillId);

      const skill = installedSkills.get(skillId);
      if (!skill) {
        throw new Error(`Skill dependency not found: ${skillId}`);
      }

      if (skill.manifest.dependencies) {
        for (const depId of skill.manifest.dependencies) {
          visit(depId);
        }
      }

      resolved.push(skill);
    };

    visit(skill.manifest.id);
    return resolved;
  }

  private validateManifest(manifest: any): void {
    const required = ['id', 'name', 'version', 'description', 'author', 'category', 'tags'];

    for (const field of required) {
      if (!(field in manifest)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    if (typeof manifest.id !== 'string') {
      throw new Error('id must be a string');
    }

    if (!/^[a-z0-9-]+$/.test(manifest.id)) {
      throw new Error('id must contain only lowercase letters, numbers, and hyphens');
    }

    if (typeof manifest.version !== 'string' || !/^\d+\.\d+\.\d+/.test(manifest.version)) {
      throw new Error('version must be a valid semantic version (e.g., 1.0.0)');
    }

    if (!Array.isArray(manifest.tags)) {
      throw new Error('tags must be an array');
    }

    if (manifest.tools) {
      if (!Array.isArray(manifest.tools)) {
        throw new Error('tools must be an array');
      }
      for (const tool of manifest.tools) {
        if (!tool.name || !tool.description || !tool.handler) {
          throw new Error('Each tool must have name, description, and handler');
        }
      }
    }

    if (manifest.dependencies && !Array.isArray(manifest.dependencies)) {
      throw new Error('dependencies must be an array');
    }

    if (manifest.config && typeof manifest.config !== 'object') {
      throw new Error('config must be an object');
    }
  }
}

export function createSkillLoader(): SkillLoader {
  return new SkillLoader();
}
