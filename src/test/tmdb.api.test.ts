import { describe, it, expect } from 'vitest';
import { searchTMDB, getTrending, getDisplayTitle, getYear } from '../lib/tmdb';

describe('API Contract & Integration Testing: TMDB API', () => {
  it('API-TMDB-001: Should search and return structured media objects with valid schema', async () => {
    const data = await searchTMDB('Attack on Titan');

    expect(data).toHaveProperty('results');
    expect(Array.isArray(data.results)).toBe(true);
    expect(data.results.length).toBeGreaterThan(0);

    const firstItem = data.results[0];
    expect(firstItem).toHaveProperty('id');
    expect(typeof firstItem.id).toBe('number');
    expect(firstItem.title || firstItem.name).toBeDefined();
    expect(Array.isArray(firstItem.genre_ids)).toBe(true);
  });

  it('API-TMDB-002: Should fetch trending items with valid poster/backdrop attributes', async () => {
    const data = await getTrending('all', 'week');

    expect(data).toHaveProperty('results');
    expect(data.results.length).toBeGreaterThan(0);

    const item = data.results[0];
    const displayTitle = getDisplayTitle(item);
    expect(typeof displayTitle).toBe('string');
    expect(displayTitle.length).toBeGreaterThan(0);
  });

  it('API-TMDB-003: Helper functions handle missing/null metadata safely', () => {
    const mockItemEmpty = { id: 999, vote_average: 0, genre_ids: [] };
    expect(getDisplayTitle(mockItemEmpty as any)).toBe('Unknown');
    expect(getYear(mockItemEmpty as any)).toBe('');
  });
});
