var { minify } = require("terser");
var fs = require('fs');
var path = require('path');

class InlineRawSourcePlugin {
    constructor(options) {
        this.options = options || {};
        this.filename = this.options.filename || 'inline-script.html';
        this.chunkname = this.options.chunkname || [];
        this.path = this.options.path || null;
        this.result = ""
    }
    apply(compiler) {
        // 源碼進行壓縮
        compiler.hooks.compilation.tap("inlineRawSourcePlugin", compilation => {
            compilation.hooks.chunkAsset.tap("inlineRawSourcePlugin", chunk => {
                if (this.chunkname.indexOf(chunk.name) > -1) {
                    let result = minify(chunk.entryModule._source._value).code
                    this.result += `<script>${result}</script>`
                }
            });
        });

        // 產生我們要的 html 檔
        compiler.hooks.emit.tapAsync('inlineRawSourcePlugin', (compilation, cb) => {
            const fileListName = this.filename;
            const result = this.result;
            compilation.assets[fileListName] = {
                source: function () {
                    return result;
                },
                size: function () {
                    return result.length;
                }
            }
            
            cb();
        });

        // 刪除不必要的 output 檔案
        compiler.hooks.done.tap('inlineRawSourcePlugin', stats => {
            if (compiler.outputFileSystem.constructor.name !== "NodeOutputFileSystem") {
                return;
            }
            const assets = stats.toJson().assets.map(asset => asset.name);
            const matchFiles = this.chunkname.map(chunkname => {
                const filename = assets.find(asset => asset.includes(chunkname))
                const regExp = /.*\.js/;
                return filename.match(regExp)[0]
            })
            matchFiles.forEach(matchFile => {
                fs.unlinkSync(path.join(path.dirname(module.parent.filename), `${stats.compilation.outputOptions.publicPath}/${matchFile}`))
            });

            if (this.path) {
                fs.rename(
                    path.join(path.dirname(module.parent.filename), `${stats.compilation.outputOptions.publicPath}/${this.filename}`), 
                    `${this.path}/${this.filename}`, function (err) {
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