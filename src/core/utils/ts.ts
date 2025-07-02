import { Dirpath, Filename, Filepath } from '../types';

export const Brands = {
  Filename: <Ext extends boolean>(value: string): Filename<Ext> => {
    return value as Filename<Ext>;
  },
  Filepath: <PathType extends 'rel' | 'abs'>(value: string): Filepath<PathType> => {
    return value as Filepath<PathType>;
  },
  Dirpath: <PathType extends 'rel' | 'abs'>(value: string): Dirpath<PathType> => {
    return value as Dirpath<PathType>;
  },
};