import { defineConfig } from 'vitest/config';
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
    resolve: {
        alias: {
            // "modlib" → プロジェクト内のファイルへ
            modlib: resolve(__dirname, "./code/modlib/index.ts"),
            // もし JS にコンパイル済みなら "./code/modlib.js" にする
        },
    },
    test: {
        environment: 'node',
        include: ["./test/*.test.ts"],
    },
});