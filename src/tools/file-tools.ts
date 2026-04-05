import * as fs from 'fs';
import * as path from 'path';
import { Tool } from '../core/types';

const WORKSPACE_ROOT = process.cwd();

/**
 * Validate that a path stays within the workspace root
 */
function validatePath(inputPath: string): string {
  const resolved = path.resolve(inputPath);
  const relative = path.relative(WORKSPACE_ROOT, resolved);

  // Check if path tries to escape workspace with ..
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`Access denied: Path "${inputPath}" is outside workspace`);
  }

  return resolved;
}

export const readFile: Tool = {
  name: 'read_file',
  description: 'Read the contents of a file',
  schema: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'Path to the file to read',
      },
      encoding: {
        type: 'string',
        description: 'File encoding (default: utf-8)',
        default: 'utf-8',
      },
    },
    required: ['path'],
  },
  execute: async (params) => {
    const filePath = validatePath(params.path);
    const encoding = params.encoding || 'utf-8';
    return fs.readFileSync(filePath, encoding as BufferEncoding);
  },
};

export const writeFile: Tool = {
  name: 'write_file',
  description: 'Write content to a file',
  schema: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'Path where file will be written',
      },
      content: {
        type: 'string',
        description: 'Content to write',
      },
      createIfMissing: {
        type: 'boolean',
        description: 'Create file if it doesn\'t exist',
        default: true,
      },
    },
    required: ['path', 'content'],
  },
  execute: async (params) => {
    const filePath = validatePath(params.path);
    const content = params.content;
    fs.writeFileSync(filePath, content, 'utf-8');
    return `File written to ${filePath}`;
  },
};

export const listDirectory: Tool = {
  name: 'list_directory',
  description: 'List files in a directory',
  schema: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'Directory path to list',
      },
      recursive: {
        type: 'boolean',
        description: 'List recursively',
        default: false,
      },
    },
    required: ['path'],
  },
  execute: async (params) => {
    const dirPath = validatePath(params.path);
    const recursive = params.recursive || false;

    const files: string[] = [];
    const walkDir = (dir: string, prefix = '') => {
      const entries = fs.readdirSync(dir);
      for (const entry of entries) {
        const fullPath = path.join(dir, entry);
        const stat = fs.statSync(fullPath);
        files.push(`${prefix}${entry}${stat.isDirectory() ? '/' : ''}`);
        if (recursive && stat.isDirectory()) {
          walkDir(fullPath, `${prefix}${entry}/`);
        }
      }
    };

    walkDir(dirPath);
    return files;
  },
};

export const deleteFile: Tool = {
  name: 'delete_file',
  description: 'Delete a file',
  schema: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'Path to file to delete',
      },
    },
    required: ['path'],
  },
  execute: async (params) => {
    const filePath = validatePath(params.path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return `File deleted: ${filePath}`;
    }
    return `File not found: ${filePath}`;
  },
};

export const editFile: Tool = {
  name: 'edit_file',
  description: 'Edit a file by replacing content',
  schema: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'Path to the file to edit',
      },
      oldContent: {
        type: 'string',
        description: 'Content to find and replace',
      },
      newContent: {
        type: 'string',
        description: 'New content to replace with',
      },
    },
    required: ['path', 'oldContent', 'newContent'],
  },
  execute: async (params) => {
    const filePath = validatePath(params.path);
    const oldContent = params.oldContent;
    const newContent = params.newContent;
    const content = fs.readFileSync(filePath, 'utf-8');
    const updated = content.replace(oldContent, newContent);
    fs.writeFileSync(filePath, updated, 'utf-8');
    return `File edited: ${filePath}`;
  },
};

export const copyFile: Tool = {
  name: 'copy_file',
  description: 'Copy a file',
  schema: {
    type: 'object',
    properties: {
      source: {
        type: 'string',
        description: 'Source file path',
      },
      destination: {
        type: 'string',
        description: 'Destination file path',
      },
    },
    required: ['source', 'destination'],
  },
  execute: async (params) => {
    const source = validatePath(params.source);
    const destination = validatePath(params.destination);
    fs.copyFileSync(source, destination);
    return `File copied from ${source} to ${destination}`;
  },
};

export const moveFile: Tool = {
  name: 'move_file',
  description: 'Move or rename a file',
  schema: {
    type: 'object',
    properties: {
      source: {
        type: 'string',
        description: 'Source file path',
      },
      destination: {
        type: 'string',
        description: 'Destination file path',
      },
    },
    required: ['source', 'destination'],
  },
  execute: async (params) => {
    const source = validatePath(params.source);
    const destination = validatePath(params.destination);
    fs.renameSync(source, destination);
    return `File moved from ${source} to ${destination}`;
  },
};

export const fileInfo: Tool = {
  name: 'file_info',
  description: 'Get information about a file',
  schema: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'Path to the file',
      },
    },
    required: ['path'],
  },
  execute: async (params) => {
    const filePath = validatePath(params.path);
    const stat = fs.statSync(filePath);
    return {
      size: stat.size,
      isDirectory: stat.isDirectory(),
      isFile: stat.isFile(),
      modified: stat.mtime.toISOString(),
      created: stat.birthtime.toISOString(),
      permissions: stat.mode,
    };
  },
};
