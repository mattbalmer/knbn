import path from 'path';
import { Dirpath, Filename, Filepath } from '../types';
import { Brands } from './ts';

export const extractFilenameFromPath = <Ext extends boolean = false>(filepath: Filepath<'abs'>, options?: { ext?: Ext }): Filename<Ext> => {
  const ext = options?.ext ?? false;
  const fileName = filepath.split('/').pop() || '';
  const name = ext ? fileName : fileName.replace(/\.knbn$/, '');
  return Brands.Filename<Ext>(name);
}

export const getFilenameFromBoardName = <Ext extends boolean = true>(boardName: string, options?: { ext?: Ext }): Filename<Ext> => {
  const ext = options?.ext ?? true;
  const filenameNormalized = boardName?.toLowerCase().replace(/\s+/g, '-');
  const name = `${filenameNormalized || ''}` + (ext ? '.knbn' : '');
  return Brands.Filename<Ext>(name);
}

export const getFilepathForBoardFile = (filename: string): Filepath<'abs'> => {
  const cwd = process.cwd();
  if (!filename.endsWith('.knbn')) {
    filename += '.knbn';
  }
  return Brands.Filepath<'abs'>(path.join(cwd, filename));
}

export const pcwd = (): Dirpath<'abs'> => {
  return Brands.Dirpath<'abs'>(process.cwd());
}

export const ensureAbsolutePath = (pathstring: string): Filepath<'abs'> => {
  if (pathstring.startsWith('/')) {
    return Brands.Filepath<'abs'>(pathstring);
  }
  return Brands.Filepath<'abs'>(path.join(process.cwd(), pathstring));
}