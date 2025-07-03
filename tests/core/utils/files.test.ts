import * as path from 'path';
import { 
  extractFilenameFromPath, 
  getFilenameFromBoardName, 
  getFilepathForBoardFile, 
  pcwd, 
  ensureAbsolutePath 
} from '../../../src/core/utils/files';
import { Brands } from '../../../src/core/utils/ts';

describe('files utils', () => {
  let originalCwd: string;

  beforeAll(() => {
    originalCwd = process.cwd();
  });

  afterAll(() => {
    process.chdir(originalCwd);
  });

  describe('extractFilenameFromPath', () => {
    it('should extract filename without extension by default', () => {
      const filepath = Brands.Filepath<'abs'>('/path/to/test.knbn');
      const filename = extractFilenameFromPath(filepath);
      
      expect(filename).toBe('test');
    });

    it('should extract filename with extension when ext option is true', () => {
      const filepath = Brands.Filepath<'abs'>('/path/to/test.knbn');
      const filename = extractFilenameFromPath(filepath, { ext: true });
      
      expect(filename).toBe('test.knbn');
    });

    it('should handle paths without extension', () => {
      const filepath = Brands.Filepath<'abs'>('/path/to/test');
      const filename = extractFilenameFromPath(filepath);
      
      expect(filename).toBe('test');
    });

    it('should handle Windows-style paths', () => {
      const filepath = Brands.Filepath<'abs'>('C:\\\\path\\\\to\\\\test.knbn');
      const filename = extractFilenameFromPath(filepath);
      
      // On non-Windows systems, this will be treated as a filename with backslashes
      expect(filename).toBe(path.parse(filepath).name);
    });

    it('should handle empty path', () => {
      const filepath = Brands.Filepath<'abs'>('');
      const filename = extractFilenameFromPath(filepath);
      
      expect(filename).toBe('');
    });

    it('should handle path with only filename', () => {
      const filepath = Brands.Filepath<'abs'>('test.knbn');
      const filename = extractFilenameFromPath(filepath);
      
      expect(filename).toBe('test');
    });
  });

  describe('getFilenameFromBoardName', () => {
    it('should create filename with extension by default', () => {
      const filename = getFilenameFromBoardName('My Board');
      
      expect(filename).toBe('my-board.knbn');
    });

    it('should create filename without extension when ext is false', () => {
      const filename = getFilenameFromBoardName('My Board', { ext: false });
      
      expect(filename).toBe('my-board');
    });

    it('should normalize spaces to hyphens', () => {
      const filename = getFilenameFromBoardName('My Awesome Board');
      
      expect(filename).toBe('my-awesome-board.knbn');
    });

    it('should handle multiple consecutive spaces', () => {
      const filename = getFilenameFromBoardName('My    Board   Name');
      
      expect(filename).toBe('my-board-name.knbn');
    });

    it('should handle empty board name', () => {
      const filename = getFilenameFromBoardName('');
      
      expect(filename).toBe('.knbn');
    });

    it('should handle undefined board name', () => {
      const filename = getFilenameFromBoardName(undefined as any);
      
      expect(filename).toBe('.knbn');
    });

    it('should convert to lowercase', () => {
      const filename = getFilenameFromBoardName('MY BOARD');
      
      expect(filename).toBe('my-board.knbn');
    });

    it('should handle special characters', () => {
      const filename = getFilenameFromBoardName('Board-Name_Test');
      
      expect(filename).toBe('board-name_test.knbn');
    });
  });

  describe('getFilepathForBoardFile', () => {
    it('should create absolute path with current working directory', () => {
      const cwd = process.cwd();
      const filepath = getFilepathForBoardFile('test.knbn');
      
      expect(filepath).toBe(path.join(cwd, 'test.knbn'));
    });

    it('should add .knbn extension if not present', () => {
      const cwd = process.cwd();
      const filepath = getFilepathForBoardFile('test');
      
      expect(filepath).toBe(path.join(cwd, 'test.knbn'));
    });

    it('should not double-add .knbn extension', () => {
      const cwd = process.cwd();
      const filepath = getFilepathForBoardFile('test.knbn');
      
      expect(filepath).toBe(path.join(cwd, 'test.knbn'));
    });

    it('should handle empty filename', () => {
      const cwd = process.cwd();
      const filepath = getFilepathForBoardFile('');
      
      expect(filepath).toBe(path.join(cwd, '.knbn'));
    });
  });

  describe('pcwd', () => {
    it('should return current working directory as branded type', () => {
      const expectedCwd = process.cwd();
      const cwd = pcwd();
      
      expect(cwd).toBe(expectedCwd);
      expect(typeof cwd).toBe('string');
    });

    it('should return absolute path', () => {
      const cwd = pcwd();
      
      expect(path.isAbsolute(cwd)).toBe(true);
    });
  });

  describe('ensureAbsolutePath', () => {
    it('should return absolute path unchanged', () => {
      const absolutePath = '/absolute/path/to/file.knbn';
      const result = ensureAbsolutePath(absolutePath);
      
      expect(result).toBe(absolutePath);
    });

    it('should convert relative path to absolute', () => {
      const relativePath = 'relative/path/to/file.knbn';
      const expectedAbsolute = path.join(process.cwd(), relativePath);
      const result = ensureAbsolutePath(relativePath);
      
      expect(result).toBe(expectedAbsolute);
    });

    it('should handle current directory reference', () => {
      const relativePath = './file.knbn';
      const expectedAbsolute = path.join(process.cwd(), relativePath);
      const result = ensureAbsolutePath(relativePath);
      
      expect(result).toBe(expectedAbsolute);
    });

    it('should handle parent directory reference', () => {
      const relativePath = '../file.knbn';
      const expectedAbsolute = path.join(process.cwd(), relativePath);
      const result = ensureAbsolutePath(relativePath);
      
      expect(result).toBe(expectedAbsolute);
    });

    it('should handle empty string', () => {
      const expectedAbsolute = path.join(process.cwd(), '');
      const result = ensureAbsolutePath('');
      
      expect(result).toBe(expectedAbsolute);
    });

    it('should handle Windows absolute paths', () => {
      const windowsPath = 'C:\\\\path\\\\to\\\\file.knbn';
      const result = ensureAbsolutePath(windowsPath);
      
      // On non-Windows systems, this will be treated as relative
      // On Windows systems, this will be treated as absolute
      expect(typeof result).toBe('string');
    });
  });
});