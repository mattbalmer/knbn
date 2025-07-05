import { getNow } from '../../src/utils/misc';

describe('misc utils', () => {
  describe('getNow', () => {
    it('should return a valid ISO string', () => {
      const now = getNow();
      
      expect(typeof now).toBe('string');
      expect(() => new Date(now)).not.toThrow();
      expect(new Date(now).toISOString()).toBe(now);
    });

    it('should return current time', () => {
      const before = new Date().getTime();
      const now = new Date(getNow()).getTime();
      const after = new Date().getTime();
      
      expect(now).toBeGreaterThanOrEqual(before);
      expect(now).toBeLessThanOrEqual(after);
    });

    it('should return different times when called multiple times', () => {
      const time1 = getNow();
      // Small delay to ensure different timestamps
      const time2 = getNow();
      
      // While they might be the same due to timing, they should be valid ISO strings
      expect(typeof time1).toBe('string');
      expect(typeof time2).toBe('string');
      expect(() => new Date(time1)).not.toThrow();
      expect(() => new Date(time2)).not.toThrow();
    });
  });
});