const { minify } = require("terser");
const path = require('path');
const { relative } = path;

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
        if (this.path) this.getRelativeAssetPath(compiler);
        
        // 源碼進行壓縮
        compiler.hooks.compilation.tap("inlineRawSourcePlugin", compilation => {
            compilation.hooks.chunkAsset.tap("inlineRawSourcePlugin", chunk => {
                const chunkIndex = this.chunkname.indexOf(chunk.name);
                if (chunkIndex > -1) {
                    minify(chunk.entryModule._source._value)
                        .then(res => {
                            this.result += `<script>${res.code}</script>`
                            this.notFoundChunkName.splice(chunkIndex, 1)
                        })
                }
            });
        });

        // 印出找不到的 chunkname
        compiler.hooks.afterCompile.tapAsync('inlineRawSourcePlugin', (compilation, cb) => {
            this.notFoundChunkName.length && compilation.warnings.push(`${this.hintMsg}找不到指定的 chunkname: [${this.notFoundChunkName.join(", ")}]`);

            cb();
        });

        compiler.hooks.emit.tap('inlineRawSourcePlugin', compilation => {
            // 產生我們要的 html 檔
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
            // 刪除不必要的 output 檔案
            const matchFiles = this.chunkname.reduce((result, chunkname) => {
                const filename = Object.keys(compilation.assets).find(asset => asset.includes(chunkname))
                if (filename) result.push(filename)
                return result
            }, [])

            if (matchFiles.length) {
                matchFiles.forEach(matchFile => {
                    delete compilation.assets[matchFile]
                });
            }
        });
    }

    getRelativeAssetPath(compiler) {
        const outputPath = compiler.options.output.path;
        this.filename = `${relative(outputPath, this.path)}/${this.filename}`;
    }
}
module.exports = InlineRawSourcePlugin;