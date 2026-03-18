# CSS AST Parser
Fast and lightweight CSS parser with AST transformations and plugin system.  
Built for high performance and large stylesheets.  
**~360ms vs PostCSS ~1701ms**


## Features
- High performance parsing
- AST transformations
- Plugin system (PostCSS-like)
- Safe node mutation
- Single-line minified output
- Legacy browser support
- Zero dependencies


## Installation
```bash
npm install rewcss-ast

## Installation

You can install the package from npm:

```bash
npm install rewcss-ast
```
Or clone the repository for development:
```bash
git clone https://github.com/DragonDragging/rewcss-ast.git
cd rewcss-ast
```

## Usage
```js
const fs = require("fs");
const { parse, generate, walk } = require("rewcss-ast");

// Example plugin
const plugins = [
  () => ({
    decl(node) {
      if (node.prop === "background-color") {
        node.remove();
      }
    },
    rule(node) {
      console.log("Rule:", node.selector);
    }
  })
];

const css = fs.readFileSync("./input.css", "utf-8");

const ast = parse(css, { legacySupport: true, comments: false });
walk(ast, plugins);

const out = generate(ast);
fs.writeFileSync("./output.css", out);
```



## How It Works
The processing pipeline:
CSS -> parse() -> AST -> walk() -> generate() -> CSS
parse -> converts CSS into AST (optionally applies legacy browser prefixes and removing comments)
walk -> applies plugins and mutates AST
generate -> converts AST back to CSS



## AST Structure
"nodes" - array of child declarations or rules, may include legacy prefixed versions

Example node:
```json
{
  "type": "decl",
  "prop": "color",
  "value": "red"
}
```

Node types:
rule - selector block
decl - declaration
atrule - @rules
comment - comments



## Plugins
Plugins return visitors.

### Example: remove background-color
```js
module.exports = function () {
    return {
        decl: {
            enter(path) {
                if (path.isDecl("background-color")) {
                    path.remove();
                }
            }
        }
    };
};
```

### Path API
path.remove() — remove node
path.replace(node) — replace node
path.setProp(v) — change property
path.setValue(v) — change value

Helpers:
path.isDecl(name)
path.isRule(selector)
path.isAtRule(name)



## Transformation Pipeline
1. Read CSS
2. Parse AST (optionally apply legacy support and removing comments)
3. Apply plugins
4. Generate optimized CSS

## Performance
This project is optimized for speed and low memory usage.
Key points:
fast loops (no forEach/map)
array join instead of string concat
minimal allocations
safe mutation traversal
Designed to handle large CSS files efficiently.

## Author
DragonDragging

## Contact
If you find any bugs, please contact me on Discord with a detailed explanation: @dragondragging