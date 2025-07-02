import { Brand } from 'ts-brand';

export type Filename<Ext extends boolean = true> = Brand<string, Ext extends true ? 'filename.ext' : 'filename.noext'>;
export type Filepath<PathType extends 'rel' | 'abs' = any> = Brand<string, PathType extends 'abs' ? 'filepath.absolute' : 'filepath.relative'>;
export type Dirpath<PathType extends 'rel' | 'abs'> = Brand<string, PathType extends 'abs' ? 'dirpath.absolute' : 'dirpath.relative'>;
