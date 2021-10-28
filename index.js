var { minify } = require("terser");
var fs = require('fs');
var path = require('path');

class InlineScriptPlugin {
    constructor(options) {
        this.options = options || {};
        this.filename = this.options.filename || 'inline-script.html';
        this.result = ""
    }
    apply(compiler) {
        // 源碼進行壓縮
        compiler.hooks.compilation.tap("inlineScriptPlugin", compilation => {
            compilation.hooks.chunkAsset.tap("inlineScriptPlugin", chunk => {
                let result = minify(chunk.entryModule._source._value).code
                this.result += `<script>${result}</script>`
            });
        });

        // 產生我們要的 html 檔
        compiler.hooks.emit.tapAsync('inlineScriptPlugin', (compilation, cb) => {
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
        compiler.hooks.done.tap('inlineScriptPlugin', stats => {
            if (compiler.outputFileSystem.constructor.name !== "NodeOutputFileSystem") {
                return;
            }
            const assets = stats.toJson().assets.map(asset => asset.name);
            const matchFiles = assets.reduce((result, asset) => {
                const regExp = /.*\.js/;
                if (regExp.test(asset)) result.push(asset.match(regExp)[0])
                return result
            }, []);
            matchFiles.forEach(matchFile => {
                fs.unlinkSync(path.join(path.dirname(module.parent.filename), `/dist/${matchFile}`))
            });
        })
    }
}
module.exports = InlineScriptPlugin;