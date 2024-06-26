﻿import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

try {

    /**
     * Script to run after npm install
     *
     * Copy selected files to user's directory
     */
    const script_prefix= 'slight-capture';

    const copyFile = async (src, dest, overwrite) => {
        if(!fileExists(src)) {
            console.log(`[${script_prefix}:skip] file does not exist ${src}`);
            return false;
        }
        if (!overwrite) {
            if (fileExists(dest)) {
                console.log(`[${script_prefix}:skip] file exists not overwriting ${dest}`);
                return true;
            }
        }
        await fs.promises.copyFile(src, dest);
        console.log(`[${script_prefix}:copy] ${dest}`);
        return false
    };

    const fileExists = (path) => {
        return !!fs.existsSync(path);
    };

    const initPath = process.cwd();
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const srcDir = path.join(__dirname, "..", "public");
    const destinationFolder = process.argv.length >= 3 ? process.argv[2] : 'public';
    const destinationDir = path.join(initPath, destinationFolder);

    const files = [
        {
            fileName: 'opencv.js',
            overwrite: true,
        },
    ];

    for await (const file of files) {
        await copyFile(
            path.join(srcDir, file.fileName),
            path.join(destinationDir, file.fileName),
            file.overwrite
        );
    }

} catch (err) {
    console.warn(err);
}