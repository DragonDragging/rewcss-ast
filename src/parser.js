function parse(css) {
    let pos = 0;
    const length = css.length;

    // Whitespace char codes
    const WHITESPACE = {
        9: 1,
        10: 1,
        13: 1,
        32: 1
    };

    function skipWhitespace() {
        while (pos < length && WHITESPACE[css.charCodeAt(pos)]) {
            pos++;
        }
    }

    function trim(start, end) {
        let s = start;
        let e = end;

        // left
        while (s < e && WHITESPACE[css.charCodeAt(s)]) {
            s++;
        }
        // right
        while (e > s && WHITESPACE[css.charCodeAt(e - 1)]) {
            e--;
        }
        return {
            value: css.slice(s, e).replace(/\s+/g, " ")
        };
    }

    function readComment() {
        const start = pos;
        pos += 2; // skip /*

        while (pos < length && (css.charCodeAt(pos) !== 42 || css.charCodeAt(pos + 1) !== 47)) {
            pos++;
        }
        pos += 2; // skip */

        return {
            type: "comment",
            raw: css.slice(start, pos)
        };

    }

    function readSelector() {
        const start = pos;
        while (pos < length && css.charCodeAt(pos) !== 123) {
            pos++;
        }
        return trim(start, pos);
    }

    function readProperty() {
        const start = pos;
        while (pos < length) {
            const char = css.charCodeAt(pos);
            if (char === 58 || char === 125) {
                break;
            } // : or }
            pos++;
        }
        return trim(start, pos);
    }

    function readValue() {
        const start = pos;
        let parenthesesDepth = 0;
        while (pos < length) {
            const char = css.charCodeAt(pos);
            if (char === 40) {
                parenthesesDepth++; // (
            } else if (char === 41) {
                parenthesesDepth--;
            } // )

            // Stop at ; or } only if not inside parentheses
            if (parenthesesDepth === 0 && (char === 59 || char === 125)) {
                break;
            }
            pos++;
        }
        return trim(start, pos);
    }

    // Parse declarations inside { ... }
    function parseDecl() {
        const nodes = [];
        while (pos < length) {
            skipWhitespace();
            if (pos >= length) {
                break;
            }
            const char = css.charCodeAt(pos);

            // End of block
            if (char === 125) {
                // }
                pos++;
                break;
            }

            // Comment inside block
            if (char === 47 && css.charCodeAt(pos + 1) === 42) {
                nodes.push(readComment());
                continue;
            }
            const prop = readProperty();

            if (css.charCodeAt(pos) === 125) {
                pos++;
                break;
            }
            pos++; // skip ":"

            const value = readValue();

            // Optional semicolon
            if (css.charCodeAt(pos) === 59) {
                pos++;
            }
            nodes.push({
                type: "decl",
                prop: prop.value,
                value: value.value
            });
        }
        return nodes;
    }

    // contain declarations
    const DECLARATION_AT_RULES = {
        "property": 1,
        "font-face": 1,
        "page": 1
    };

    // Parse rules recursively
    function parseRules() {
        const nodes = [];
        while (pos < length) {
            skipWhitespace();
            if (pos >= length) {
                break;
            }
            const char = css.charCodeAt(pos);

            // End of block
            if (char === 125) {
                pos++;
                break;
            }

            // Comment
            if (char === 47 && css.charCodeAt(pos + 1) === 42) {
                nodes.push(readComment());
                continue;
            }

            // starts with @
            if (char === 64) {
                const start = pos;
                pos++; // skip @

                const nameStart = pos;

                // Read  name
                while (pos < length) {
                    const c = css.charCodeAt(pos);
                    if (WHITESPACE[c] || c === 123 || c === 59) {
                        break;
                    }
                    pos++;
                }
                const name = css.slice(nameStart, pos);
                skipWhitespace();
                const queryStart = pos;

                // Read query/params until { or ;
                while (pos < length) {
                    const c = css.charCodeAt(pos);
                    if (c === 123 || c === 59) {
                        break;
                    }
                    pos++;
                }
                const query = trim(queryStart, pos);

                // @import
                if (css.charCodeAt(pos) === 59) {
                    pos++;
                    nodes.push({
                        type: "atrule",
                        name,
                        query: query.value
                    });
                    continue;
                }
                pos++; // skip {

                // Decide how to parse children
                const children = DECLARATION_AT_RULES[name] ? parseDecl() : parseRules();
                nodes.push({
                    type: "atrule",
                    name,
                    query: query.value,
                    nodes: children
                });
                continue;
            }

            const selector = readSelector();
            pos++; // skip {

            nodes.push({
                type: "rule",
                selectors: selector.value.split(",").map(s => s.trim()),
                nodes: parseDecl()
            });
        }
        return nodes;
    }

    return {
        type: "stylesheet",
        nodes: parseRules()
    };
}

module.exports = { parse };