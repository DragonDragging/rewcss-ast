function walk(ast, plugins = []) {
    const visitors = plugins.map(p => p());
    function createPath(node, parent, container, index) {
        let removed = false;

        return {
            node,
            parent,
            remove() {
                if (!container) {
                    return;
                }
                container.splice(index, 1);
                removed = true;
            },
            replace(newNode) {
                if (!container) {
                    return;
                }
                container[index] = newNode;
                this.node = newNode;
            },
            setProp(v) {
                if (node.type === "decl") {
                    node.prop = v;
                }
            },
            setValue(v) {
                if (node.type === "decl") {
                    node.value = v;
                }
            },
            isDecl(name) {
                return node.type === "decl" && (!name || node.prop === name);
            },
            isRule(sel) {
                return node.type === "rule" && (!sel || node.selector === sel);
            },
            isAtRule(name) {
                return node.type === "atrule" && (!name || node.name === name);
            },
            removed: () => removed
        };
    }

    function visit(node, parent, container, index) {
        const path = createPath(node, parent, container, index);

        for (let i = 0; i < visitors.length; i++) {
            const v = visitors[i];
            const fn = v[node.type];
            if (fn && fn.enter) {
                fn.enter(path);
            }
        }

        if (path.removed()) {
            return;
        }

        if (node.nodes && node.nodes.length) {
            const list = node.nodes;
            for (let i = 0; i < list.length;) {
                const child = list[i];
                visit(child, node, list, i);

                if (list[i] === child) {
                    i++;
                }
            }
        }

        for (let i = 0; i < visitors.length; i++) {
            const v = visitors[i];
            const fn = v[node.type];
            if (fn && fn.exit) {
                fn.exit(path);
            }
        }
    }

    visit(ast, null, null, null);
}

module.exports = { walk };