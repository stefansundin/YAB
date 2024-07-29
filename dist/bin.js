#!/usr/bin/env node
import { readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { URL } from 'node:url';
import chokidar from 'chokidar';
import { formatSourceFromFile } from 'format-imports';
import minimist from 'minimist';
import log, { strong } from './lib/log.js';
import { postpone, recursivelyReadDirectory } from './lib/util.js';
import { isProcessable, processFile } from './processFile.js';
import usage from './usage.js';
const metaURLString = import.meta.url;
const { pathname: thisScriptPathname } = new URL(metaURLString);
const printUsage = () => log(usage);
const bail = (errMessage, exitCode = 1) => {
    log(`\n>> Error: ${errMessage}\n`);
    log('Use --help to see usage instructions.');
    process.exit(exitCode);
};
const { _: [userProvidedPathname], ...options } = minimist(process.argv.slice(2));
if (options.help) {
    printUsage();
    process.exit(0);
}
if (!userProvidedPathname) {
    bail('Please provide a path to a directory or file to transform.');
}
const tryAndProcessFile = async (pathname) => {
    try {
        await processFile(pathname, options);
    }
    catch (e) {
        if (e.code === 'BABEL_PARSER_SYNTAX_ERROR') {
            log.error(`Babel was not able to parse the file "${pathname}", so it wasn't processed.`, 'The error reported by babel was:', e.message, 'You should probably check the source TypeScript file.', 'Your JavaScript Application will most likely not be able to run.');
        }
        else {
            throw e;
        }
    }
};
const sortImports = async (pathname) => {
    const text = (await readFile(pathname)).toString();
    const newText = await formatSourceFromFile(text, pathname, {});
    if (newText) {
        // newText is undefined when everything is sorted already
        await writeFile(pathname, newText);
    }
};
const startWatching = async (dirPath) => {
    try {
        const s = await stat(dirPath);
        if (!s.isDirectory()) {
            bail('Path does not point to a directory.');
        }
    }
    catch (e) {
        if (e.code !== 'ENOENT') {
            bail(`Unexpected error ${e.code}`);
        }
        bail('Directory does not exist.');
    }
    log.info(`started watching directory ${dirPath}`);
    let nDirs = 0;
    let nFiles = 0;
    let nProcessable = 0;
    const report = postpone(500)(() => log(`watching ${nDirs} directories totalling ${nFiles} files, of which ${nProcessable} are of interest to us`));
    chokidar.watch(dirPath).on('all', async (event, eventPath) => {
        if (event === 'add') {
            nFiles += 1;
            if (isProcessable(eventPath)) {
                nProcessable += 1;
            }
            report();
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
                tryAndProcessFile(eventPath);
                if (path.resolve(eventPath) === thisScriptPathname) {
                    log.warning('YAB is watching its own transpilation directory');
                }
            }
        }
    });
};
const processOnce = async (pathname) => {
    const allFiles = await recursivelyReadDirectory(pathname);
    const processableFiles = allFiles.filter(isProcessable);
    log.info(`Processing files in "${pathname}" and then exiting.`);
    log.info('Found files:');
    processableFiles.forEach((file) => {
        log.info(`  ${strong(file)}`);
    });
    await Promise.all(processableFiles.map(tryAndProcessFile));
    if (options.sort) {
        log.info('Sorting imports...');
        await Promise.all(processableFiles.map(sortImports));
        log.info();
    }
    log.info('All done here. Have a nice day!');
};
if (options.watch) {
    startWatching(userProvidedPathname);
}
else {
    processOnce(userProvidedPathname);
}
//# sourceMappingURL=bin.js.map