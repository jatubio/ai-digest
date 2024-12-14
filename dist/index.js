#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const glob_1 = require("glob");
const ignore_1 = __importDefault(require("ignore"));
const utils_1 = require("./utils");
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
async function readIgnoreFile(inputDir, filename) {
    try {
        const filePath = path_1.default.join(inputDir, filename);
        const content = await fs_1.promises.readFile(filePath, 'utf-8');
        console.log((0, utils_1.formatLog)(`Found ${filename} file in ${inputDir}.`, '📄'));
        return content.split('\n').filter(line => line.trim() !== '' && !line.startsWith('#'));
    }
    catch (error) {
        if (error.code === 'ENOENT') {
            console.log((0, utils_1.formatLog)(`No ${filename} file found in ${inputDir}.`, '❓'));
            return [];
        }
        throw error;
    }
}
function displayIncludedFiles(includedFiles) {
    console.log((0, utils_1.formatLog)('Files included in the output:', '📋'));
    includedFiles.forEach((file, index) => {
        console.log(`${index + 1}. ${file}`);
    });
}
function naturalSort(a, b) {
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}
async function aggregateFiles(inputDir, outputFile, useDefaultIgnores, removeWhitespaceFlag, showOutputFiles, ignoreFile) {
    try {
        const userIgnorePatterns = await readIgnoreFile(inputDir, ignoreFile);
        const defaultIgnore = useDefaultIgnores ? (0, ignore_1.default)().add(utils_1.DEFAULT_IGNORES) : (0, ignore_1.default)();
        const customIgnore = (0, utils_1.createIgnoreFilter)(userIgnorePatterns, ignoreFile);
        if (useDefaultIgnores) {
            console.log((0, utils_1.formatLog)('Using default ignore patterns.', '🚫'));
        }
        else {
            console.log((0, utils_1.formatLog)('Default ignore patterns disabled.', '✅'));
        }
        if (removeWhitespaceFlag) {
            console.log((0, utils_1.formatLog)('Whitespace removal enabled (except for whitespace-dependent languages).', '🧹'));
        }
        else {
            console.log((0, utils_1.formatLog)('Whitespace removal disabled.', '📝'));
        }
        const allFiles = await (0, glob_1.glob)('**/*', {
            nodir: true,
            dot: true,
            cwd: inputDir,
        });
        console.log((0, utils_1.formatLog)(`Found ${allFiles.length} files in ${inputDir}. Applying filters...`, '🔍'));
        let output = '';
        let includedCount = 0;
        let defaultIgnoredCount = 0;
        let customIgnoredCount = 0;
        let binaryAndSvgFileCount = 0;
        let includedFiles = [];
        // Sort the files in natural path order
        const sortedFiles = allFiles.sort(naturalSort);
        for (const file of sortedFiles) {
            const fullPath = path_1.default.join(inputDir, file);
            const relativePath = path_1.default.relative(inputDir, fullPath);
            if (path_1.default.relative(inputDir, outputFile) === relativePath || (useDefaultIgnores && defaultIgnore.ignores(relativePath))) {
                defaultIgnoredCount++;
            }
            else if (customIgnore.ignores(relativePath)) {
                customIgnoredCount++;
            }
            else {
                try {
                    if (await (0, utils_1.isTextFile)(fullPath) && !(0, utils_1.shouldTreatAsBinary)(fullPath)) {
                        let content = await fs_1.promises.readFile(fullPath, 'utf-8');
                        // Detect and handle null bytes
                        if (content.includes('\u0000')) {
                            console.warn((0, utils_1.formatLog)(`Warning: File ${relativePath} contains null bytes.`, '⚠️'));
                            content = content.replace(/\u0000/g, ''); // Remove null bytes
                        }
                        // Escape and process the content
                        content = (0, utils_1.escapeTripleBackticks)(content);
                        const extension = path_1.default.extname(file);
                        if (removeWhitespaceFlag && !utils_1.WHITESPACE_DEPENDENT_EXTENSIONS.includes(extension)) {
                            content = (0, utils_1.removeWhitespace)(content);
                        }
                        output += `# ${relativePath}\n\n`;
                        output += `\`\`\`${extension.slice(1)}\n`;
                        output += content;
                        output += '\n\`\`\`\n\n';
                        includedCount++;
                        includedFiles.push(relativePath);
                    }
                    else {
                        const fileType = (0, utils_1.getFileType)(fullPath);
                        output += `# ${relativePath}\n\n`;
                        if (fileType === 'SVG Image') {
                            output += `This is a file of the type: ${fileType}\n\n`;
                        }
                        else {
                            output += `This is a binary file of the type: ${fileType}\n\n`;
                        }
                        binaryAndSvgFileCount++;
                        includedCount++;
                        includedFiles.push(relativePath);
                    }
                }
                catch (error) {
                    if (error instanceof Error) {
                        console.warn((0, utils_1.formatLog)(`Error processing file ${relativePath}: ${error.message}`, '❌'));
                    }
                    else {
                        console.warn((0, utils_1.formatLog)(`Error processing file ${relativePath}: Unknown error`, '❌'));
                    }
                }
            }
        }
        await fs_1.promises.mkdir(path_1.default.dirname(outputFile), { recursive: true });
        await fs_1.promises.writeFile(outputFile, output, { flag: 'w', encoding: 'utf8' });
        const stats = await fs_1.promises.stat(outputFile);
        const fileSizeInBytes = stats.size;
        console.log((0, utils_1.formatLog)(`Files aggregated successfully into ${outputFile}`, '✅'));
        console.log((0, utils_1.formatLog)(`Total files found: ${allFiles.length}`, '📚'));
        console.log((0, utils_1.formatLog)(`Files included in output: ${includedCount}`, '📎'));
        if (useDefaultIgnores) {
            console.log((0, utils_1.formatLog)(`Files ignored by default patterns: ${defaultIgnoredCount}`, '🚫'));
        }
        if (customIgnoredCount > 0) {
            console.log((0, utils_1.formatLog)(`Files ignored by .aidigestignore: ${customIgnoredCount}`, '🚫'));
        }
        console.log((0, utils_1.formatLog)(`Binary and SVG files included: ${binaryAndSvgFileCount}`, '📦'));
        if (fileSizeInBytes > MAX_FILE_SIZE) {
            console.log((0, utils_1.formatLog)(`Warning: Output file size (${(fileSizeInBytes / 1024 / 1024).toFixed(2)} MB) exceeds 10 MB.`, '⚠️'));
        }
        else {
            const tokenCount = (0, utils_1.estimateTokenCount)(output);
            console.log((0, utils_1.formatLog)(`Estimated token count: ${tokenCount}`, '🔢'));
        }
        if (showOutputFiles) {
            displayIncludedFiles(includedFiles);
        }
        console.log((0, utils_1.formatLog)(`Done! Wrote code base to ${outputFile}`, '✅'));
    }
    catch (error) {
        console.error((0, utils_1.formatLog)('Error aggregating files:', '❌'), error);
        process.exit(1);
    }
}
commander_1.program
    .version('1.0.0')
    .description('Aggregate files into a single Markdown file')
    .option('-i, --input <directory>', 'Input directory', process.cwd())
    .option('-o, --output <file>', 'Output file name', 'codebase.md')
    .option('--no-default-ignores', 'Disable default ignore patterns')
    .option('--whitespace-removal', 'Enable whitespace removal')
    .option('--show-output-files', 'Display a list of files included in the output')
    .option('--ignore-file <file>', 'Custom ignore file name', '.aidigestignore')
    .action(async (options) => {
    const inputDir = path_1.default.resolve(options.input);
    const outputFile = path_1.default.isAbsolute(options.output) ? options.output : path_1.default.join(process.cwd(), options.output);
    await aggregateFiles(inputDir, outputFile, options.defaultIgnores, options.whitespaceRemoval, options.showOutputFiles, options.ignoreFile);
});
commander_1.program.parse(process.argv);
