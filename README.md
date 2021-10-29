[![npm][npm]][npm-url]
[![node][node]][node-url]

<div align="center">
  <h1>Inline Raw Source Plugin</h1>
  <!-- <p></p> -->
</div>

<h2 align="center">Install</h2>

```bash
  npm i --save-dev inline-raw-source-plugin
```

```bash
  yarn add --dev inline-raw-source-plugin
```

<h2 align="center">Usage</h2>

The plugin will generate a file that you set the entries in your webpack config.
The current state just allows to generate `html` or `cshtml` file with using `script` tags. 
Just add the plugin to your `webpack`
config as follows:

**webpack.config.js**
```js
const InlineRawSourcePlugin = require('inline-raw-source-plugin')
module.exports = {
  entry: {
      main: 'index.js',
      inlineScript: 'inlineScript.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js'
  },
  plugins: [
    new InlineRawSourcePlugin({
        chunkname: ["inlineScript"]
    })
  ]
}
```

This will generate a file `dist/inline-source.html`(default) containing the following

```html
<script>{{your code}}</script>
```

⚠️ **The file you want to generate is only allowed to write as `ES5`(without `babel`).**

<h2 align="center">Options</h2>

Allowed values are as follows:

|Name|Type|Default|Description|
|:--:|:--:|:-----:|:----------|
|**`chunkname`**|`{Array.<string>}`|`[]`|You have to specify the values as same as your entries when you need the entry chunk to generate a html file. |
|**`filename`**|`{String}`|`'inline-source.html'`|The final file name for the generated HTML document|
|**`path`**|`{string}`|`null`| If you set this option, you can change the output path that you set in webpack output config. |

Here's an example webpack config illustrating how to use these options

**webpack.config.js**
```js
{
  entry: {
      main: 'index.js',
      inlineScript: 'inlineScript.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js'
  },
  plugins: [
    new InlineRawSourcePlugin({
        chunkname: ["inlineScript"],
        filename: "output.html",
        path: path.resolve(__dirname, 'otherFolder'),
    })
  ]
}
```