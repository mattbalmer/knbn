import { Brands } from '../../../src/core/utils/ts';
import { Filename, Filepath, Dirpath } from '../../../src/core/types/ts';

describe('ts utils', () => {
  describe('Brands', () => {
    describe('Filename', () => {
      it('should create a branded filename with extension', () => {
        const filename = Brands.Filename<true>('test.knbn');
        
        expect(filename).toBe('test.knbn');
        expect(typeof filename).toBe('string');
      });

      it('should create a branded filename without extension', () => {
        const filename = Brands.Filename<false>('test');
        
        expect(filename).toBe('test');
        expect(typeof filename).toBe('string');
      });

      it('should handle empty strings', () => {
        const filename = Brands.Filename<true>('');
        
        expect(filename).toBe('');
        expect(typeof filename).toBe('string');
      });
    });

    describe('Filepath', () => {
      it('should create a branded absolute filepath', () => {
        const filepath = Brands.Filepath<'abs'>('/absolute/path/to/file.knbn');
        
        expect(filepath).toBe('/absolute/path/to/file.knbn');
        expect(typeof filepath).toBe('string');
      });

      it('should create a branded relative filepath', () => {
        const filepath = Brands.Filepath<'rel'>('relative/path/to/file.knbn');
        
        expect(filepath).toBe('relative/path/to/file.knbn');
        expect(typeof filepath).toBe('string');
      });

      it('should handle empty strings', () => {
        const filepath = Brands.Filepath<'abs'>('');
        
        expect(filepath).toBe('');
        expect(typeof filepath).toBe('string');
      });
    });

    describe('Dirpath', () => {
      it('should create a branded absolute dirpath', () => {
        const dirpath = Brands.Dirpath<'abs'>('/absolute/path/to/directory');
        
        expect(dirpath).toBe('/absolute/path/to/directory');
        expect(typeof dirpath).toBe('string');
      });

      it('should create a branded relative dirpath', () => {
        const dirpath = Brands.Dirpath<'rel'>('relative/path/to/directory');
        
        expect(dirpath).toBe('relative/path/to/directory');
        expect(typeof dirpath).toBe('string');
      });

      it('should handle empty strings', () => {
        const dirpath = Brands.Dirpath<'abs'>('');
        
        expect(dirpath).toBe('');
        expect(typeof dirpath).toBe('string');
      });
    });

    it('should preserve the original string value while adding type safety', () => {
      const originalString = '/path/to/file.knbn';
      const filename = Brands.Filename(originalString);
      const filepath = Brands.Filepath(originalString);
      const dirpath = Brands.Dirpath(originalString);
      
      expect(filename).toBe(originalString);
      expect(filepath).toBe(originalString);
      expect(dirpath).toBe(originalString);
    });
  });
});