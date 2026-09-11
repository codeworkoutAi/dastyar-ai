import { describe, it, expect } from 'vitest';
import { isSafeBaseUrl } from '../utils';

describe('isSafeBaseUrl – SSRF protection', () => {
  it('blocks AWS/GCP cloud metadata endpoint', () => {
    expect(isSafeBaseUrl('http://169.254.169.254/latest/meta-data/')).toBe(false);
  });
  
  it('blocks localhost', () => {
    expect(isSafeBaseUrl('http://localhost:8080/api')).toBe(false);
  });
  
  it('blocks loopback IPv4', () => {
    expect(isSafeBaseUrl('http://127.0.0.1:5000')).toBe(false);
  });
  
  it('blocks private IPv4 ranges (RFC 1918)', () => {
    expect(isSafeBaseUrl('http://10.0.0.1')).toBe(false);
    expect(isSafeBaseUrl('http://192.168.1.100')).toBe(false);
    expect(isSafeBaseUrl('http://172.16.0.1')).toBe(false);
    expect(isSafeBaseUrl('http://172.31.255.255')).toBe(false);
  });
  
  it('blocks private TLDs', () => {
    expect(isSafeBaseUrl('http://service.internal')).toBe(false);
    expect(isSafeBaseUrl('http://service.local')).toBe(false);
  });
  
  it('allows legitimate HTTPS endpoints', () => {
    expect(isSafeBaseUrl('https://api.groq.com/openai/v1')).toBe(true);
    expect(isSafeBaseUrl('https://generativelanguage.googleapis.com')).toBe(true);
  });
});
