import { Tool } from '../core/types';

export const webFetch: Tool = {
  name: 'web_fetch',
  description: 'Fetch content from a URL',
  schema: {
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description: 'URL to fetch',
      },
      method: {
        type: 'string',
        description: 'HTTP method',
        default: 'GET',
      },
      headers: {
        type: 'object',
        description: 'HTTP headers',
      },
    },
    required: ['url'],
  },
  execute: async (params) => {
    const response = await fetch(params.url, {
      method: params.method || 'GET',
      headers: params.headers || {},
    });
    const content = await response.text();
    return {
      status: response.status,
      body: content,
    };
  },
};

export const webSearch: Tool = {
  name: 'web_search',
  description: 'Search the web for information',
  schema: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Search query' },
    },
    required: ['query'],
  },
  execute: async (params) => {
    return { results: [], query: params.query };
  },
};

export const webScrape: Tool = {
  name: 'web_scrape',
  description: 'Scrape content from a webpage',
  schema: {
    type: 'object',
    properties: {
      url: { type: 'string', description: 'URL to scrape' },
      selector: { type: 'string', description: 'CSS selector' },
    },
    required: ['url'],
  },
  execute: async (params) => {
    const response = await fetch(params.url);
    return await response.text();
  },
};

export const htmlParse: Tool = {
  name: 'html_parse',
  description: 'Parse HTML and extract data',
  schema: {
    type: 'object',
    properties: {
      html: { type: 'string', description: 'HTML content to parse' },
      selector: { type: 'string', description: 'CSS selector' },
    },
    required: ['html'],
  },
  execute: async (params) => {
    return { parsed: true };
  },
};

export const webGetMetadata: Tool = {
  name: 'web_get_metadata',
  description: 'Get metadata from a webpage',
  schema: {
    type: 'object',
    properties: {
      url: { type: 'string', description: 'URL to get metadata from' },
    },
    required: ['url'],
  },
  execute: async (params) => {
    return { title: 'Page Title', description: '', url: params.url };
  },
};

export const htmlToMarkdown: Tool = {
  name: 'html_to_markdown',
  description: 'Convert HTML to Markdown',
  schema: {
    type: 'object',
    properties: {
      html: { type: 'string', description: 'HTML content' },
    },
    required: ['html'],
  },
  execute: async (params) => {
    return params.html.replace(/<[^>]*>/g, '');
  },
};

export const validateUrl: Tool = {
  name: 'validate_url',
  description: 'Validate a URL',
  schema: {
    type: 'object',
    properties: {
      url: { type: 'string', description: 'URL to validate' },
    },
    required: ['url'],
  },
  execute: async (params) => {
    try {
      new URL(params.url);
      return { valid: true };
    } catch {
      return { valid: false };
    }
  },
};

// Legacy exports for compatibility
export const fetchURL: Tool = webFetch;
export const extractLinks: Tool = {
  name: 'extract_links',
  description: 'Extract all links from a webpage',
  schema: {
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description: 'URL to extract links from',
      },
    },
    required: ['url'],
  },
  execute: async (params) => {
    const response = await fetch(params.url);
    const html = await response.text();
    const links: string[] = [];
    const linkRegex = /href=["'](.*?)["']/g;
    let match;
    while ((match = linkRegex.exec(html)) !== null) {
      links.push(match[1]);
    }
    return links;
  },
};
