function generate(ast) {
    // Buffer faster than string concatenation
    const output = [];
    function processNodes(nodes) {
        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];

            if (node.type === "comment") {
                output.push(node.raw.replace(/\s+/g, " "));
            }

            // CSS RULE (e.g. .class { ... })
            else if (node.type === "rule") {
                output.push(node.selectors.join(","), "{");
                const declarations = node.nodes;
                if (declarations) {
                    for (let j = 0; j < declarations.length; j++) {
                        const child = declarations[j];
                        if (child.type === "comment") {
                            output.push(child.raw.replace(/\s+/g, " "));
                        }
                        else if (child.type === "decl") {
                            output.push(child.prop, ":", child.value, ";");
                        }
                        else {
                            processNodes([child]);
                        }
                    }
                }
                output.push("}");
            }

            // At-rule (e.g. @media, @import, @keyframes)
            else if (node.type === "atrule") {
                if (node.raw && !node.nodes) {
                    output.push(node.raw.replace(/\s+/g, " "));
                    continue;
                }
                output.push("@", node.name);

                if (node.query) {
                    output.push(" ", node.query);
                }

                if (!node.nodes) {
                    output.push(";");
                    continue;
                }

                output.push("{");
                const children = node.nodes;
                for (let j = 0; j < children.length; j++) {
                    const child = children[j];
                    if (child.type === "comment") {
                        output.push(child.raw.replace(/\s+/g, " "));
                    } else if (child.type === "decl") {
                        output.push(child.prop, ":", child.value, ";");
                    } else {
                        processNodes([child]);
                    }
                }
                output.push("}");
            }
        }
    }
    processNodes(ast.nodes);

    return output.join("");
}

module.exports = { generate };