import { ToolRegistry } from '../core/tool-registry';
import * as fileTools from './file-tools';
import * as terminalTools from './terminal-tools';
import * as browserTools from './browser-tools';
import * as webTools from './web-tools';

export * as fileTools from './file-tools';
export * as terminalTools from './terminal-tools';
export * as browserTools from './browser-tools';
export * as webTools from './web-tools';

export function registerBuiltinTools(registry: ToolRegistry): void {
  // File tools
  const fileToolsList = [
    fileTools.readFile,
    fileTools.writeFile,
    fileTools.listDirectory,
    fileTools.deleteFile,
    fileTools.editFile,
    fileTools.copyFile,
    fileTools.moveFile,
    fileTools.fileInfo,
  ];

  // Terminal tools
  const terminalToolsList = [
    terminalTools.executeCommand,
    terminalTools.runCommand,
    terminalTools.runCommandBackground,
    terminalTools.killProcess,
    terminalTools.listProcesses,
    terminalTools.getProcessOutput,
    terminalTools.clearProcessOutput,
    terminalTools.runScript,
  ];

  // Browser tools
  const browserToolsList = [
    browserTools.browserNavigate,
    browserTools.browserClick,
    browserTools.browserType,
    browserTools.browserScreenshot,
    browserTools.browserEvaluate,
    browserTools.browserExtractText,
    browserTools.browserWait,
    browserTools.browserGetTitle,
    browserTools.browserGetUrl,
    browserTools.browserClose,
    browserTools.takeScreenshot,
    browserTools.getPageContent,
  ];

  // Web tools
  const webToolsList = [
    webTools.webFetch,
    webTools.webSearch,
    webTools.webScrape,
    webTools.htmlParse,
    webTools.webGetMetadata,
    webTools.htmlToMarkdown,
    webTools.validateUrlTool,
  ];

  // Register all tools
  const allTools = [
    ...fileToolsList,
    ...terminalToolsList,
    ...browserToolsList,
    ...webToolsList,
  ];

  for (const tool of allTools) {
    registry.register(
      {
        name: tool.name,
        description: tool.description,
        parameters: tool.schema as any,
      },
      tool.execute
    );
  }
}
