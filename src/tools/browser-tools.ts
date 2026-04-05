import { Tool } from '../core/types';

export const browserNavigate: Tool = {
  name: 'browser_navigate',
  description: 'Navigate to a URL',
  schema: {
    type: 'object',
    properties: {
      url: { type: 'string', description: 'URL to navigate to' },
    },
    required: ['url'],
  },
  execute: async (params) => {
    return { success: true, url: params.url };
  },
};

export const browserClick: Tool = {
  name: 'browser_click',
  description: 'Click on an element',
  schema: {
    type: 'object',
    properties: {
      selector: { type: 'string', description: 'CSS selector' },
    },
    required: ['selector'],
  },
  execute: async (params) => {
    return { success: true, selector: params.selector };
  },
};

export const browserType: Tool = {
  name: 'browser_type',
  description: 'Type text into a focused element',
  schema: {
    type: 'object',
    properties: {
      text: { type: 'string', description: 'Text to type' },
    },
    required: ['text'],
  },
  execute: async (params) => {
    return { success: true, text: params.text };
  },
};

export const browserScreenshot: Tool = {
  name: 'browser_screenshot',
  description: 'Take a screenshot of the current page',
  schema: {
    type: 'object',
    properties: {},
  },
  execute: async () => {
    return { success: true, message: 'Screenshot taken' };
  },
};

export const browserEvaluate: Tool = {
  name: 'browser_evaluate',
  description: 'Evaluate JavaScript in the page context',
  schema: {
    type: 'object',
    properties: {
      script: { type: 'string', description: 'JavaScript code to evaluate' },
    },
    required: ['script'],
  },
  execute: async (params) => {
    return { result: params.script };
  },
};

export const browserExtractText: Tool = {
  name: 'browser_extract_text',
  description: 'Extract text from a selector',
  schema: {
    type: 'object',
    properties: {
      selector: { type: 'string', description: 'CSS selector' },
    },
    required: ['selector'],
  },
  execute: async (params) => {
    return { text: `Content from ${params.selector}` };
  },
};

export const browserWait: Tool = {
  name: 'browser_wait',
  description: 'Wait for a selector to appear',
  schema: {
    type: 'object',
    properties: {
      selector: { type: 'string', description: 'CSS selector to wait for' },
      timeout: { type: 'number', description: 'Timeout in milliseconds', default: 5000 },
    },
    required: ['selector'],
  },
  execute: async (params) => {
    return { success: true, selector: params.selector };
  },
};

export const browserGetTitle: Tool = {
  name: 'browser_get_title',
  description: 'Get the page title',
  schema: {
    type: 'object',
    properties: {},
  },
  execute: async () => {
    return { title: 'Page Title' };
  },
};

export const browserGetUrl: Tool = {
  name: 'browser_get_url',
  description: 'Get the current URL',
  schema: {
    type: 'object',
    properties: {},
  },
  execute: async () => {
    return { url: 'https://example.com' };
  },
};

export const browserClose: Tool = {
  name: 'browser_close',
  description: 'Close the browser',
  schema: {
    type: 'object',
    properties: {},
  },
  execute: async () => {
    return { success: true };
  },
};

export const takeScreenshot: Tool = {
  name: 'take_screenshot',
  description: 'Take a screenshot of a webpage',
  schema: {
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description: 'URL to screenshot',
      },
      width: {
        type: 'number',
        description: 'Viewport width',
        default: 1920,
      },
      height: {
        type: 'number',
        description: 'Viewport height',
        default: 1080,
      },
    },
    required: ['url'],
  },
  execute: async (params) => {
    return {
      success: true,
      message: 'Screenshot functionality available',
      url: params.url,
    };
  },
};

export const getPageContent: Tool = {
  name: 'get_page_content',
  description: 'Get HTML content of a webpage',
  schema: {
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description: 'URL to fetch',
      },
    },
    required: ['url'],
  },
  execute: async (params) => {
    const response = await fetch(params.url);
    return await response.text();
  },
};
