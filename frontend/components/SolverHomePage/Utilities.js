export default class Utilities {
  static RESERVED_FUNCTIONS = [
    "sin",
    "cos",
    "arcsin",
    "arccos",
    "tan",
    "arctan",
    "cot",
    "arccot",
    "asin",
    "acos",
    "atan",
    "acot",
    "sinh",
    "cosh",
    "tanh",
    "asinh",
    "acosh",
    "atanh",
    "sqrt",
    "pi",
    "log",
    "ln",
    "exp",
    "abs",
    "factorial",
    "E",
    "I",
  ];
  static validateSyntax(formulaString) {
    const RESERVED_FUNCTIONS = Utilities.RESERVED_FUNCTIONS;

    const trimmedFormula = (formulaString || "").trim();
    if (!trimmedFormula) {
      return [false, "formula_string is required"];
    }

    const equalsMatches = trimmedFormula.match(/=/g) || [];
    if (equalsMatches.length !== 1) {
      return [false, "the string must contain exactly one '='"];
    }

    const [lhs, rhs] = trimmedFormula.split("=");
    if (!lhs.trim() || !rhs.trim()) {
      return [false, "both sides of '=' must be non-empty"];
    }

    const patternDigitFollowedByTerm = /(\d)([a-zA-Z_]|\()/;
    const patternParenFollowedByTerm = /([)])(\d|[a-zA-Z_]|\()/;
    const workingFormula = trimmedFormula;
    if (
      patternDigitFollowedByTerm.test(workingFormula) ||
      patternParenFollowedByTerm.test(workingFormula)
    ) {
      return [
        false,
        "the string contains implied multiplication like 3a, 3(a+b): please use explicit (e.g. 3*a)",
      ];
    }

    const patternWordParen = /\b([a-zA-Z_][a-zA-Z0-9_]*)\(/g;
    const funcMatches = workingFormula.match(patternWordParen) || [];

    for (const match of funcMatches) {
      const funcName = match.slice(0, -1); // to remove the ( at the end
      if (!RESERVED_FUNCTIONS.includes(funcName)) {
        return [
          false,
          `the string contains implied multiplication like ${funcName}(something): please use explicit (e.g. ${funcName}*(something))`,
        ];
      }
    }

    const variables = Utilities.parseVariables(workingFormula);
    if (variables.length < 1) {
      return [false, "the formula must have at least 1 variable"];
    }

    return [true, "Formula is valid"];
  }
  static parseVariables(formulaString) {
    const pattern = /[a-zA-Z_][a-zA-Z0-9_]*/g;
    const unfilteredWords = formulaString.match(pattern) || [];
    const uniqueWords = new Set(unfilteredWords);
    let variablesList = Array.from(uniqueWords).filter(
      (word) => !Utilities.RESERVED_FUNCTIONS.includes(word),
    );
    return variablesList.sort();
  }

  static saveCaretPositions(event, textareaObject) {
    const target = event.target; //to handler
    if (!(target instanceof HTMLButtonElement)) {
      return { status: false };
    }
    const valueToInsert = target.value;
    if (!valueToInsert) {
      return { status: false };
    }
    const id = target.id;
    if (!id) {
      return { status: false };
    }
    if (textareaObject) {
      const start = textareaObject.selectionStart ?? 0;
      const end = textareaObject.selectionEnd ?? start;
      const dir = textareaObject.selectionDirection;
      const caret = dir === "backward" ? start : end;
      return {
        status: true,
        current: "UNCHANGED",
        selectionStart: caret,
        selectionEnd: caret,
        isFocused: true,
        valueToInsert,
        id,
      };
    }
    return { status: false };
  }
}
