import CacheingService from "./ChacheingService.js";

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

  static #baseUrl = "http://127.0.0.1:5000";
  static cacheingService = new CacheingService();

  // ===== Config =====
  static setBaseUrl(url) {
    this.#baseUrl = url;
  }

  // ===== HTTP helpers =====
  static async #requestJson(path, { method = "POST", body } = {}) {
    const options = {
      method,
      headers: { "Content-Type": "application/json" },
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
      } catch {
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
      status_bool: response.ok,
      data,
    };
  }

  // caller is responsible for revoking objectUrl when done:
  // URL.revokeObjectURL(objectUrl)
  static async #requestBlob(path, { body } = {}) {
    const response = await fetch(`${this.#baseUrl}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
        objectUrl: null,
      };
    }

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);

    return {
      ok: response.ok,
      status_bool: response.ok,
      status: response.status,
      error: null,
      blob,
      objectUrl,
    };
  }

  // ===== Public API =====
  static status() {
    return this.#requestJson("/api", { method: "GET" });
  }

  static setFormula(requestObject) {
    const { formula_string } = requestObject || {};
    const cached = this.cacheingService.getSetFormulaCache(requestObject);
    if (cached) return Promise.resolve(cached);

    const response = this.#requestJson("/api/set_formula", {
      body: { formula_string },
    });
    this.cacheingService.addSetFormulaCache(requestObject, response);
    return response;
  }

  static solveForTarget(requestObject) {
    const { target } = requestObject || {};
    const cached = this.cacheingService.getSolveForTargetCache(requestObject);
    if (cached) return Promise.resolve(cached);

    const response = this.#requestJson("/api/solve_for_target", {
      body: { target },
    });
    this.cacheingService.addSolveForTargetCache(requestObject, response);
    return response;
  }

  static chooseSolution(requestObject) {
    const { index } = requestObject || {};
    const cached = this.cacheingService.getChooseSolutionCache(requestObject);
    if (cached) return Promise.resolve(cached);

    const response = this.#requestJson("/api/choose_solution", {
      body: { index },
    });
    this.cacheingService.addChooseSolutionCache(requestObject, response);
    return response;
  }

  static passSweeper(requestObject) {
    const { sweeper } = requestObject || {};
    const cached = this.cacheingService.getPassSweeperCache(requestObject);
    if (cached) return Promise.resolve(cached);

    const response = this.#requestJson("/api/pass_sweeper", {
      body: { sweeper },
    });
    this.cacheingService.addPassSweeperCache(requestObject, response);
    return response;
  }

  static verifyFixed(requestObject) {
    const { fixed } = requestObject || {};
    const cached = this.cacheingService.getVerifyFixedCache(requestObject);
    if (cached) return Promise.resolve(cached);

    const response = this.#requestJson("/api/verify_fixed", {
      body: { fixed },
    });
    this.cacheingService.addVerifyFixedCache(requestObject, response);
    return response;
  }

  static performSweep(requestObject) {
    const {
      range: { start, end, steps },
    } = requestObject || {};
    const response = this.#requestBlob("/api/perform_sweep", {
      body: { start, end, steps },
    });
    return response;
  }
}

export default API;
