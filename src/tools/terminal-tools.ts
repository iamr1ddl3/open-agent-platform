import { execSync, spawn } from 'child_process';
import { Tool } from '../core/types';

const processes: Map<number, any> = new Map();

const BLOCKED_COMMANDS = [
  'rm -rf /',
  'mkfs',
  'dd if=',
  ':(){',
  'fork bomb',
  '> /dev/sda',
  'chmod -R 777 /',
];

const BLOCKED_PATTERNS = [
  /;\s*rm\s/,
  /&&\s*rm\s/,
  /\|\s*rm\s/,
  />\s*\/dev\//,
  /;\s*shutdown/,
  /;\s*reboot/,
];

/**
 * Validate command for dangerous patterns
 */
function validateCommand(command: string): void {
  // Check for blocked commands
  for (const blocked of BLOCKED_COMMANDS) {
    if (command.includes(blocked)) {
      throw new Error(`Command blocked: contains dangerous command "${blocked}"`);
    }
  }

  // Check for blocked patterns
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(command)) {
      throw new Error(`Command blocked: matches dangerous pattern`);
    }
  }
}

export const executeCommand: Tool = {
  name: 'execute_command',
  description: 'Execute a shell command',
  schema: {
    type: 'object',
    properties: {
      command: {
        type: 'string',
        description: 'Command to execute',
      },
      cwd: {
        type: 'string',
        description: 'Working directory',
      },
    },
    required: ['command'],
  },
  execute: async (params) => {
    try {
      validateCommand(params.command);
      const result = execSync(params.command, {
        cwd: params.cwd || process.cwd(),
        encoding: 'utf-8',
        timeout: 30000,
        maxBuffer: 10 * 1024 * 1024,
      });
      return result;
    } catch (error: any) {
      throw new Error(`Command failed: ${error.message}`);
    }
  },
};

export const runCommand: Tool = executeCommand;

export const runCommandBackground: Tool = {
  name: 'run_command_background',
  description: 'Run a command in the background',
  schema: {
    type: 'object',
    properties: {
      command: {
        type: 'string',
        description: 'Command to execute',
      },
    },
    required: ['command'],
  },
  execute: async (params) => {
    validateCommand(params.command);
    const proc = spawn(params.command, { shell: true, detached: true, timeout: 30000 });
    processes.set(proc.pid!, proc);
    return { pid: proc.pid, message: `Process started with PID ${proc.pid}` };
  },
};

export const killProcess: Tool = {
  name: 'kill_process',
  description: 'Kill a running process by PID',
  schema: {
    type: 'object',
    properties: {
      pid: {
        type: 'number',
        description: 'Process ID to kill',
      },
    },
    required: ['pid'],
  },
  execute: async (params) => {
    const proc = processes.get(params.pid);
    if (proc) {
      proc.kill();
      processes.delete(params.pid);
      return `Process ${params.pid} killed`;
    }
    return `Process ${params.pid} not found`;
  },
};

export const listProcesses: Tool = {
  name: 'list_processes',
  description: 'List all tracked background processes',
  schema: {
    type: 'object',
    properties: {},
  },
  execute: async () => {
    return Array.from(processes.keys()).map(pid => ({ pid }));
  },
};

export const getProcessOutput: Tool = {
  name: 'get_process_output',
  description: 'Get output from a running process',
  schema: {
    type: 'object',
    properties: {
      pid: {
        type: 'number',
        description: 'Process ID',
      },
    },
    required: ['pid'],
  },
  execute: async (params) => {
    const proc = processes.get(params.pid);
    if (proc) {
      return `Process ${params.pid} is running`;
    }
    return `Process ${params.pid} not found or finished`;
  },
};

export const clearProcessOutput: Tool = {
  name: 'clear_process_output',
  description: 'Clear process tracking',
  schema: {
    type: 'object',
    properties: {},
  },
  execute: async () => {
    processes.clear();
    return 'Process list cleared';
  },
};

export const runScript: Tool = {
  name: 'run_script',
  description: 'Run a script with streaming output',
  schema: {
    type: 'object',
    properties: {
      script: {
        type: 'string',
        description: 'Script to run',
      },
      args: {
        type: 'array',
        description: 'Script arguments',
        items: { type: 'string' },
      },
    },
    required: ['script'],
  },
  execute: async (params) => {
    return new Promise((resolve, reject) => {
      const proc = spawn(params.script, params.args || []);
      let output = '';

      proc.stdout.on('data', (data) => {
        output += data.toString();
      });

      proc.stderr.on('data', (data) => {
        output += data.toString();
      });

      proc.on('close', (code) => {
        if (code === 0) {
          resolve(output);
        } else {
          reject(new Error(`Script exited with code ${code}`));
        }
      });
    });
  },
};
