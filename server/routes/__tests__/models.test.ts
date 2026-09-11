import request from 'supertest';
import express from 'express';
import modelsRouter from '../models';

import { initializeSchema } from '../../db/schema';

const app = express();
app.use(express.json());
app.use('/', modelsRouter);

beforeAll(() => {
  initializeSchema();
});

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
});
