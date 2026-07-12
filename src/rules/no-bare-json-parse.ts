// src/rules/no-bare-json-parse.ts
//
// Power-of-10 Rule 5 (trust boundary / crash containment): flags
// `JSON.parse(...)` calls that are not lexically guarded by an enclosing
// `try` block. An uncaught `SyntaxError` from a malformed parse crashes the
// boundary it runs in. Deliberately conservative (v1, syntactic only): the
// deep-clone idiom `JSON.parse(JSON.stringify(x))` and parsing a
// compile-time string literal are never flagged, since neither can throw on
// an attacker-controlled input — flagging them would only inflate the
// false-positive rate without catching a real trust-boundary bug.
import { AST_NODE_TYPES, ESLintUtils } from "@typescript-eslint/utils";
import type { TSESTree } from "@typescript-eslint/utils";

const createRule = ESLintUtils.RuleCreator(
    (name) =>
        `https://github.com/btrmnt/eslint-plugin-flightcode/blob/main/docs/rules/${name}.md`,
);

type MessageIds = "bareJsonParse";

/**
 * Check whether a `CallExpression` node's callee is `JSON.parse` — a
 * non-computed `MemberExpression` with object identifier `JSON` and property
 * identifier `parse`.
 *
 * @param node - The candidate call expression.
 * @returns True if the call is `JSON.parse(...)`.
 */
function isJsonParseCall(node: TSESTree.CallExpression): boolean {
    const { callee } = node;
    return (
        callee.type === AST_NODE_TYPES.MemberExpression &&
        !callee.computed &&
        callee.object.type === AST_NODE_TYPES.Identifier &&
        callee.object.name === "JSON" &&
        callee.property.type === AST_NODE_TYPES.Identifier &&
        callee.property.name === "parse"
    );
}

/**
 * Check whether a `JSON.parse` call's sole argument is one of the two safe
 * idioms this rule never flags: a `JSON.stringify(...)` call (the
 * deep-clone idiom, which never throws on its own output) or a string
 * literal (a compile-time-known constant).
 *
 * @param node - The `JSON.parse` call expression.
 * @returns True if the argument is a recognized safe idiom.
 */
function hasSafeArgument(node: TSESTree.CallExpression): boolean {
    const [arg] = node.arguments;
    if (arg === undefined) {
        return false;
    }
    if (arg.type === AST_NODE_TYPES.Literal && typeof arg.value === "string") {
        return true;
    }
    return (
        arg.type === AST_NODE_TYPES.CallExpression &&
        arg.callee.type === AST_NODE_TYPES.MemberExpression &&
        !arg.callee.computed &&
        arg.callee.object.type === AST_NODE_TYPES.Identifier &&
        arg.callee.object.name === "JSON" &&
        arg.callee.property.type === AST_NODE_TYPES.Identifier &&
        arg.callee.property.name === "stringify"
    );
}

/**
 * Walk a node's ancestors (via the source code's node-parent chain) up to
 * the nearest enclosing function boundary, checking whether any ancestor
 * `TryStatement`'s `block` contains the node — i.e. whether the node is
 * lexically guarded by a `try` block.
 *
 * @param node - The node to check (the `JSON.parse` call expression).
 * @returns True if the node is inside a `TryStatement`'s `block`.
 */
function isInsideTryBlock(node: TSESTree.Node): boolean {
    let current: TSESTree.Node | null | undefined = node.parent;
    let previous: TSESTree.Node = node;
    while (current !== null && current !== undefined) {
        if (
            current.type === AST_NODE_TYPES.TryStatement &&
            current.block === previous
        ) {
            return true;
        }
        if (
            current.type === AST_NODE_TYPES.FunctionDeclaration ||
            current.type === AST_NODE_TYPES.FunctionExpression ||
            current.type === AST_NODE_TYPES.ArrowFunctionExpression
        ) {
            return false;
        }
        previous = current;
        current = current.parent;
    }
    return false;
}

export const noBareJsonParse = createRule<[], MessageIds>({
    name: "no-bare-json-parse",
    meta: {
        type: "problem",
        docs: {
            description:
                "Require JSON.parse on untrusted input to be guarded by a try/catch (Power-of-10 Rule 5).",
        },
        messages: {
            bareJsonParse:
                "JSON.parse on untrusted input must be guarded: wrap it in try/catch (or parse a known-safe literal / JSON.stringify output). Unhandled parse errors crash the boundary (Power-of-10 Rule 5).",
        },
        schema: [],
    },
    defaultOptions: [],
    create(context) {
        return {
            CallExpression(node) {
                if (!isJsonParseCall(node)) {
                    return;
                }
                if (hasSafeArgument(node)) {
                    return;
                }
                if (isInsideTryBlock(node)) {
                    return;
                }
                context.report({ node, messageId: "bareJsonParse" });
            },
        };
    },
});
