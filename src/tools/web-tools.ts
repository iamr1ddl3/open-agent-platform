import { Tool } from '../core/types';

const MAX_RESPONSE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Validate URL for security - block private IPs and restricted protocols
 */
function validateUrl(urlString: string, enforceHttps: boolean = false): void {
  let url: URL;
  try {
    url = new URL(urlString);
  } catch {
    throw new Error(`Invalid URL: "${urlString}"`);
  }

  // Check protocol
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error(`Protocol not allowed: "${url.protocol}". Only http: and https: are supported`);
  }

  // Enforce HTTPS if configured
  if (enforceHttps && url.protocol !== 'https:') {
    throw new Error(`HTTPS required: only https: URLs are allowed`);
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
    validateUrl(params.url, true); // Enforce HTTPS
    const response = await fetch(params.url, {
      method: params.method || 'GET',
      headers: params.headers || {},
    });

    // Check content length
    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > MAX_RESPONSE_SIZE) {
      throw new Error(`Response size exceeds maximum of ${MAX_RESPONSE_SIZE} bytes`);
    }

    const content = await response.text();

    // Double-check actual size
    if (content.length > MAX_RESPONSE_SIZE) {
      throw new Error(`Response size exceeds maximum of ${MAX_RESPONSE_SIZE} bytes`);
    }

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
    validateUrl(params.url);
    const response = await fetch(params.url);
    const content = await response.text();
    if (content.length > MAX_RESPONSE_SIZE) {
      throw new Error(`Response size exceeds maximum of ${MAX_RESPONSE_SIZE} bytes`);
    }
    return content;
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
    validateUrl(params.url);
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

export const validateUrlTool: Tool = {
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
    validateUrl(params.url);
    const response = await fetch(params.url);
    const html = await response.text();
    if (html.length > MAX_RESPONSE_SIZE) {
      throw new Error(`Response size exceeds maximum of ${MAX_RESPONSE_SIZE} bytes`);
    }
    const links: string[] = [];
    const linkRegex = /href=["'](.*?)["']/g;
    let match;
    while ((match = linkRegex.exec(html)) !== null) {
      links.push(match[1]);
    }
    return links;
  },
};
