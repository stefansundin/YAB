import {
  stat,
  readFile,
  writeFile,
} from 'fs/promises';

import path from 'path';
import { URL } from 'url';

import minimist from 'minimist';
import chokidar from 'chokidar';

import {
  postpone,
} from './lib/util';

import {
  applyTransformations,
  Transformation,
} from './lib/transformation';

import transformFile from './lib/transformFile';

import log from './lib/log';
import usage from './usage';

type ProcessFileOptions = {
  assumePathAndTypeValid?: boolean
}

const metaURLString = import.meta.url;
const {
  pathname: thisScriptPathname,
} = new URL(metaURLString);

const printUsage = () => log(usage);

const bail = (errMessage: string, exitCode = 1): never => {
  log(`\n>> Error: ${errMessage}\n`);
  printUsage();
  process.exit(exitCode);
};

const [inputPathArgument] = minimist(process.argv.slice(2))._;

if (!inputPathArgument) {
  bail('Please provide a path to a directory to watch.');
}

// TODO update the source-maps
const processFile = async (
  pathname: string,
  options?: ProcessFileOptions,
): Promise<number> => {
  if (!options?.assumePathAndTypeValid) {
    try {
      const s = await stat(pathname);
      if (!s.isFile()) {
        bail('Path does not point to a file.');
      }
    } catch (e) {
      if (e.code !== 'ENOENT') {
        bail(`Unexpected error ${e.code}`);
      }
      bail('File does not exist.');
    }
  }

  const buffer = await readFile(pathname);
  const sourceCode = buffer.toString();

  const [transformations] = await transformFile(sourceCode, {
    pathname,
  });

  const nt = transformations.length;

  if (nt > 0) {
    const transformedSource = applyTransformations(
      transformations,
      sourceCode,
    );

    await writeFile(pathname, transformedSource);

    const details = transformations.map(
      (t: Transformation) =>
        `    ${
          t?.metaData?.type
        } ${
          t.originalValue
        } => ${t.newValue}`,
    );

    log.info([
      `performed ${
        nt
      } transformation${
        nt !== 1 ? 's' : ''
      } in "${pathname}":`,
      ...details,
    ].join('\n'));
  }

  return nt;
};

const isPathBlacklisted = (filePath: string): boolean => {
  if (/\bnode_modules\b/.test(filePath)) {
    return true;
  }

  return false;
};

const startWatching = async (dirPath: string): Promise<void> => {
  try {
    const s = await stat(dirPath);
    if (!s.isDirectory()) {
      bail('Path does not point to a directory.');
    }
  } catch (e) {
    if (e.code !== 'ENOENT') {
      bail(`Unexpected error ${e.code}`);
    }
    bail('Directory does not exist.');
  }

  log.info(`started watching directory ${dirPath}`);

  let nDirs = 0;
  let nFiles = 0;
  let nProcessable = 0;

  const report = postpone(500)(
    () => log(
      `watching ${nDirs
      } directories totalling ${nFiles
      } files, of which ${nProcessable
      } are of interest to us`,
    ),
  );

  const isProcessable = (p: string) =>
    p.endsWith('.js')
    && !isPathBlacklisted(p);

  chokidar.watch(dirPath).on('all', (event, eventPath) => {
    if (event === 'add') {
      nFiles += 1;
      if (isProcessable(eventPath)) {
        nProcessable += 1;
        report();
      }
    }

    if (event === 'addDir') {
      nDirs += 1;
      report();
    }

    if (event === 'unlink') {
      nFiles -= 1;
      if (isProcessable(eventPath)) {
        nProcessable -= 1;
        report();
      }
    }

    if (event === 'unlinkDir') {
      nDirs -= 1;
      report();
    }

    if (event === 'add' || event === 'change') {
      if (isProcessable(eventPath)) {
        processFile(eventPath, {
          assumePathAndTypeValid: true,
        });

        if (path.resolve(eventPath) === thisScriptPathname) {
          log.info('[YAB is watching its own transpilation directory]');
        }
      }
    }
  });
};

startWatching(inputPathArgument);