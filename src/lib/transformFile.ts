import babelParser from '@babel/parser';

import { Options } from '../bin.js';
import appendJsExtension from './appendJsExtension.js';
import { Transformation } from './transformation.js';

export type SourceInfo = {
  filePath: string;
};

export type FileMetaData = {
  pathname: string;
  absolutePathname: string;
  sourceMappingURL?: string;
};

export const transformFile = async (
  sourceCode: string,
  sourceFileMetaData: FileMetaData,
  options: Options,
): Promise<[Transformation[], FileMetaData]> => {
  const ast = babelParser.parse(sourceCode, {
    sourceType: 'module',
    plugins: [
      'jsx',
      'typescript',
      'decorators-legacy',
      ['importAttributes', { deprecatedAssertSyntax: true }],
    ],
  });

  return appendJsExtension(ast, sourceFileMetaData, options);
};

export default transformFile;
