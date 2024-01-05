import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { log, strong } from './lib/log.js';
import { applyTransformations, Transformation } from './lib/transformation.js';
import transformFile from './lib/transformFile.js';

export const isProcessable = (p: string): boolean =>
  p.endsWith('.js') || p.endsWith('.ts');

// TODO update the source-maps
export const processFile = async (pathname: string): Promise<number> => {
  const buffer = await readFile(pathname);
  const sourceCode = buffer.toString();

  const [transformations] = await transformFile(sourceCode, {
    pathname,
    absolutePathname: path.resolve(pathname),
  });

  const nt = transformations.length;

  if (nt > 0) {
    const transformedSource = applyTransformations(transformations, sourceCode);

    await writeFile(pathname, transformedSource);

    const details = transformations.map(
      (t: Transformation) =>
        `    ${t?.metaData?.type} ${strong(
          [t.originalValue, '→', t.newValue].join(' '),
        )}`,
    );

    log.info(
      [
        `\nperformed ${nt} transformation${nt !== 1 ? 's' : ''} in ${strong(
          pathname,
        )}:`,
        ...details,
        '',
      ].join('\n'),
    );
  }

  return nt;
};
