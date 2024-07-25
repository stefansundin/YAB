import babelParser from '@babel/parser';
import appendJsExtension from './appendJsExtension.js';
export const transformFile = async (sourceCode, sourceFileMetaData, options) => {
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
//# sourceMappingURL=transformFile.js.map