export interface SkillManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  category: string;
  tags: string[];
  systemPrompt?: string;
  tools?: SkillToolDef[];
  mcpServers?: string[];
  dependencies?: string[];
  config?: Record<string, SkillConfigOption>;
}

export interface SkillConfigOption {
  type: 'string' | 'number' | 'boolean' | 'json';
  description: string;
  default?: any;
  required?: boolean;
  enum?: any[];
}

export interface SkillToolDef {
  name: string;
  description: string;
  handler: string;
  parameters: Record<string, any>;
}

export interface InstalledSkill {
  manifest: SkillManifest;
  path: string;
  enabled: boolean;
  installedAt: string;
  config?: Record<string, any>;
}

export interface SkillLoadError {
  skillId: string;
  error: string;
  details?: any;
}
