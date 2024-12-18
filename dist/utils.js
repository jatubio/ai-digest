"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_IGNORES = exports.WHITESPACE_DEPENDENT_EXTENSIONS = void 0;
exports.removeWhitespace = removeWhitespace;
exports.escapeTripleBackticks = escapeTripleBackticks;
exports.createIgnoreFilter = createIgnoreFilter;
exports.estimateTokenCount = estimateTokenCount;
exports.formatLog = formatLog;
exports.isTextFile = isTextFile;
exports.getFileType = getFileType;
exports.shouldTreatAsBinary = shouldTreatAsBinary;
const ignore_1 = __importDefault(require("ignore")); // Cambia la importación
const isbinaryfile_1 = require("isbinaryfile");
const js_tiktoken_1 = require("js-tiktoken");
const path_1 = __importDefault(require("path"));
exports.WHITESPACE_DEPENDENT_EXTENSIONS = [
    ".py", // Python
    ".yaml", // YAML
    ".yml", // YAML
    ".jade", // Jade/Pug
    ".haml", // Haml
    ".slim", // Slim
    ".coffee", // CoffeeScript
    ".pug", // Pug
    ".styl", // Stylus
    ".gd", // Godot
];
exports.DEFAULT_IGNORES = [
    // Node.js
    "node_modules",
    "package-lock.json",
    "npm-debug.log",
    // Yarn
    "yarn.lock",
    "yarn-error.log",
    // pnpm
    "pnpm-lock.yaml",
    // Bun
    "bun.lockb",
    // Deno
    "deno.lock",
    // PHP (Composer)
    "vendor",
    "composer.lock",
    // Python
    "__pycache__",
    "*.pyc",
    "*.pyo",
    "*.pyd",
    ".Python",
    "pip-log.txt",
    "pip-delete-this-directory.txt",
    ".venv",
    "venv",
    "ENV",
    "env",
    // Godot
    ".godot",
    "*.import",
    // Ruby
    "Gemfile.lock",
    ".bundle",
    // Java
    "target",
    "*.class",
    // Gradle
    ".gradle",
    "build",
    // Maven
    "pom.xml.tag",
    "pom.xml.releaseBackup",
    "pom.xml.versionsBackup",
    "pom.xml.next",
    // .NET
    "bin",
    "obj",
    "*.suo",
    "*.user",
    // Go
    "go.sum",
    // Rust
    "Cargo.lock",
    "target",
    // General
    ".git",
    ".svn",
    ".hg",
    ".DS_Store",
    "Thumbs.db",
    // Environment variables
    ".env",
    ".env.local",
    ".env.development.local",
    ".env.test.local",
    ".env.production.local",
    "*.env",
    "*.env.*",
    // Common framework directories
    ".svelte-kit",
    ".next",
    ".nuxt",
    ".vuepress",
    ".cache",
    "dist",
    "tmp",
    // Our output file
    "codebase.md",
    // Turborepo cache folder
    ".turbo",
    ".vercel",
    ".netlify",
    "LICENSE",
];
function removeWhitespace(val) {
    return val.replace(/\s+/g, " ").trim();
}
function escapeTripleBackticks(content) {
    return content.replace(/\`\`\`/g, "\\`\\`\\`");
}
function createIgnoreFilter(ignorePatterns, ignoreFile) {
    const ig = (0, ignore_1.default)().add(ignorePatterns); // Usa el método `ignore()`
    if (ignorePatterns.length > 0) {
        console.log(`Ignore patterns from ${ignoreFile}:`);
        ignorePatterns.forEach((pattern) => {
            console.log(`  - ${pattern}`);
        });
    }
    else {
        console.log("No custom ignore patterns found.");
    }
    return ig; // Retorna directamente el objeto de la función `ignore()`
}
function estimateTokenCount(text) {
    try {
        const enc = (0, js_tiktoken_1.encodingForModel)("gpt-4o");
        const tokens = enc.encode(text);
        return tokens.length;
    }
    catch (error) {
        console.error(error);
        return 0;
    }
}
function formatLog(message, emoji = "") {
    return `${emoji ? emoji + " " : ""}${message}`;
}
async function isTextFile(filePath) {
    try {
        const isBinary = await (0, isbinaryfile_1.isBinaryFile)(filePath);
        return !isBinary && !filePath.toLowerCase().endsWith('.svg');
    }
    catch (error) {
        console.error(`Error checking if file is binary: ${filePath}`, error);
        return false;
    }
}
function getFileType(filePath) {
    const extension = path_1.default.extname(filePath).toLowerCase();
    switch (extension) {
        case '.jpg':
        case '.jpeg':
        case '.png':
        case '.gif':
        case '.bmp':
        case '.webp':
            return 'Image';
        case '.svg':
            return 'SVG Image';
        case '.wasm':
            return 'WebAssembly';
        case '.pdf':
            return 'PDF';
        case '.doc':
        case '.docx':
            return 'Word Document';
        case '.xls':
        case '.xlsx':
            return 'Excel Spreadsheet';
        case '.ppt':
        case '.pptx':
            return 'PowerPoint Presentation';
        case '.zip':
        case '.rar':
        case '.7z':
            return 'Compressed Archive';
        case '.exe':
            return 'Executable';
        case '.dll':
            return 'Dynamic-link Library';
        case '.so':
            return 'Shared Object';
        case '.dylib':
            return 'Dynamic Library';
        default:
            return 'Binary';
    }
}
function shouldTreatAsBinary(filePath) {
    return filePath.toLowerCase().endsWith('.svg') || getFileType(filePath) !== 'Binary';
}
