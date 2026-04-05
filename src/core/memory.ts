import { MemoryEntry } from './types';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface MemoryConfig {
  maxShortTermSize: number;
  persistPath?: string;
  autoConsolidate: boolean;
}

export class MemoryManager {
  private shortTermMemory: MemoryEntry[] = [];
  private longTermMemory: MemoryEntry[] = [];
  private config: MemoryConfig;

  constructor(config: Partial<MemoryConfig> = {}) {
    this.config = {
      maxShortTermSize: config.maxShortTermSize ?? 50,
      persistPath: config.persistPath,
      autoConsolidate: config.autoConsolidate ?? true,
    };
  }

  /**
   * Add entry to short-term memory
   */
  addShortTerm(
    content: string,
    importance: number = 0.5,
    metadata: Record<string, any> = {}
  ): MemoryEntry {
    const entry: MemoryEntry = {
      id: uuidv4(),
      type: 'short_term',
      content,
      timestamp: Date.now(),
      importance: Math.min(1, Math.max(0, importance)),
      metadata,
    };

    this.shortTermMemory.push(entry);

    // Manage size
    if (this.shortTermMemory.length > this.config.maxShortTermSize) {
      const toMove = this.shortTermMemory.shift();
      if (toMove) {
        this.longTermMemory.push(toMove);
      }
    }

    return entry;
  }

  /**
   * Add entry directly to long-term memory
   */
  addLongTerm(
    content: string,
    importance: number = 0.5,
    metadata: Record<string, any> = {}
  ): MemoryEntry {
    const entry: MemoryEntry = {
      id: uuidv4(),
      type: 'long_term',
      content,
      timestamp: Date.now(),
      importance: Math.min(1, Math.max(0, importance)),
      metadata,
    };

    this.longTermMemory.push(entry);
    return entry;
  }

  /**
   * Search all memory
   */
  search(query: string, limit: number = 10): MemoryEntry[] {
    const lowerQuery = query.toLowerCase();
    const combined = [...this.shortTermMemory, ...this.longTermMemory];

    return combined
      .filter((entry) =>
        entry.content.toLowerCase().includes(lowerQuery)
      )
      .sort((a, b) => {
        // Sort by importance first, then by recency
        if (b.importance !== a.importance) {
          return b.importance - a.importance;
        }
        return b.timestamp - a.timestamp;
      })
      .slice(0, limit);
  }

  /**
   * Search by type
   */
  searchByType(
    type: string,
    limit: number = 10
  ): MemoryEntry[] {
    const combined = [...this.shortTermMemory, ...this.longTermMemory];
    return combined
      .filter((entry) => entry.type === type)
      .sort((a, b) => b.importance - a.importance)
      .slice(0, limit);
  }

  /**
   * Get short-term memory
   */
  getShortTerm(): MemoryEntry[] {
    return [...this.shortTermMemory];
  }

  /**
   * Get long-term memory
   */
  getLongTerm(): MemoryEntry[] {
    return [...this.longTermMemory];
  }

  /**
   * Get all memory
   */
  getAll(): MemoryEntry[] {
    return [...this.shortTermMemory, ...this.longTermMemory];
  }

  /**
   * Update entry importance
   */
  updateImportance(entryId: string, importance: number): void {
    importance = Math.min(1, Math.max(0, importance));

    let found = this.shortTermMemory.find((e) => e.id === entryId);
    if (found) {
      found.importance = importance;
      return;
    }

    found = this.longTermMemory.find((e) => e.id === entryId);
    if (found) {
      found.importance = importance;
    }
  }

  /**
   * Remove low-importance entries from long-term memory
   */
  consolidateLongTerm(minImportance: number = 0.2): MemoryEntry[] {
    const removed = this.longTermMemory.filter(
      (entry) => entry.importance < minImportance
    );
    this.longTermMemory = this.longTermMemory.filter(
      (entry) => entry.importance >= minImportance
    );
    return removed;
  }

  /**
   * Consolidate all memory (summarize old entries)
   */
  consolidateAll(minImportance: number = 0.2): {
    shortTermRemoved: MemoryEntry[];
    longTermRemoved: MemoryEntry[];
  } {
    const shortTermRemoved = this.shortTermMemory.filter(
      (entry) => entry.importance < minImportance
    );
    this.shortTermMemory = this.shortTermMemory.filter(
      (entry) => entry.importance >= minImportance
    );

    const longTermRemoved = this.consolidateLongTerm(minImportance);

    return {
      shortTermRemoved,
      longTermRemoved,
    };
  }

  /**
   * Clear all memory
   */
  clear(): void {
    this.shortTermMemory = [];
    this.longTermMemory = [];
  }

  /**
   * Persist memory to file
   */
  async persist(): Promise<void> {
    if (!this.config.persistPath) {
      throw new Error('Persist path not configured');
    }

    const data = {
      shortTerm: this.shortTermMemory,
      longTerm: this.longTermMemory,
      timestamp: new Date().toISOString(),
    };

    const dir = path.dirname(this.config.persistPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(
      this.config.persistPath,
      JSON.stringify(data, null, 2)
    );
  }

  /**
   * Load memory from file
   */
  async load(): Promise<void> {
    if (!this.config.persistPath) {
      throw new Error('Persist path not configured');
    }

    if (!fs.existsSync(this.config.persistPath)) {
      return;
    }

    const content = fs.readFileSync(this.config.persistPath, 'utf-8');
    const data = JSON.parse(content);

    this.shortTermMemory = data.shortTerm || [];
    this.longTermMemory = data.longTerm || [];
  }

  /**
   * Export memory as formatted text
   */
  exportAsText(): string {
    let text = '';

    if (this.shortTermMemory.length > 0) {
      text += '## Short-Term Memory\n';
      for (const entry of this.shortTermMemory) {
        text += `- [${entry.type}] (relevance: ${entry.importance.toFixed(2)}) ${entry.content}\n`;
      }
      text += '\n';
    }

    if (this.longTermMemory.length > 0) {
      text += '## Long-Term Memory\n';
      for (const entry of this.longTermMemory) {
        text += `- [${entry.type}] (relevance: ${entry.importance.toFixed(2)}) ${entry.content}\n`;
      }
      text += '\n';
    }

    return text || 'No memories stored.\n';
  }

  /**
   * Get memory statistics
   */
  getStatistics(): {
    totalMemories: number;
    shortTermCount: number;
    longTermCount: number;
    avgImportance: number;
    memoryByType: Record<string, number>;
  } {
    const all = this.getAll();
    const memoryByType: Record<string, number> = {};

    for (const entry of all) {
      if (!memoryByType[entry.type]) {
        memoryByType[entry.type] = 0;
      }
      memoryByType[entry.type]++;
    }

    const avgImportance =
      all.length > 0
        ? all.reduce((sum, e) => sum + e.importance, 0) / all.length
        : 0;

    return {
      totalMemories: all.length,
      shortTermCount: this.shortTermMemory.length,
      longTermCount: this.longTermMemory.length,
      avgImportance,
      memoryByType,
    };
  }
}
