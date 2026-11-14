import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import modelsRouter from '../models';

import { initializeSchema } from '../../db/schema';

const app = express();
app.use(express.json());
app.use('/', modelsRouter);

beforeAll(() => {
  initializeSchema();
}, 30000);

describe('GET /api/default-profiles (public endpoint)', () => {
  it('masks API keys — never returns real keys to client', async () => {
    const res = await request(app).get('/api/default-profiles');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    res.body.forEach((profile: any) => {
      // The API key must explicitly be an empty string to prevent leakage
      expect(profile.apiKey).toBe('');
      // It should not contain any real key data
      expect(profile.apiKey).not.toMatch(/.+/);
    });
  });

  it('includes isSystemDefault flag', async () => {
    const res = await request(app).get('/api/default-profiles');
    res.body.forEach((profile: any) => {
      expect(profile.isSystemDefault).toBe(true);
    });
  });

  it('asserts updated general labels for paid profiles, preserving roles, internal models and free profiles (Phase 5)', async () => {
    const res = await request(app).get('/api/default-profiles');
    expect(res.status).toBe(200);
    const profiles = res.body;

    // 1. paid_default
    const paidDefault = profiles.find((p: any) => p.id === 'paid_default');
    expect(paidDefault).toBeDefined();
    expect(paidDefault.name).toBe('دستیار چت و گفتگوی پیشرفته');
    expect(paidDefault.role).toBe('paid_default');
    expect(paidDefault.modelName).toBe('claude-sonnet-5');

    // 2. paid_coding
    const paidCoding = profiles.find((p: any) => p.id === 'paid_coding');
    expect(paidCoding).toBeDefined();
    expect(paidCoding.name).toBe('دستیار برنامه‌نویسی پیشرفته');
    expect(paidCoding.role).toBe('paid_coding');
    expect(paidCoding.modelName).toBe('deepseek-v4-pro');

    // 3. paid_vision
    const paidVision = profiles.find((p: any) => p.id === 'paid_vision');
    expect(paidVision).toBeDefined();
    expect(paidVision.name).toBe('دستیار اسناد و بینایی پیشرفته');
    expect(paidVision.role).toBe('paid_vision');
    expect(paidVision.modelName).toBe('gemini-3.8-flash');

    // 4. Free profiles intact
    const freeDefault = profiles.find((p: any) => p.id === 'free_default');
    expect(freeDefault).toBeDefined();
    expect(freeDefault.name).toBe('دستیار چت و گفتگو');
    expect(freeDefault.role).toBe('default');

    const freeCoding = profiles.find((p: any) => p.id === 'free_coding');
    expect(freeCoding).toBeDefined();
    expect(freeCoding.name).toBe('دستیار برنامه‌نویسی و کد');
    expect(freeCoding.role).toBe('coding');

    const freeVision = profiles.find((p: any) => p.id === 'free_vision');
    expect(freeVision).toBeDefined();
    expect(freeVision.name).toBe('دستیار بینایی و اسناد');
    expect(freeVision.role).toBe('vision');
  });
});
