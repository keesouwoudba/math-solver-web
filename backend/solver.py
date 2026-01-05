import sympy as sp
import matplotlib.pyplot as plt
import re
from typing import Optional

RESERVED_FUNCTIONS = {
    "sin", "cos", "arcsin", "arccos", "tan", "arctan",
    "cot", "arccot", "asin", "acos", "atan", "acot",
    "sinh", "cosh", "tanh", "asinh", "acosh", "atanh",
    "sqrt", "pi", "log", "ln", "exp", "abs",
    "factorial", "E", "I"
}

class FormulaSolver:
    def __init__(self):
        self.formula_string: Optional[str] = None
        self.variables_list: list[str] = []
        self.symbols_dict: dict = {}
        self.equation: Optional[sp.Eq] = None
        self.target_variable: Optional[str] = None
        self.solved_expression: Optional[sp.Expr] = None
        self.solutions_list: list = []
        self.error_message: str = ""
        self.required_list_str: Optional[list[str]] = None
        self.required_list_final: Optional[list[str]] = None
        self.sweeper: Optional[str] = None
        self.is_const: Optional[bool] = False
        self.is_one_var: Optional[bool] = False
        self.is_multi_var: Optional[bool] = False
        self.equation_type: Optional[str] = ""
        self.x_values: list[float] = []
        self.y_values: list[float] = []
        self.skipped: list[float] = []
        self.fixed: dict = {}

    # ========== PUBLIC METHODS ==========

    def set_formula(self, formula_string: str) -> dict:
        self.error_message: str = ""

        if not self._validate_syntax(formula_string):
            return {
                "valid": False,
                "status_bool": False,  # CHANGE 1: Added
                "variables": [],
                "error": self.error_message,
                "formula_string": formula_string
            }

        self.formula_string = formula_string
        self.variables_list = self._parse_variables(formula_string)

        if len(self.variables_list) == 0:
            return {
                "valid": False,
                "status_bool": False,  # CHANGE 1: Added
                "variables": [],
                "error": "Formula must contain at least one variable",
                "formula_string": formula_string
            }

        self.symbols_dict = self._symbolize_variables(self.variables_list)
        self.equation = self._build_equation()

        if self.equation is None:
            return {
                "valid": False,
                "status_bool": False,  # CHANGE 1: Added
                "variables": [],
                "error": self.error_message,
                "formula_string": formula_string
            }

        return {
            "valid": True,
            "status_bool": True,  # CHANGE 1: Added
            "variables": self.variables_list,
            "error": "",
            "formula_string": formula_string
        }

    def solve_for_target(self, target: str) -> dict:
        if self.equation is None:
            return {
                "status": "error",
                "status_bool": False,
                "solutions": [],
                "needs_choice": False,
                "error": "No formula set. Call set_formula() first.",
                "available": self.variables_list,
                "target": target,
                "formula_string": self.formula_string,
                "required_list_str": []
            }

        if not target in self.variables_list:
            return {
                "status": "error",
                "status_bool": False,
                "solutions": [],
                "needs_choice": False,
                "error": f"Variable '{target}' not found in formula. Available: {', '.join(self.variables_list)}",
                "available": self.variables_list,
                "required_list_str": [],
                "target": target,
                "formula_string": self.formula_string
            }

        symbol = self.symbols_dict[target]

        try:
            solutions = sp.solve(self.equation, symbol)

            # No solutions
            if len(solutions) == 0:
                return {
                    "status": "none",
                    "status_bool": False,
                    "solutions": [],
                    "needs_choice": False,
                    "error": f"No solutions found for {target}",
                    "target": target,
                    "available": self.variables_list,
                    "required_list_str": [],
                    "formula_string": self.formula_string
                }

            # One solution
            elif len(solutions) == 1:
                self.target_variable = target
                self.solved_expression = solutions[0]
                self.required_list_str = self._get_required_variables()
                self.solutions_list = solutions
                num_vars = len(self.required_list_str)

                if num_vars == 0:
                    self.is_const = True
                    self.is_one_var = False
                    self.is_multi_var = False
                    self.equation_type = "constant"
                elif num_vars == 1:
                    self.is_const = False
                    self.is_one_var = True
                    self.is_multi_var = False
                    self.equation_type = "one_variable"
                else:  # >= 2
                    self.is_const = False
                    self.is_one_var = False
                    self.is_multi_var = True
                    self.equation_type = "multi_variable"

                return {
                    "status": "success",
                    "status_bool": True,
                    "solutions": [str(solutions[0])],
                    "needs_choice": False,
                    "error": "",
                    "target": target,
                    "available": self.variables_list,
                    "required_list_str": self.required_list_str,
                    "formula_string": self.formula_string,
                    "is_const": self.is_const,           # CHANGE 2: Added
                    "is_one_var": self.is_one_var,       # CHANGE 2: Added
                    "is_multi_var": self.is_multi_var,   # CHANGE 2: Added
                    "equation_type": self.equation_type  # CHANGE 2: Added
                }

            # Multiple solutions
            else:
                self.target_variable = target
                self.solutions_list = solutions
                return {
                    "status": "multiple",
                    "status_bool": True,
                    "solutions": [str(sol) for sol in solutions],
                    "needs_choice": True,
                    "error": "",
                    "target": target,
                    "available": self.variables_list,
                    "required_list_str": [],
                    "formula_string": self.formula_string,
                    "is_const": False,           
                    "is_one_var": False,         
                    "is_multi_var": False,       
                    "equation_type": ""          
                }

        except Exception as e:
            return {
                "status": "error",
                "status_bool": False,
                "solutions": [],
                "needs_choice": False,
                "error": f"Solving error: {str(e)}",
                "target": target,
                "available": self.variables_list,
                "required_list_str": [],
                "formula_string": self.formula_string
            }

    def choose_solution(self, index: int) -> dict:
        try:
            if not self.solutions_list:
                return {
                    "status": "error",
                    "status_bool": False,
                    "solution": "",
                    "error": "No multiple solutions to choose from",
                    "index": index,
                    "formula_string": self.formula_string
                }

            if 0 <= index < len(self.solutions_list):
                self.solved_expression = self.solutions_list[index]
                self.required_list_str = self._get_required_variables()
                num_vars = len(self.required_list_str)
                 
                        
                if num_vars == 0:
                    self.is_const = True
                    self.is_one_var = False
                    self.is_multi_var = False
                    self.equation_type = "constant"
                elif num_vars == 1:
                    self.is_const = False
                    self.is_one_var = True
                    self.is_multi_var = False
                    self.equation_type = "one_variable"
                else:  # >= 2
                    self.is_const = False
                    self.is_one_var = False
                    self.is_multi_var = True
                    self.equation_type = "multi_variable"

                return {
                    "status": "success",
                    "status_bool": True,
                    "solution": str(self.solved_expression),
                    "error": "",
                    "index": index,
                    "required_list_str": self.required_list_str,
                    "formula_string": self.formula_string,
                    "is_const": self.is_const,        
                    "is_one_var": self.is_one_var,     
                    "is_multi_var": self.is_multi_var,   
                    "equation_type": self.equation_type 
                }

            else:
                return {
                    "status": "error",
                    "status_bool": False,
                    "solution": "",
                    "error": f"Invalid index {index}. Must be between 0 and {len(self.solutions_list) - 1}",
                    "index": index,
                    "required_list_str": [],
                    "formula_string": self.formula_string
                }

        except (KeyError, IndexError):
            return {
                "status": "error",
                "status_bool": False,
                "solution": "",
                "error": "Invalid index.",
                "index": index,
                "formula_string": self.formula_string,
                "required_list_str": getattr(self, 'required_list_str', []) 

            }

    def get_required_variables(self) -> list:
        if self.solved_expression is None:
            return []
        required_list = self.solved_expression.free_symbols
        required_list_str = [s.name for s in required_list]
        return sorted(required_list_str)

    def pass_sweeper(self, sweeper):

        if self.is_const:
            return {
                "status": "error",
                "status_bool": False,
                "is_const": True,
                "is_one_var": False,
                "is_multi_var": False,
                "required_list_str": [],
                "sweeper": None,
                "equation_type": "constant",
                "error": "Cannot call pass_sweeper for constant equations. Skip to perform_sweep directly.",
                "required_list_final_str": []
            }

        required_list_str = self._get_required_variables()
        self.required_list_str = required_list_str

        if sweeper not in required_list_str:
            self.equation_type = ""
            return {
                "status": "error",
                "status_bool": False,
                "is_const": self.is_const,
                "is_one_var": self.is_one_var,
                "is_multi_var": self.is_multi_var,
                "required_list_str": required_list_str,
                "sweeper": None,
                "equation_type": "",
                "error": f"sweeper '{sweeper}' not in {required_list_str}",
                "required_list_final_str": []
            }

        if len(required_list_str) == 1:
            self.is_const = False
            self.is_one_var = True
            self.is_multi_var = False
            self.sweeper = sweeper
            self.equation_type = "one_variable"
            return {
                "status": "success",
                "status_bool": True,
                "is_const": self.is_const,
                "is_one_var": self.is_one_var,
                "is_multi_var": self.is_multi_var,
                "required_list_str": self.required_list_str,
                "sweeper": self.sweeper,
                "equation_type": self.equation_type,
                "error": "",
                "required_list_final_str": []
            }

        # Multiple variables
        if len(required_list_str) >= 2:
            self.is_const = False
            self.is_one_var = False
            self.is_multi_var = True
            required_list_final_str = list(set(required_list_str) - {sweeper})
            self.required_list_final = required_list_final_str
            self.sweeper = sweeper
            self.equation_type = "multi_variable"
            return {
                "status": "success",
                "status_bool": True,
                "is_const": self.is_const,
                "is_one_var": self.is_one_var,
                "is_multi_var": self.is_multi_var,
                "required_list_str": required_list_str,
                "required_list_final_str": required_list_final_str,
                "sweeper": self.sweeper,
                "equation_type": self.equation_type,
                "error": ""
            }

    def verify_fixed(self, fixed: dict):
        # Constant case
        if self.is_const:
            self.fixed = {}
            return {
                "status": "success",
                "is_fixed_correct": True,
                "fixed": {},
                "error": "",
                "is_const": self.is_const
            }

        # One variable case
        if self.is_one_var:
            self.fixed = {}
            return {
                "status": "success",
                "is_fixed_correct": True,
                "fixed": {},
                "error": "",
                "is_const": self.is_const
            }

        # Multiple variables
        keys = list(fixed.keys())
        missing_keys = []
        extra_keys = []

        for key in keys:
            if key not in self.required_list_final:
                extra_keys.append(key)
                
        for key in self.required_list_final:
            if key not in keys:
                missing_keys.append(key)

        
        if len(missing_keys) > 0:
            return {
                "status": "error",
                "is_fixed_correct": False,
                "fixed": {},
                "error": f"Missing required variables: {', '.join(missing_keys)}",
                "is_const": self.is_const
            }

        if len(extra_keys) > 0:
            return {
                "status": "error",
                "is_fixed_correct": False,
                "fixed": {},
                "error": f"Invalid variables: {', '.join(extra_keys)}",
                "is_const": self.is_const
            }
            
        self.fixed = fixed
        return {
            "status": "success",
            "is_fixed_correct": True,
            "fixed": self.fixed,
            "error": "",
            "is_const": self.is_const
        }

       

    def perform_sweep(self, start: float, end: float, steps: int) -> dict:
        errorlist = []
        skipped = []
        fixed = self.fixed

        if self.solved_expression is None:
            error1 = "No solution set."
            errorlist.append(error1)

        if steps < 2:
            error2 = "Steps must be at least 2"
            errorlist.append(error2)

        if self.sweeper is None:
            error3 = "no chosen sweeper"
            errorlist.append(error3)
        sweeper = self.sweeper
        if len(errorlist) > 0:
            return {
                "status": "error",
                "x_values": [],
                "y_values": [],
                "skipped": skipped,
                "error": "; ".join(errorlist),
                "is_const": self.is_const
            }

        expression_to_sweeper = self.solved_expression.subs(fixed)
        step = (end - start) / (steps - 1)
        x_values = []
        y_values = []

        if self.is_const:
            const = float(self.solved_expression.evalf(n=15))
            for i in range(steps):
                x_value = start + (i * step)
                try:
                    x_values.append(x_value)
                    y_values.append(const)
                except (TypeError, ValueError, ZeroDivisionError, Exception) as e:
                    skipped.append(x_value)
                    continue

            self.x_values = x_values
            self.y_values = y_values
            self.skipped = skipped

            return {
                "status": "success",
                "x_values": x_values,
                "y_values": y_values,
                "skipped": skipped,
                "error": "",
                "is_const": self.is_const
            }

        elif sweeper is not None:
            for i in range(steps):
                x_value = start + (i * step)
                try:
                    y_value = float((expression_to_sweeper.subs(self.symbols_dict[self.sweeper], x_value)).evalf(n=15))
                    x_values.append(x_value)
                    y_values.append(y_value)
                except (TypeError, ValueError, ZeroDivisionError, Exception) as e:
                    skipped.append(x_value)
                    continue

            self.x_values = x_values
            self.y_values = y_values
            self.skipped = skipped

            return {
                "status": "success",
                "x_values": x_values,
                "y_values": y_values,
                "skipped": skipped,
                "error": "",
                "is_const": self.is_const
            }

    # ========== PRIVATE METHODS ==========

    def _validate_syntax(self, formula_string: str) -> bool:
        if not formula_string:
            self.error_message = "formula_string is required"
            return False

        pattern = r"[^=]+=[^=]+"
        pattern_digit_followed_by_term = r"(\d)([a-zA-Z_]|\()"
        pattern_paren_followed_by_term = r"([)])(\d|[a-zA-Z_]|\()"

        if not re.fullmatch(pattern, formula_string):
            self.error_message = "the string provided is inappropriate: it does not contain one '='"
            return False

        if (
            re.search(pattern_digit_followed_by_term, formula_string) or
            re.search(pattern_paren_followed_by_term, formula_string)
        ):
            self.error_message = "the string contains implied multiplication like 3a, 3(a+b): please use explicit (e.g. 3*a)"
            return False

        pattern_word_paren = r"\b([a-zA-Z_][a-zA-Z0-9_]*)\("
        func_matches = re.findall(pattern_word_paren, formula_string)

        for match in func_matches:
            if match not in RESERVED_FUNCTIONS:
                self.error_message = f"the string contains implied multiplication like {match}(something): please use explicit (e.g. {match}*(something))"
                return False

        if len(self._parse_variables(formula_string)) < 1:
            self.error_message = "the formula must have at least 1 variable"
            return False

        return True

    def _parse_variables(self, formula_string: str) -> list[str]:
        pattern = r"[a-zA-Z_][a-zA-Z0-9_]*"
        unfiltered_words = re.findall(pattern, formula_string)
        unique_words = set(unfiltered_words)
        variables_list = sorted(list(unique_words - RESERVED_FUNCTIONS))
        return variables_list

    def _symbolize_variables(self, variables_list: list[str]) -> dict:
        symbols_dict = {var: sp.symbols(var) for var in variables_list}
        symbols_dict["E"] = sp.E
        symbols_dict["I"] = sp.I
        symbols_dict["pi"] = sp.pi
        return symbols_dict

    def _build_equation(self) -> Optional[sp.Eq]:
        try:
            LHS, RHS = self.formula_string.strip().split("=")
            RHS = sp.sympify(RHS.strip(), locals=self.symbols_dict)
            LHS = sp.sympify(LHS.strip(), locals=self.symbols_dict)
            equation = sp.Eq(LHS, RHS)
            return equation
        except (sp.SympifyError, Exception) as e:
            self.error_message = "couldn't parse the formula, it was incorrect"
            return None

    def _get_required_variables(self) -> list:
        if self.solved_expression is None:
            return []
        required_list = self.solved_expression.free_symbols
        required_list_str = [s.name for s in required_list]
        return sorted(required_list_str)
