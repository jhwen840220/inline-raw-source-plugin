const { minify } = require("terser");
const fs = require('fs');
const path = require('path');

class InlineRawSourcePlugin {
    constructor(options) {
        this.options = options || {};
        this.filename = this.options.filename || 'inline-source.html';
        this.chunkname = [...this.options.chunkname] || [];
        this.path = this.options.path || null;

        this.notFoundChunkName = [...this.options.chunkname] || [];
        this.result = ""
        this.hintMsg = "\"inline-raw-source-plugin\"\r\n";
    }
    apply(compiler) {
        // 源碼進行壓縮
        compiler.hooks.compilation.tap("inlineRawSourcePlugin", compilation => {
            compilation.hooks.chunkAsset.tap("inlineRawSourcePlugin", chunk => {
                const chunkIndex = this.chunkname.indexOf(chunk.name);
                if (chunkIndex > -1) {
                    let result = minify(chunk.entryModule._source._value).code
                    this.result += `<script>${result}</script>`
                    this.notFoundChunkName.splice(chunkIndex, 1)
                }
            });
        });

        // 印出找不到的 chunkname
        compiler.hooks.afterCompile.tapAsync('inlineRawSourcePlugin', (compilation, cb) => {
            this.notFoundChunkName.length && compilation.warnings.push(`${this.hintMsg}找不到指定的 chunkname: [${this.notFoundChunkName.join(", ")}]`);

            cb();
        });

        // 產生我們要的 html 檔
        compiler.hooks.emit.tapAsync('inlineRawSourcePlugin', (compilation, cb) => {
            const fileListName = this.filename;
            const result = this.result;
            if (result.length) {
                compilation.assets[fileListName] = {
                    source: function () {
                        return result;
                    },
                    size: function () {
                        return result.length;
                    }
                }
            } else {
                compilation.warnings.push(`${this.hintMsg}並未產生任何 inline-source 代碼，因此無法產出 ${fileListName}`);
            }
            cb();
        });

        // 刪除不必要的 output 檔案
        compiler.hooks.done.tap('inlineRawSourcePlugin', stats => {
            if (compiler.outputFileSystem.constructor.name !== "NodeOutputFileSystem") {
                return;
            }
            const assets = stats.toJson().assets.map(asset => asset.name);

            const matchFiles = this.chunkname.reduce((result, chunkname) => {
                const filename = assets.find(asset => asset.includes(chunkname))
                const regExp = /.*\.js/;
                filename && regExp.test(filename) && result.push(filename.match(regExp)[0])
                return result
            }, [])

            if (!matchFiles.length) return;
            
            matchFiles.forEach(matchFile => {
                fs.unlinkSync(path.join(stats.compilation.outputOptions.path, matchFile))
            });

            if (this.path) {
                fs.rename(
                    path.join(stats.compilation.outputOptions.path, this.filename), 
                    path.join(this.path, this.filename), err => {
                        if (err) {
                            throw err;
                        }
                    }
                )
            }
        })
    }
}
module.exports = InlineRawSourcePlugin;