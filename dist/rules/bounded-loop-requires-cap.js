// src/rules/bounded-loop-requires-cap.ts
//
// Power-of-10 Rule 2 (bounded loops): flags loop forms that are only
// unbounded BY CONSTRUCTION — `while(true)`, `do/while(true)`, and `for(;;)`
// — unless the loop body contains an explicit cap guard: either a numeric
// counter-cap (an `if` comparing a counter against a numeric literal/const
// whose consequent breaks or throws) or a wall-clock deadline-poll guard (an
// `if` comparing `Date.now()`/`performance.now()` against a variable whose
// consequent breaks or throws — a timeout IS a cap). Deliberately
// conservative: ambiguous forms (`while(cond)` with a non-constant test,
// plain `for`/`for-of`/`for-in` with a test) are left unflagged to keep the
// false-positive rate near zero (see docs/rules).
//
// `for await (…of…)` is deliberately NOT flagged in v1: a syntactic rule
// can't distinguish a bounded stream (e.g. stdin EOF) from an unbounded
// pager without type info, which is too false-positive-prone for an `error`
// rule. Pager-boundedness is deferred to a future typed rule (same bucket as
// `no-unguarded-db-write`).
import { AST_NODE_TYPES, ESLintUtils } from "@typescript-eslint/utils";
const createRule = ESLintUtils.RuleCreator((name) => `https://github.com/btrmnt/eslint-plugin-flightcode/blob/main/docs/rules/${name}.md`);
const CAP_OPERATORS = new Set([">", ">=", "<", "<="]);
/**
 * Determine whether a `while`/`do-while` test is a truthy constant literal
 * (`true` or a nonzero numeric literal such as `1`), the only forms this
 * rule treats as "constructed unbounded".
 *
 * @param test - The loop's test expression node.
 * @returns True if the test is a truthy constant literal.
 */
function isTruthyConstantTest(test) {
    if (test.type !== AST_NODE_TYPES.Literal) {
        return false;
    }
    if (typeof test.value === "boolean") {
        return test.value === true;
    }
    if (typeof test.value === "number") {
        return test.value !== 0;
    }
    return false;
}
/**
 * Determine whether an identifier resolves (via the current scope chain) to
 * a `const` binding initialized with a numeric literal — the "or a
 * `const`-bound numeric" half of the cap-guard contract.
 *
 * @param scope - The scope to search, walking up through `scope.upper`.
 * @param name - The identifier name to resolve.
 * @returns True if the identifier is a const numeric binding.
 */
function isConstNumericBinding(scope, name) {
    for (let current = scope; current !== null; current = current.upper) {
        const variable = current.set.get(name);
        if (variable === undefined) {
            continue;
        }
        return variable.defs.some((def) => {
            const decl = def.parent;
            return (decl?.type === AST_NODE_TYPES.VariableDeclaration &&
                decl.kind === "const" &&
                def.node.type === AST_NODE_TYPES.VariableDeclarator &&
                def.node.init?.type === AST_NODE_TYPES.Literal &&
                typeof def.node.init.value === "number");
        });
    }
    return false;
}
/**
 * Check whether one side of a binary comparison is a numeric bound: a
 * numeric literal, or an identifier resolving to a `const` numeric binding.
 *
 * @param side - The operand expression to check.
 * @param scope - The scope to resolve identifier operands against.
 * @returns True if the operand is a numeric bound.
 */
function isNumericBoundOperand(side, scope) {
    if (side.type === AST_NODE_TYPES.Literal) {
        return typeof side.value === "number";
    }
    if (side.type === AST_NODE_TYPES.Identifier) {
        return isConstNumericBinding(scope, side.name);
    }
    return false;
}
/**
 * Check whether a binary test resolves to a numeric-bound comparison
 * (`identifier <op> numericLiteral-or-const` in either operand order), the
 * shape a counter-cap guard's `if` condition must have.
 *
 * @param test - The candidate `IfStatement` test expression.
 * @param scope - The scope to resolve identifier operands against.
 * @returns True if the test is a numeric-bound comparison with a cap
 *   operator.
 */
function isNumericCapComparison(test, scope) {
    if (test.type !== AST_NODE_TYPES.BinaryExpression) {
        return false;
    }
    if (!CAP_OPERATORS.has(test.operator)) {
        return false;
    }
    return (isNumericBoundOperand(test.left, scope) ||
        isNumericBoundOperand(test.right, scope));
}
/**
 * Check whether an `IfStatement`'s consequent is (or contains, as a direct
 * block statement) a `break` or `throw` — the escape shape a counter-cap
 * guard must have.
 *
 * @param consequent - The `if` statement's consequent node.
 * @returns True if the consequent breaks or throws.
 */
function consequentBreaksOrThrows(consequent) {
    if (consequent.type === AST_NODE_TYPES.BreakStatement ||
        consequent.type === AST_NODE_TYPES.ThrowStatement) {
        return true;
    }
    if (consequent.type === AST_NODE_TYPES.BlockStatement) {
        return consequent.body.some((stmt) => stmt.type === AST_NODE_TYPES.BreakStatement ||
            stmt.type === AST_NODE_TYPES.ThrowStatement);
    }
    return false;
}
const DEADLINE_CALL_NAMES = new Set(["now"]);
const DEADLINE_OBJECT_NAMES = new Set(["Date", "performance"]);
/**
 * Check whether an expression is a direct wall-clock deadline read: a call
 * to `Date.now()` or `performance.now()`.
 *
 * @param side - The operand expression to check.
 * @returns True if the operand is a `Date.now()`/`performance.now()` call.
 */
