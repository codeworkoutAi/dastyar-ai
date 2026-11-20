import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { initializeSchema } from '../../db/schema';
import { renderHtmlWithSeo, invalidateSeoHtmlCache } from '../htmlInjector';

function createMockRes() {
  const headers: Record<string, string> = {};
  let body = '';
  let sentFile = '';
  return {
    headers,
    get body() { return body; },
    get sentFile() { return sentFile; },
    setHeader(k: string, v: string) { headers[k] = v; },
    send(payload: string) { body = payload; return this; },
    sendFile(filePath: string) { sentFile = filePath; return this; },
  } as any;
}

describe('htmlInjector SSR SEO & RAM caching', () => {
  let tmpDir: string;

  beforeEach(() => {
    initializeSchema();
    invalidateSeoHtmlCache();
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'seo-injector-'));
    const templateHtml = fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf-8');
    fs.writeFileSync(path.join(tmpDir, 'index.html'), templateHtml, 'utf-8');
  });

  afterEach(() => {
    invalidateSeoHtmlCache();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('injects optimized /about title, description, canonical, and H1', async () => {
    const req = {
      path: '/about',
      protocol: 'https',
      headers: { 'x-forwarded-proto': 'https' },
      get: (name: string) => (name === 'host' ? 'dastyarai.com' : ''),
    } as any;
    const res = createMockRes();

    await renderHtmlWithSeo(req, res, tmpDir);

    expect(res.headers['Content-Type']).toBe('text/html; charset=utf-8');
    expect(res.body).toContain('<title>درباره Dastyar AI | فروشگاه تخصصی ابزارها و اکانت‌های قانونی هوش مصنوعی</title>');
    expect(res.body).toContain('<link rel="canonical" href="https://dastyarai.com/about" />');
    expect(res.body).toContain('>درباره Dastyar AI</h1>');
  });

  it('serves cached static /about HTML from RAM after initial render and clears on invalidateSeoHtmlCache', async () => {
    const req = {
      path: '/about',
      protocol: 'https',
      headers: { 'x-forwarded-proto': 'https' },
      get: (name: string) => (name === 'host' ? 'dastyarai.com' : ''),
    } as any;

    const firstRes = createMockRes();
    await renderHtmlWithSeo(req, firstRes, tmpDir);
    expect(firstRes.body).toContain('درباره Dastyar AI | فروشگاه تخصصی');

    // Remove index.html from disk — RAM cache should still serve /about cleanly
    fs.unlinkSync(path.join(tmpDir, 'index.html'));

    const cachedRes = createMockRes();
    await renderHtmlWithSeo(req, cachedRes, tmpDir);
    expect(cachedRes.body).toBe(firstRes.body);
    expect(cachedRes.sentFile).toBe('');

    // After invalidation and missing index.html, it falls back to sendFile
    invalidateSeoHtmlCache();
    const afterInvalidateRes = createMockRes();
    await renderHtmlWithSeo(req, afterInvalidateRes, tmpDir);
    expect(afterInvalidateRes.sentFile).toBe(path.join(tmpDir, 'index.html'));
  });
});
