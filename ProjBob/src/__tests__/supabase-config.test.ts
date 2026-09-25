import { afterEach, describe, expect, it, vi } from 'vitest';

// Helpers to manipulate process.env cleanly across each test.
function setEnv(url: string | undefined, key: string | undefined) {
  if (url === undefined) {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  } else {
    process.env.NEXT_PUBLIC_SUPABASE_URL = url;
  }
  if (key === undefined) {
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  } else {
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = key;
  }
}

afterEach(() => {
  // Reset env vars after every test so they don't bleed between specs.
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  vi.resetModules();
});

describe('isSupabaseConfigured', () => {
  it('returns false when both env vars are absent', async () => {
    setEnv(undefined, undefined);
    const { isSupabaseConfigured } = await import('@/lib/supabase/config');
    expect(isSupabaseConfigured()).toBe(false);
  });

  it('returns false when only URL is set', async () => {
    setEnv('https://example.supabase.co', undefined);
    const { isSupabaseConfigured } = await import('@/lib/supabase/config');
    expect(isSupabaseConfigured()).toBe(false);
  });

  it('returns false when only anon key is set', async () => {
    setEnv(undefined, 'anon-key-value');
    const { isSupabaseConfigured } = await import('@/lib/supabase/config');
    expect(isSupabaseConfigured()).toBe(false);
  });

  it('returns true when both env vars are present', async () => {
    setEnv('https://example.supabase.co', 'anon-key-value');
    const { isSupabaseConfigured } = await import('@/lib/supabase/config');
    expect(isSupabaseConfigured()).toBe(true);
  });

  it('returns false when env vars are empty strings', async () => {
    setEnv('', '');
    const { isSupabaseConfigured } = await import('@/lib/supabase/config');
    expect(isSupabaseConfigured()).toBe(false);
  });
});

describe('getSupabaseConfig', () => {
  it('throws when env vars are missing', async () => {
    setEnv(undefined, undefined);
    const { getSupabaseConfig } = await import('@/lib/supabase/config');
    expect(() => getSupabaseConfig()).toThrow(/Missing Supabase environment variables/);
  });

  it('throws when only URL is present', async () => {
    setEnv('https://example.supabase.co', undefined);
    const { getSupabaseConfig } = await import('@/lib/supabase/config');
    expect(() => getSupabaseConfig()).toThrow(/Missing Supabase environment variables/);
  });

  it('returns config object when both vars are set', async () => {
    setEnv('https://example.supabase.co', 'test-anon-key');
    const { getSupabaseConfig } = await import('@/lib/supabase/config');
    const config = getSupabaseConfig();
    expect(config.url).toBe('https://example.supabase.co');
    expect(config.anonKey).toBe('test-anon-key');
  });
});
