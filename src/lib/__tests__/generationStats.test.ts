import { _resetStats, recordGenerationDuration, getAdaptiveTimeoutMs } from '../generationStats';

describe('generationStats', () => {
  beforeEach(() => {
    _resetStats();
  });

  test('getAdaptiveTimeoutMs returns fallback when no data', () => {
    const t = getAdaptiveTimeoutMs('unknown-model');
    expect(typeof t).toBe('number');
    expect(t).toBeGreaterThanOrEqual(30000); // at least 30s
  });

  test('recording durations affects adaptive timeout', () => {
    const model = 'mymodel-v1';
    // record some short durations
    for (let i = 0; i < 10; i++) recordGenerationDuration(model, 10_000 + i * 1000);
    const t1 = getAdaptiveTimeoutMs(model);

    // record some larger runs
    for (let i = 0; i < 10; i++) recordGenerationDuration(model, 120_000 + i * 2000);
    const t2 = getAdaptiveTimeoutMs(model);

    expect(t2).toBeGreaterThanOrEqual(t1);
    expect(t2).toBeGreaterThanOrEqual(120000);
  });
});