function isDirectDeadlineCall(side) {
    if (side.type !== AST_NODE_TYPES.CallExpression) {
        return false;
    }
    const { callee } = side;
    return (callee.type === AST_NODE_TYPES.MemberExpression &&
        callee.object.type === AST_NODE_TYPES.Identifier &&
        DEADLINE_OBJECT_NAMES.has(callee.object.name) &&
        callee.property.type === AST_NODE_TYPES.Identifier &&
        DEADLINE_CALL_NAMES.has(callee.property.name));
}
/**
 * Check whether an expression is a wall-clock deadline read: a direct call
 * to `Date.now()`/`performance.now()`, or an elapsed-time subtraction
 * (`Date.now() - start`) involving one.
 *
 * @param side - The operand expression to check.
 * @returns True if the operand reads or derives from a deadline call.
 */
function isDeadlineCall(side) {
    if (side.type === AST_NODE_TYPES.CallExpression) {
        return isDirectDeadlineCall(side);
    }
    if (side.type === AST_NODE_TYPES.BinaryExpression &&
        side.operator === "-") {
        return (isDirectDeadlineCall(side.left) || isDirectDeadlineCall(side.right));
    }
    return false;
}
/**
 * Check whether a binary test resolves to a wall-clock deadline-poll guard
 * (`Date.now()`/`performance.now()` compared against a variable/expression
 * on either side, with a cap operator) — the shape a deadline-poll guard's
 * `if` condition must have. A timeout is treated as an explicit bound.
 *
 * @param test - The candidate `IfStatement` test expression.
 * @returns True if the test compares a deadline read against an expression.
 */
function isDeadlinePollComparison(test) {
    if (test.type !== AST_NODE_TYPES.BinaryExpression) {
        return false;
    }
    if (!CAP_OPERATORS.has(test.operator)) {
        return false;
    }
    return isDeadlineCall(test.left) || isDeadlineCall(test.right);
}
/**
 * Check whether an `IfStatement`'s consequent is (or contains, as a direct
 * block statement) a `break`, `throw`, or `return` — the escape shape a
 * deadline-poll guard may have (a `return` from the enclosing function exits
 * the loop just as unconditionally as a `break`).
 *
 * @param consequent - The `if` statement's consequent node.
 * @returns True if the consequent breaks, throws, or returns.
 */
function consequentExitsLoop(consequent) {
    if (consequentBreaksOrThrows(consequent)) {
        return true;
    }
    if (consequent.type === AST_NODE_TYPES.ReturnStatement) {
        return true;
    }
    if (consequent.type === AST_NODE_TYPES.BlockStatement) {
        return consequent.body.some((stmt) => stmt.type === AST_NODE_TYPES.ReturnStatement);
    }
    return false;
}
/**
 * Scan a loop body for a syntactic cap guard: an `IfStatement` whose test is
 * either a numeric counter-cap comparison (consequent must break/throw) or a
 * wall-clock deadline-poll comparison (consequent may break/throw/return).
 * Detection is deliberately syntactic and shallow (top-level statements of
 * the body) — bias toward treating an ambiguous body as capped
 * (false-negative) over flagging it (false-positive).
 *
 * @param body - The loop's body statement.
 * @param scope - The scope to resolve identifier operands against.
 * @returns True if a cap guard (counter or deadline-poll) is present.
 */
function hasCounterCapGuard(body, scope) {
    const statements = body.type === AST_NODE_TYPES.BlockStatement ? body.body : [body];
    return statements.some((stmt) => {
        if (stmt.type !== AST_NODE_TYPES.IfStatement) {
            return false;
        }
        if (isNumericCapComparison(stmt.test, scope) &&
            consequentBreaksOrThrows(stmt.consequent)) {
            return true;
        }
        return (isDeadlinePollComparison(stmt.test) &&
            consequentExitsLoop(stmt.consequent));
    });
}
export const boundedLoopRequiresCap = createRule({
    name: "bounded-loop-requires-cap",
    meta: {
        type: "problem",
        docs: {
            description: "Require an explicit numeric iteration cap on loop forms that are unbounded by construction (Power-of-10 Rule 2).",
        },
        messages: {
            unboundedLoop: "Unbounded loop must declare an explicit numeric iteration cap (Power-of-10 Rule 2): add a counter guarded against a constant maximum that breaks or throws.",
        },
        schema: [],
    },
    defaultOptions: [],
    create(context) {
        /**
         * Report the loop node unless its body already carries a
         * counter-cap guard.
         *
         * @param node - The loop node to check and possibly report.
         * @param body - The loop's body statement to scan for a cap guard.
         */
        function checkLoop(node, body) {
            const scope = context.sourceCode.getScope(body);
            if (hasCounterCapGuard(body, scope)) {
                return;
            }
            context.report({ node, messageId: "unboundedLoop" });
        }
        return {
            WhileStatement(node) {
                if (isTruthyConstantTest(node.test)) {
                    checkLoop(node, node.body);
                }
            },
            DoWhileStatement(node) {
                if (isTruthyConstantTest(node.test)) {
                    checkLoop(node, node.body);
                }
            },
            ForStatement(node) {
                if (node.test === null) {
                    checkLoop(node, node.body);
                }
            },
        };
    },
});
