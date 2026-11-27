import fs from 'fs';
import path from 'path';
import { chromium, Browser } from 'playwright-core';

let cachedFontCss: string | null = null;
let browserPromise: Promise<Browser> | null = null;

export const escapeHtml = (input: unknown): string => {
  if (input === null || input === undefined) return '';
  return String(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

export const safeMediaSrc = (url?: string | null): string => {
  if (!url) return '';
  const trimmed = url.trim();
  if (
    trimmed.startsWith('data:image/') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('http://')
  ) {
    return trimmed;
  }
  return '';
};

export const loadBundledFontCss = (): string => {
  if (cachedFontCss !== null) {
    return cachedFontCss;
  }

  const faceDefinitions: Array<{
    family: string;
    weight: number;
    unicodeRange?: string;
    modulePath: string;
  }> = [
    {
      family: 'Inter',
      weight: 400,
      modulePath: '@fontsource/inter/files/inter-latin-400-normal.woff2',
    },
    {
      family: 'Inter',
      weight: 500,
      modulePath: '@fontsource/inter/files/inter-latin-500-normal.woff2',
    },
    {
      family: 'Inter',
      weight: 600,
      modulePath: '@fontsource/inter/files/inter-latin-600-normal.woff2',
    },
    {
      family: 'Inter',
      weight: 700,
      modulePath: '@fontsource/inter/files/inter-latin-700-normal.woff2',
    },
    {
      family: 'Noto Sans Bengali',
      weight: 400,
      unicodeRange: 'U+0964-0965, U+0980-09FF, U+200C-200D, U+25CC',
      modulePath: '@fontsource/noto-sans-bengali/files/noto-sans-bengali-bengali-400-normal.woff2',
    },
    {
      family: 'Noto Sans Bengali',
      weight: 500,
      unicodeRange: 'U+0964-0965, U+0980-09FF, U+200C-200D, U+25CC',
      modulePath: '@fontsource/noto-sans-bengali/files/noto-sans-bengali-bengali-500-normal.woff2',
    },
    {
      family: 'Noto Sans Bengali',
      weight: 600,
      unicodeRange: 'U+0964-0965, U+0980-09FF, U+200C-200D, U+25CC',
      modulePath: '@fontsource/noto-sans-bengali/files/noto-sans-bengali-bengali-600-normal.woff2',
    },
    {
      family: 'Noto Sans Bengali',
      weight: 700,
      unicodeRange: 'U+0964-0965, U+0980-09FF, U+200C-200D, U+25CC',
      modulePath: '@fontsource/noto-sans-bengali/files/noto-sans-bengali-bengali-700-normal.woff2',
    },
    {
      family: 'Noto Sans Bengali',
      weight: 400,
      modulePath: '@fontsource/noto-sans-bengali/files/noto-sans-bengali-latin-400-normal.woff2',
    },
    {
      family: 'Noto Sans Bengali',
      weight: 600,
      modulePath: '@fontsource/noto-sans-bengali/files/noto-sans-bengali-latin-600-normal.woff2',
    },
    {
      family: 'Noto Sans Bengali',
      weight: 700,
      modulePath: '@fontsource/noto-sans-bengali/files/noto-sans-bengali-latin-700-normal.woff2',
    },
  ];

  const blocks: string[] = [];
  for (const face of faceDefinitions) {
    try {
      const resolvedPath = require.resolve(face.modulePath);
      const base64 = fs.readFileSync(resolvedPath).toString('base64');
      blocks.push(`
@font-face {
  font-family: '${face.family}';
  font-style: normal;
  font-weight: ${face.weight};
  font-display: block;
  ${face.unicodeRange ? `unicode-range: ${face.unicodeRange};` : ''}
  src: url('data:font/woff2;base64,${base64}') format('woff2');
}`);
    } catch {
      // Skip weight cleanly if unavailable
    }
  }

  cachedFontCss = blocks.join('\n');
  return cachedFontCss;
};

const findChromiumExecutable = (): string | undefined => {
  const candidates: string[] = [];

  if (process.env.CHROMIUM_EXECUTABLE_PATH) {
    candidates.push(process.env.CHROMIUM_EXECUTABLE_PATH);
  }
  if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH) {
    candidates.push(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH);
  }

  try {
    const pwDefault = chromium.executablePath();
    if (pwDefault) candidates.push(pwDefault);
  } catch {
    // ignore
  }

  if (process.platform === 'win32') {
    const localAppData = process.env.LOCALAPPDATA || '';
    if (localAppData) {
      const msPlaywrightDir = path.join(localAppData, 'ms-playwright');
      if (fs.existsSync(msPlaywrightDir)) {
        const dirs = fs.readdirSync(msPlaywrightDir).sort().reverse();
        for (const dir of dirs) {
          if (dir.startsWith('chromium_headless_shell')) {
            candidates.push(
              path.join(
                msPlaywrightDir,
                dir,
                'chrome-headless-shell-win64',
                'chrome-headless-shell.exe'
              )
            );
          }
          if (dir.startsWith('chromium-')) {
            candidates.push(path.join(msPlaywrightDir, dir, 'chrome-win64', 'chrome.exe'));
          }
        }
      }
    }
    candidates.push(
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
    );
  } else {
    candidates.push(
      '/usr/bin/chromium',
      '/usr/bin/chromium-browser',
      '/usr/bin/google-chrome',
      '/usr/bin/google-chrome-stable'
    );
  }

  return candidates.find((p) => p && fs.existsSync(p));
};

export const getPdfBrowserInstance = async (): Promise<Browser> => {
  if (browserPromise) {
    try {
      const existing = await browserPromise;
      if (existing.isConnected()) {
        return existing;
      }
    } catch {
      // recreate below
    }
    browserPromise = null;
  }

  const executablePath = findChromiumExecutable();
  browserPromise = chromium
    .launch({
      ...(executablePath ? { executablePath } : {}),
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--font-render-hinting=none',
      ],
    })
    .then((browser) => {
      browser.on('disconnected', () => {
        browserPromise = null;
      });
      return browser;
    })
    .catch((err) => {
      browserPromise = null;
      throw err;
    });

  return browserPromise;
};

export const closePdfBrowser = async (): Promise<void> => {
  if (browserPromise) {
    try {
      const b = await browserPromise;
      await b.close();
    } catch {
      // ignore
    } finally {
      browserPromise = null;
    }
  }
};

export const renderHtmlToA4Pdf = async (params: {
  html: string;
  headerTemplate?: string;
  footerTemplate?: string;
  margin?: {
    top?: string | number;
    bottom?: string | number;
    left?: string | number;
    right?: string | number;
  };
}): Promise<Buffer> => {
  const browser = await getPdfBrowserInstance();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.setContent(params.html, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.evaluate(async () => {
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }
    });

    const pdfBytes = await page.pdf({
      format: 'A4',
      landscape: false,
      printBackground: true,
      displayHeaderFooter: Boolean(params.headerTemplate || params.footerTemplate),
      headerTemplate: params.headerTemplate,
      footerTemplate: params.footerTemplate,
      margin: params.margin || {
        top: '13mm',
        bottom: '14mm',
        left: '11mm',
        right: '11mm',
      },
    });

    return Buffer.from(pdfBytes);
  } finally {
    await context.close();
  }
};
