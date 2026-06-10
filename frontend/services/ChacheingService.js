export default class CacheingService {
  chache = {
    setFormulaChache: [
      {
        formula_string: "(x)**(2) + 3*x + 2 = 0",
        response: {
          ok: true,
          status: 200,
          data: {
            valid: true,
            status_bool: true,
            variables: ["x"],
            error: "",
            formula_string: "(x)**(2) + 3*x + 2 = 0",
          },
        },
      },
    ],
    solveForTargetChache: [
      {
        formula_string: "(x)**(2) + 3*x + 2 = 0",
        target: "x",
        response: {
          ok: true,
          status: 200,
          data: {
            status: "success",
            status_bool: true,
            solutions: [`${"resolvedTarget"} = y + 1`],
            needs_choice: false,
            error: "",
            target: "resolvedTarget",
            available: ["resolvedTarget", "y"],
            required_list_str: ["y"],
            formula_string: "resolvedTarget = y + 1",
            is_const: false,
            is_one_var: true,
            is_multi_var: false,
            equation_type: "one_variable",
            index: 0,
            sweeper: "y",
            fixed: {},
          },
        },
      },
    ],
    chooseSolutionChache: [
      {
        formula_string: "(x)**(2) + 3*x + 2 = 0",
        target: "x",
        index: 0,
        response: {
          ok: true,
          status: 200,
          data: {
            status: "success",
            status_bool: true,
            solution: "x = y + 1",
            error: "",
            index: 1,
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
        },
      },
    ],
    passSweeperChache: [
      {
        formula_string: "(x)**(2) + 3*x + 2 = 0",
        target: "x",
        index: 0,
        sweeper: "sweeper_data",
        response: {
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
            sweeper: "resolvedSweeper",
            error: "",
          },
        },
      },
    ],
    verifyFixedChache: [
      {
        formula_string: "(x)**(2) + 3*x + 2 = 0",
        target: "x",
        index: 0,
        fixed: "x = -1",
        sweeper: "sweeper_data",
        response: {
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
            solution: "",
            solutions: ["x = y + 1"],
            needs_choice: false,
            target: "x",
            required_list_final_str: [],
            required_list_str: ["y"],
            sweeper: "y",
            is_fixed_correct: true,
            fixed: {},
            error: "",
          },
        },
      },
    ],
  };
  constructor(oldCache) {
    this.cache = new Proxy(oldCache || this.chache, {
      get(target, prop) {
        return target[prop];
      },
      set(target, prop, value) {
        this.limitCacheSize();
        target[prop] = value;
        return true;
      },
    });
  }
  limitCacheSize(chacheSize = 10) {
    for (let key in this.chache) {
      if (this.chache[key].length > chacheSize) {
        this.chache[key].shift();
      }
    }
  }
  addSetFormulaCache(requestObject, response) {
    const { formula_string: formula_string } = requestObject || {};
    const setFormulaCache = this.chache.setFormulaChache;
    setFormulaCache.push({ formula_string, response });
  }
  getSetFormulaCache(requestObject) {
    const { formula_string: formula_string } = requestObject || {};
    const setFormulaCache = this.chache.setFormulaChache;
    let chacheResponse = null;
    for (let chache of setFormulaCache) {
      if (chache.formula_string === formula_string) {
        chacheResponse = chache.response;
      }
    }
    return chacheResponse;
  }

  addSolveForTargetCache(requestObject, response) {
    const { formula_string: formula_string, target: target } =
      requestObject || {};
    const solveForTargetCache = this.chache.solveForTargetChache;
    solveForTargetCache.push({ formula_string, target, response });
  }
  getSolveForTargetCache(requestObject) {
    const { formula_string: formula_string, target: target } =
      requestObject || {};
    const solveForTargetCache = this.chache.solveForTargetChache;
    let chacheResponse = null;
    for (let chache of solveForTargetCache) {
      if (
        chache.formula_string === formula_string &&
        chache.target === target
      ) {
        chacheResponse = chache.response;
      }
    }
    return chacheResponse;
  }

  addChooseSolutionCache(requestObject, response) {
    const {
      formula_string: formula_string,
      target: target,
      index: index,
    } = requestObject || {};
    const chooseSolutionCache = this.chache.chooseSolutionChache;
    chooseSolutionCache.push({ formula_string, target, index, response });
  }
  getChooseSolutionCache(requestObject) {
    const {
      formula_string: formula_string,
      target: target,
      index: index,
    } = requestObject || {};
    const chooseSolutionCache = this.chache.chooseSolutionChache;
    let chacheResponse = null;
    for (let chache of chooseSolutionCache) {
      if (
        chache.formula_string === formula_string &&
        chache.target === target &&
        chache.index === index
      ) {
        chacheResponse = chache.response;
      }
    }
    return chacheResponse;
  }

  addPassSweeperCache(requestObject, response) {
    const {
      formula_string: formula_string,
      target: target,
      index: index,
      sweeper: sweeper,
    } = requestObject || {};
    const passSweeperCache = this.chache.passSweeperChache;
    passSweeperCache.push({
      formula_string,
      target,
      index,
      sweeper,
      response,
    });
  }
  getPassSweeperCache(requestObject) {
    const {
      formula_string: formula_string,
      target: target,
      index: index,
      sweeper: sweeper,
    } = requestObject || {};
    const passSweeperCache = this.chache.passSweeperChache;
    let chacheResponse = null;
    for (let chache of passSweeperCache) {
      if (
        chache.formula_string === formula_string &&
        chache.target === target &&
        chache.index === index &&
        chache.sweeper === sweeper
      ) {
        chacheResponse = chache.response;
      }
    }
    return chacheResponse;
  }

  addVerifyFixedCache(requestObject, response) {
    const {
      formula_string: formula_string,
      target: target,
      index: index,
      fixed: fixed,
      sweeper: sweeper,
    } = requestObject || {};
    const verifyFixedCache = this.chache.verifyFixedChache;
    verifyFixedCache.push({
      formula_string,
      target,
      index,
      fixed,
      sweeper,
      response,
    });
  }
  getVerifyFixedCache(requestObject) {
    const {
      formula_string: formula_string,
      target: target,
      index: index,
      fixed: fixed,
      sweeper: sweeper,
    } = requestObject || {};
    const verifyFixedCache = this.chache.verifyFixedChache;
    let chacheResponse = null;
    for (let chache of verifyFixedCache) {
      if (
        chache.formula_string === formula_string &&
        chache.target === target &&
        chache.index === index &&
        chache.fixed === fixed &&
        chache.sweeper === sweeper
      ) {
        chacheResponse = chache.response;
      }
    }
    return chacheResponse;
  }
}
