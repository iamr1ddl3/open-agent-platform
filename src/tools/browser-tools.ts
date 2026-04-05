import { Tool } from '../core/types';

/**
 * Validate URL for security - block private IPs and restricted protocols
 */
function validateUrl(urlString: string): void {
  let url: URL;
  try {
    url = new URL(urlString);
  } catch {
    throw new Error(`Invalid URL: "${urlString}"`);
  }

  // Only allow http and https
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error(`Protocol not allowed: "${url.protocol}". Only http: and https: are supported`);
  }

  const hostname = url.hostname;

  // Block localhost and 127.0.0.1
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    throw new Error(`Access denied: localhost is not allowed`);
  }

  // Block IPv6 loopback (::1)
  if (hostname === '::1') {
    throw new Error(`Access denied: IPv6 loopback is not allowed`);
  }

  // Block private IP ranges
  const ipParts = hostname.split('.');
  if (ipParts.length === 4 && ipParts.every(p => /^\d+$/.test(p))) {
    const [a, b] = ipParts.map(Number);

    // 10.x.x.x
    if (a === 10) {
      throw new Error(`Access denied: private IP range 10.x.x.x is not allowed`);
    }

    // 172.16-31.x.x
    if (a === 172 && b >= 16 && b <= 31) {
      throw new Error(`Access denied: private IP range 172.16-31.x.x is not allowed`);
    }

    // 192.168.x.x
    if (a === 192 && b === 168) {
      throw new Error(`Access denied: private IP range 192.168.x.x is not allowed`);
    }
  }
}

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
    validateUrl(params.url);
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
    validateUrl(params.url);
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
    validateUrl(params.url);
    const response = await fetch(params.url);
    return await response.text();
  },
};
