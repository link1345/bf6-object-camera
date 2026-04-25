import fs from "fs";
import path from "path";

/**
 * ディレクトリを再帰的に探索し、.ts/.js ファイルをすべて収集する
 * @param {string} dir
 * @returns {string[]} ファイルパス一覧
 */
function getAllScriptFiles(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const files = [];

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...getAllScriptFiles(fullPath));
        } else if (
            entry.isFile() &&
            (fullPath.endsWith(".ts")) &&
            !fullPath.endsWith(".d.ts") // 型定義ファイルは除外
        ) {
            files.push(fullPath);
        }
    }

    return files;
}

/**
 * 複数の .ts/.js ファイルを1つにまとめる（importを統一）
 * @param {string} inputDir 探索フォルダ
 * @param {string} outputFile 出力ファイル
 */
async function mergeTSRecursive(inputDir, outputFile) {
    const files = getAllScriptFiles(inputDir);
    let body = "";

    for (const file of files) {
        const content = fs.readFileSync(file, "utf-8");

        const bodyPart = content
            .replace(/^import .*?;$/gm, "")
            .trim()
            .replace(/\n{3,}/g, "\n\n"); // 空行を整理

        body += `\n// ---- ${path.relative(inputDir, file)} ----\n${bodyPart}\n`;
    }

    const result = `import * as modlib from \"modlib";\n` +
        "\n// ===============================\n" +
        "// Combined TS/JS Contents\n" +
        "// ===============================\n" +
        body;

    fs.mkdirSync(path.dirname(outputFile), { recursive: true });
    fs.writeFileSync(outputFile, result, "utf-8");

    console.log(
        `✅ ${files.length} files merged successfully into:\n   ${outputFile}`
    );
}

// 使用例
mergeTSRecursive("./mods", "./dist/Script.ts");
