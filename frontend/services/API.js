import ChacheingService from "./ChacheingService.js";

class API {
  // ===== Constants =====
  static #RESERVED_FUNCTIONS = new Set([
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
  ]);

  static #TINY_PNG_BASE64 =
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAgMBApG3xQAAAABJRU5ErkJggg==";

  static #baseUrl = "http://127.0.0.1:5000";
  static #useExamples = true;

  // === chahce service object ==
  static cacheingService = new ChacheingService();

  // ===== Config =====
  static setBaseUrl(url) {
    this.#baseUrl = url;
  }

  static setUseExamples(flag) {
    this.#useExamples = Boolean(flag);
  }

  // ===== Utilities =====
  static #parseVariables(formulaString) {
    const pattern = /[a-zA-Z_][a-zA-Z0-9_]*/g;
    const words = formulaString.match(pattern) || [];
    const uniqueWords = new Set(words);
    return Array.from(uniqueWords)
      .filter((word) => !this.#RESERVED_FUNCTIONS.has(word))
      .sort();
  }

  static #base64ToBlob(base64, mimeType) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new Blob([bytes], { type: mimeType });
  }

  static #getTypeName(value) {
    if (value === null) {
      return "null";
    }
    if (Array.isArray(value)) {
      return "array";
    }
    return typeof value;
  }

  // ===== Example helpers =====
  static #exampleError(status, data) {
    return Promise.resolve({
      ok: false,
      status,
      data,
    });
  }

  static #exampleBlobError(status, error) {
    return Promise.resolve({
      ok: false,
      status,
      error,
      blob: null,
      objectUrl: "",
    });
  }

  static #makeSetFormulaError(error, formulaString = "") {
    return this.#exampleError(400, {
      valid: false,
      status_bool: false,
      variables: [],
      error,
      formula_string: formulaString,
    });
  }

  static #makeSolveForTargetError(error, target = null) {
    return this.#exampleError(400, {
      status: "error",
      status_bool: false,
      solutions: [],
      needs_choice: false,
      error,
      target,
      available: [],
      required_list_str: [],
      formula_string: "",
      is_const: false,
      is_one_var: false,
      is_multi_var: false,
      equation_type: "",
      index: null,
      sweeper: null,
      fixed: {},
    });
  }

  static #makeChooseSolutionError(error, index = null) {
    return this.#exampleError(400, {
      status: "error",
      status_bool: false,
      solution: "",
      error,
      index,
      required_list_str: [],
      formula_string: "",
      target: "",
      solutions: [],
      needs_choice: false,
      is_const: false,
      is_one_var: false,
      is_multi_var: false,
      equation_type: "",
    });
  }

  static #makePassSweeperError(error, sweeper = "") {
    return this.#exampleError(400, {
      status: "error",
      status_bool: false,
      is_const: false,
      is_one_var: false,
      is_multi_var: false,
      equation_type: "",
      index: null,
      solution: "",
      solutions: [],
      needs_choice: false,
      target: "",
      required_list_final_str: [],
      required_list_str: [],
      sweeper,
      error,
    });
  }

  static #makeVerifyFixedError(error) {
    return this.#exampleError(400, {
      status: "error",
      status_bool: false,
      is_const: false,
      is_one_var: false,
      is_multi_var: false,
      equation_type: "",
      index: null,
      solution: "",
      solutions: [],
      needs_choice: false,
      target: "",
      required_list_final_str: [],
      required_list_str: [],
      sweeper: "",
      is_fixed_correct: false,
      fixed: {},
      error,
    });
  }

  static #makePerformSweepError(error) {
    return this.#exampleBlobError(400, {
      status: "error",
      status_bool: false,
      error,
    });
  }

  // ===== Example API, backend simulation =====
  static #exampleStatus() {
    return Promise.resolve({
      ok: true,
      status: 200,
      data: {
        status: "api is running",
        "Available Endpoints": [
          "/api/set_formula",
          "/api/solve_for_target",
          "/api/choose_solution",
          "/api/pass_sweeper",
          "/api/verify_fixed",
          "/api/perform_sweep",
        ],
      },
    });
  }

  static #exampleSetFormula(formula_string) {
    if (formula_string === undefined) {
      return this.#makeSetFormulaError("formula_string is required");
    }
    if (formula_string === null) {
      return this.#makeSetFormulaError("formula_string cannot be null");
    }
    if (typeof formula_string !== "string") {
      return this.#makeSetFormulaError(
        `formula_string must be str, we got ${this.#getTypeName(formula_string)}`,
      );
    }

    const formula = formula_string.trim();
    if (!formula) {
      return this.#makeSetFormulaError(
        "formula_string is required",
        formula_string,
      );
    }

    const equalsMatches = formula.match(/=/g) || [];
    if (equalsMatches.length !== 1) {
      return this.#makeSetFormulaError(
        "the string must contain exactly one '='",
        formula_string,
      );
    }

    const [lhs, rhs] = formula.split("=");
    if (!lhs.trim() || !rhs.trim()) {
      return this.#makeSetFormulaError(
        "both sides of '=' must be non-empty",
        formula_string,
      );
    }

    const patternDigitFollowedByTerm = /(\d)([a-zA-Z_]|\()/;
    const patternParenFollowedByTerm = /([)])(\d|[a-zA-Z_]|\()/;
    if (
      patternDigitFollowedByTerm.test(formula) ||
      patternParenFollowedByTerm.test(formula)
    ) {
      return this.#makeSetFormulaError(
        "the string contains implied multiplication like 3a, 3(a+b): please use explicit (e.g. 3*a)",
        formula_string,
      );
    }

    const patternWordParen = /\b([a-zA-Z_][a-zA-Z0-9_]*)\(/g;
    const funcMatches = formula.match(patternWordParen) || [];
    for (const match of funcMatches) {
      const funcName = match.slice(0, -1);
      if (!this.#RESERVED_FUNCTIONS.has(funcName)) {
        return this.#makeSetFormulaError(
          `the string contains implied multiplication like ${funcName}(something): please use explicit (e.g. ${funcName}*(something))`,
          formula_string,
        );
      }
    }

    const variables = this.#parseVariables(formula);
    if (variables.length < 1) {
      return this.#makeSetFormulaError(
        "the formula must have at least 1 variable",
        formula_string,
      );
    }

    return Promise.resolve({
      ok: true,
      status: 200,
      data: {
        valid: true,
        status_bool: true,
        variables,
        error: "",
        formula_string,
      },
    });
  }

  static #exampleSolveForTarget(target) {
    if (target === undefined) {
      return this.#makeSolveForTargetError("target is required");
    }
    if (target === null) {
      return this.#makeSolveForTargetError("target cannot be null");
    }
    if (typeof target !== "string") {
      return this.#makeSolveForTargetError(
        `target must be str, we got ${this.#getTypeName(target)}`,
      );
    }

    const resolvedTarget = target.trim() || "x";
    return Promise.resolve({
      ok: true,
      status: 200,
      data: {
        status: "success",
        status_bool: true,
        solutions: [`${resolvedTarget} = y + 1`],
        needs_choice: false,
        error: "",
        target: resolvedTarget,
        available: [resolvedTarget, "y"],
        required_list_str: ["y"],
        formula_string: `${resolvedTarget} = y + 1`,
        is_const: false,
        is_one_var: true,
        is_multi_var: false,
        equation_type: "one_variable",
        index: 0,
        sweeper: "y",
        fixed: {},
      },
    });
  }

  static #exampleChooseSolution(index) {
    if (index === undefined) {
      return this.#makeChooseSolutionError("index is required");
    }
    if (index === null) {
      return this.#makeChooseSolutionError("index cannot be null");
    }
    if (!Number.isInteger(index)) {
      return this.#makeChooseSolutionError(
        `index must be int, we got ${this.#getTypeName(index)}`,
        index,
      );
    }
    if (index < 0) {
      return this.#makeChooseSolutionError(
        `index must be between 0 and 0, we got ${index}`,
        index,
      );
    }

    return Promise.resolve({
      ok: true,
      status: 200,
      data: {
        status: "success",
        status_bool: true,
        solution: "x = y + 1",
        error: "",
        index,
        required_list_str: ["y"],
        formula_string: "x = y + 1",
        is_const: false,
        is_one_var: true,
        is_multi_var: false,
        equation_type: "one_variable",
        target: "x",
        solutions: ["x = y + 1"],
        needs_choice: false,
      },
    });
  }

  static #examplePassSweeper(sweeper) {
    if (sweeper === undefined) {
      return this.#makePassSweeperError("sweeper is required");
    }
    if (sweeper === null) {
      return this.#makePassSweeperError("sweeper cannot be null");
    }
    if (typeof sweeper !== "string") {
      return this.#makePassSweeperError(
        `sweeper must be str, we got ${this.#getTypeName(sweeper)}`,
        String(sweeper ?? ""),
      );
    }

    const resolvedSweeper = sweeper.trim() || "y";
    return Promise.resolve({
      ok: true,
      status: 200,
      data: {
        status: "success",
        status_bool: true,
        is_const: false,
        is_one_var: true,
        is_multi_var: false,
        equation_type: "one_variable",
        index: 0,
        solution: "x = y + 1",
        solutions: ["x = y + 1"],
        needs_choice: false,
        target: "x",
        required_list_final_str: [],
        required_list_str: ["y"],
        sweeper: resolvedSweeper,
        error: "",
      },
    });
  }

  static #exampleVerifyFixed(fixed) {
    if (fixed === undefined) {
      return this.#makeVerifyFixedError("fixed is required");
    }
    if (fixed === null) {
      return this.#makeVerifyFixedError("fixed cannot be null");
    }
    if (typeof fixed !== "object" || Array.isArray(fixed)) {
      return this.#makeVerifyFixedError(
        `fixed must be dict, we got ${this.#getTypeName(fixed)}`,
      );
    }

    return Promise.resolve({
      ok: true,
      status: 200,
      data: {
        status: "success",
        status_bool: true,
        is_const: false,
        is_one_var: true,
        is_multi_var: false,
        equation_type: "one_variable",
        index: 0,
        solution: "x = y + 1",
        solutions: ["x = y + 1"],
        needs_choice: false,
        target: "x",
        required_list_final_str: [],
        required_list_str: ["y"],
        sweeper: "y",
        is_fixed_correct: true,
        fixed: fixed || {},
        error: "",
      },
    });
  }

  static #examplePerformSweep({ start, end, steps } = {}) {
    if (start === undefined) {
      return this.#makePerformSweepError("start is required");
    }
    if (end === undefined) {
      return this.#makePerformSweepError("end is required");
    }
    if (steps === undefined) {
      return this.#makePerformSweepError("steps is required");
    }
    if (start === null) {
      return this.#makePerformSweepError("start cannot be null");
    }
    if (end === null) {
      return this.#makePerformSweepError("end cannot be null");
    }
    if (steps === null) {
      return this.#makePerformSweepError("steps cannot be null");
    }
    if (typeof start !== "number") {
      return this.#makePerformSweepError(
        `start must be float or int, we got ${this.#getTypeName(start)}`,
      );
    }
    if (typeof end !== "number") {
      return this.#makePerformSweepError(
        `end must be float or int, we got ${this.#getTypeName(end)}`,
      );
    }
    if (typeof steps !== "number") {
      return this.#makePerformSweepError(
        `steps must be float or int, we got ${this.#getTypeName(steps)}`,
      );
    }
    if (steps < 2) {
      return thithis.root.removeEventListener("click"); //focusin, focusout, inputs.#makePerformSweepError("steps must be at least 2");
    }
    if (start >= end) {
      return this.#makePerformSweepError("start must be less than end");
    }

    const blob = this.#base64ToBlob(this.#TINY_PNG_BASE64, "image/png");
    const objectUrl = URL.createObjectURL(blob);
    return Promise.resolve({
      ok: true,
      status: 200,
      blob,
      objectUrl,
    });
  }

  // ===== HTTP helpers =====
  static async #requestJson(path, { method = "POST", body } = {}) {
    const options = {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    };

    if (body !== undefined && method !== "GET") {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${this.#baseUrl}${path}`, options);
    const text = await response.text();
    let data = {};

    if (text) {
      try {
        data = JSON.parse(text);
      } catch (error) {
        data = {
          status: "error",
          status_bool: false,
          error: "Invalid JSON response",
          raw: text,
        };
      }
    }

    return {
      ok: response.ok,
      status: response.status,
      data,
    };
  }

  static async #requestBlob(path, { body } = {}) {
    const response = await fetch(`${this.#baseUrl}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(body || {}),
    });

    const contentType = response.headers.get("content-type") || "";

    if (!response.ok && contentType.includes("application/json")) {
      const error = await response.json();
      return {
        ok: false,
        status: response.status,
        error,
        blob: null,
        objectUrl: "",
      };
    }

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);

    return {
      ok: response.ok,
      status: response.status,
      blob,
      objectUrl,
    };
  }

  // ===== Real API =====
  static #realStatus() {
    return this.#requestJson("/api", { method: "GET" });
  }

  static #realSetFormula(formula_string) {
    return this.#requestJson("/set_formula", {
      method: "POST",
      body: { formula_string },
    });
  }

  static #realSolveForTarget(target) {
    return this.#requestJson("/solve_for_target", {
      method: "POST",
      body: { target },
    });
  }

  static #realChooseSolution(index) {
    return this.#requestJson("/choose_solution", {
      method: "POST",
      body: { index },
    });
  }

  static #realPassSweeper(sweeper) {
    return this.#requestJson("/pass_sweeper", {
      method: "POST",
      body: { sweeper },
    });
  }

  static #realVerifyFixed(fixed) {
    return this.#requestJson("/verify_fixed", {
      method: "POST",
      body: { fixed },
    });
  }

  static #realPerformSweep({ start, end, steps }) {
    return this.#requestBlob("/perform_sweep", {
      body: { start, end, steps },
    });
  }

  // ===== Public API =====
  static status() {
    return this.#useExamples ? this.#exampleStatus() : this.#realStatus();
  }

  static setFormula(requestObject) {
    const { formula_string: formula_string } = requestObject || {};
    const cacheResponse =
      this.cacheingService.getSetFormulaCache(requestObject);
    if (cacheResponse) {
      return Promise.resolve(cacheResponse);
    } else {
      const response = this.#useExamples
        ? this.#exampleSetFormula(formula_string)
        : this.#realSetFormula(formula_string);
      this.cacheingService.addSetFormulaCache(requestObject, response);
      return Promise.resolve(response);
    }
  }

  static solveForTarget(requestObject) {
    const { formula_string: formula_string, target: target } =
      requestObject || {};
    const cacheResponse =
      this.cacheingService.getSolveForTargetCache(requestObject);
    if (cacheResponse) {
      return Promise.resolve(cacheResponse);
    } else {
      const response = this.#useExamples
        ? this.#exampleSolveForTarget(target)
        : this.#realSolveForTarget(target);
      this.cacheingService.addSolveForTargetCache(requestObject, response);
      return Promise.resolve(response);
    }
  }

  static chooseSolution(requestObject) {
    const {
      formula_string: formula_string,
      target: target,
      index: index,
    } = requestObject || {};
    const cacheResponse =
      this.cacheingService.getChooseSolutionCache(requestObject);
    if (cacheResponse) {
      return Promise.resolve(cacheResponse);
    } else {
      const response = this.#useExamples
        ? this.#exampleChooseSolution(index)
        : this.#realChooseSolution(index);
      this.cacheingService.addChooseSolutionCache(requestObject, response);
      return Promise.resolve(response);
    }
  }

  static passSweeper(requestObject) {
    const {
      formula_string: formula_string,
      target: target,
      index: index,
      sweeper: sweeper,
    } = requestObject || {};
    const cacheResponse =
      this.cacheingService.getPassSweeperCache(requestObject);
    if (cacheResponse) {
      return Promise.resolve(cacheResponse);
    } else {
      const response = this.#useExamples
        ? this.#examplePassSweeper(sweeper)
        : this.#realPassSweeper(sweeper);
      this.cacheingService.addPassSweeperCache(requestObject, response);
      return Promise.resolve(response);
    }
  }

  static verifyFixed(requestObject) {
    const {
      formula_string: formula_string,
      target: target,
      index: index,
      fixed: fixed,
    } = requestObject || {};
    const cacheResponse =
      this.cacheingService.getVerifyFixedCache(requestObject);
    if (cacheResponse) {
      return Promise.resolve(cacheResponse);
    } else {
      const response = this.#useExamples
        ? this.#exampleVerifyFixed(fixed)
        : this.#realVerifyFixed(fixed);
      this.cacheingService.addVerifyFixedCache(requestObject, response);
      return Promise.resolve(response);
    }
  }

  static performSweep(requestObject) {
    const {
      formula_string: formula_string,
      target: target,
      index: index,
      start: start,
      end: end,
      steps: steps,
    } = requestObject || {};
    const cacheResponse =
      this.cacheingService.getPerformSweepCache(requestObject);
    if (cacheResponse) {
      return Promise.resolve(cacheResponse);
    } else {
      const response = this.#useExamples
        ? this.#examplePerformSweep({ start, end, steps })
        : this.#realPerformSweep({ start, end, steps });
      this.cacheingService.addPerformSweepCache(requestObject, response);
      return Promise.resolve(response);
    }
  }
}

export default API;
