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
        """Initialize empty solver - stores state between method calls"""
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
        
    
    
    # ========== PUBLIC METHODS ==========
    
    def set_formula(self, formula_string: str) -> dict:
        self.error_message: str = ""
        if not self._validate_syntax(formula_string):
            return {
            "valid": False,
            "variables": [],
            "error": self.error_message
            }
            
        self.formula_string = formula_string
        self.variables_list = self._parse_variables(formula_string)
        
        if len(self.variables_list) == 0:
            return {
            "valid": False,
            "variables": [],
            "error": "Formula must contain at least one variable"
            }  
            
        self.symbols_dict = self._symbolize_variables(self.variables_list)
        self.equation = self._build_equation()
        
        if self.equation is None:
            return {
            "valid": False,
            "variables": [],
            "error": self.error_message  # ← Set by _build_equation
            }
            
        return {
        "valid": True,
        "variables": self.variables_list,
        "error": ""
        }
        
    
    
    def solve_for_target(self, target: str) -> dict:
        if self.equation is None:
            return {
            "status": "error",
            "solutions": [],
            "needs_choice": False,
            "error": "No formula set. Call set_formula() first.",
            "available": self.variables_list
            }
            
        if not target in self.variables_list:
            return {
            "status": "error",
            "solutions": [],
            "needs_choice": False,
            "error": f"Variable '{target}' not found in formula. Available: {', '.join(self.variables_list)}",
            "available": self.variables_list
            }
        symbol = self.symbols_dict[target]
        try:
            solutions = sp.solve(self.equation, symbol)
            # No solutions
            if len(solutions) == 0:
                return {
                        "status": "none",
                        "solutions": [],
                        "needs_choice": False,
                        "error": f"No solutions found for {target}"
                        }
                
            # One solution
            elif len(solutions) == 1:
                self.target_variable = target
                self.solved_expression = solutions[0]
                return {
                    "status": "success",
                    "solutions": [str(solutions[0])],
                    "needs_choice": False,
                    "error": ""
                    }
                
            # Multiple solutions
            else:
                self.target_variable = target
                self.solutions_list = solutions
                return {
                    "status": "multiple",
                    "solutions": [str(sol) for sol in solutions],
                    "needs_choice": True,
                    "error": ""
                    }
            
        except Exception as e:
            return {
                "status": "error",
                "solutions": [],
                "needs_choice": False,
                "error": f"Solving error: {str(e)}"
                }
    
    
    def choose_solution(self, index: int) -> dict:
        try:
            if not self.solutions_list:
                return {
                "status": "error",
                "solution": "",
                "error": "No multiple solutions to choose from"
                    }
                
            if 0 <= index < len(self.solutions_list):
                self.solved_expression = self.solutions_list[index]
                return {
                    "status": "success",
                    "solution": str(self.solved_expression),
                    "error": ""
                    }

                
        except (KeyError, IndexError):
            return {
                "status": "error",
                "solution": "",
                "error": "Invalid index."
                }
    
    def get_required_variables(self) -> list:
        if self.solved_expression is None:
            return []
        required_list = self.solved_expression.free_symbols
        required_list_str = [s.name for s in required_list]
        return sorted(required_list_str)
    
    def pass_sweeper(self, sweeper):
        required_list_str = self.get_required_variables() 
        self.required_list_str = required_list_str
        
        if len(required_list_str) == 0:
            self.is_const = True
            self.is_one_var = False
            self.is_multi_var = False
            self.sweeper = sweeper  
            return {
                "status": "success", 
                "required_list_str": [],
                "sweeper": self.sweeper,
                "equation_type": "constant", 
                "error": ""
            }
        
        if sweeper not in required_list_str:
            return {
                "status": "error", 
                "required_list_str": required_list_str,
                "sweeper": None,
                "error": f"sweeper '{sweeper}' not in {required_list_str}"
            }
            
        if len(required_list_str) == 1:
            self.is_const = False
            self.is_one_var = True
            self.is_multi_var = False
            self.sweeper = sweeper
            return {
                "status": "success", 
                "required_list_str": [],
                "sweeper": self.sweeper,
                "equation_type": "one_variable",  
                "error": ""
            }
        
        # Multiple variables (>= 2)
        if len(required_list_str) >= 2:
            self.is_const = False
            self.is_one_var = False
            self.is_multi_var = True
            required_list_final_str = list(set(required_list_str) - {sweeper})
            self.required_list_final = required_list_final_str
            self.sweeper = sweeper
            return {
                "status": "success", 
                "required_list_str": required_list_final_str,
                "sweeper": self.sweeper,
                "equation_type": "multi_variable",  
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
        i = 0
        error_keys = []
        for key in keys:
            if not key in self.required_list_final:
                i += 1
                error_keys.append(key)
            
        if i == 0:
            self.fixed = fixed
            return {
                "status": "success", 
                "is_fixed_correct": True, 
                "fixed": self.fixed, 
                "error": "",
                "is_const": self.is_const
            }
        else:  # i >= 1
            return {
                "status": "error",
                "is_fixed_correct": False, 
                "fixed": {},
                "error": f"the following keys resulted in error: {', '.join(error_keys)}", 
                "is_const": self.is_const
            }

        
        
        
    def perform_sweep(self,
                     start: float, end: float, steps: int) -> dict:
        errorlist = []
        skipped = []
        sweeper = self.sweeper
        target_str = self.target_variable
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
        if sweeper is None:
            error4  = "no sweeper"
            errorlist.append(error4)
            
        if len(errorlist) > 0:
            return {
                "status": "error",
                "x_values": [],
                "y_values": [],
                "skipped": skipped,
                "error": errorlist,
                "is_const": self.is_const
                }
        
        expression_to_sweeper = self.solved_expression.subs(fixed)
        var_name = sweeper if sweeper != "000" else "x"
        step = (end-start)/(steps - 1)
        x_values = []
        y_values = []
        
        
        if self.is_const:
            const = float(self.solved_expression.evalf(n=15))
            for i in range(steps):
                x_value = start + (i * step)
                try:
                    x_values.append(x_value)
                    y_values.append(const)
                        
                except(TypeError, ValueError, ZeroDivisionError, Exception) as e:
                    skipped.append(x_value)
                    continue   
                
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
            return {
                "status": "success",
                "x_values": x_values,
                "y_values": y_values,
                "skipped": skipped,
                "error": "",
                "is_const": self.is_const
                }
            
        
        
    
    
    
    # ========== PRIVATE HELPER METHODS ==========
    
    def _validate_syntax(self, formula_string: str) -> bool:
        pattern = r"[^=]+=[^=]+"
        pattern_digit_followed_by_term = r"(\d)([a-zA-Z_]|\()" 
        pattern_paren_followed_by_term = r"([)])([a-zA-Z_]|\d|\()"
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

# ========== TESTING CODE ==========



#front end immitation:

solver = FormulaSolver()
while True:
    try:
        while True:
            try:
                formula = input("what's the formula? ")
                sf_response = solver.set_formula(formula)
                if not sf_response["valid"]:
                    print(sf_response["error"])
                    continue
                target = input(f"choose target from: {", ".join(sf_response["variables"])}: ")
                sft_response = solver.solve_for_target(target)
                allowed_status_for_sft = ["multiple", "success"]
                
                if sft_response["status"] == "error" or sft_response["status"] not in allowed_status_for_sft:
                    print(sft_response["error"])
                elif sft_response["status"] in allowed_status_for_sft:
                    break
                else:
                    print("unexpected error happened")
                    continue
            except Exception as e: 
                print(f"error {e} happened, try again")
            
        solutionX = sft_response["solutions"] 
        while True:
            try:
                if sft_response["needs_choice"]:
                    print("the equation has more than one solution")
                    for i, solution in enumerate(solutionX):  
                        print(f"{i}: {solution}")
                    solution_index = int(input("choose solution index to proceed: "))
                    cs_response = solver.choose_solution(solution_index)
                    if cs_response["status"] == "error":
                        print(cs_response["error"])
                        continue
                    solutionX = cs_response["solution"]
                    break
                break
            except Exception as e:
                print(f"error {e} happened")
            
        print(f"solution is {solutionX}")
        grv_response = solver.get_required_variables()
        print("you have successfully reached sweeper")
        while True:
            print(f"available options: {", ".join(grv_response)}")
            sweeper = input("choose sweeper variable: ")
            ps_response = solver.pass_sweeper(sweeper)
            if ps_response["status"] == "error":
                print(f"{ps_response["error"]}")
                print(f"choose from {solver.required_list_str}")
                continue
            required_list_final_str = ps_response["required_list_str"]
            equation_type = ps_response["equation_type"]
            break
        fixed = {}
        
        while True:
            try:
                if equation_type == "multi_variable" and len(solver.required_list_final) > 0:
                    print("please enter fix values for the following variables")
                    for variable in solver.required_list_final:
                        value = float(input(f"enter value for {variable}: "))
                        fixed[variable] = value
                vf_response = solver.verify_fixed(fixed)
                if not vf_response["is_fixed_correct"]:
                    print(f"{vf_response["error"]}")
                    continue
                break
                        
            except Exception as E:
                print(f"error {e} happened")
                
        while True:
            try:
                start = float(input("please enter START value for sweeper: "))
                end =  float(input("please enter END value for sweeper: "))
                steps = int(input("please enter NUMBER OF STEPS for sweeper: "))
                perform_s_response = solver.perform_sweep(start, end, steps)
                if perform_s_response["status"] == "error":
                    print(perform_s_response["error"])
                    continue
                x_values = perform_s_response["x_values"]
                y_values = perform_s_response["y_values"]
                skipped = perform_s_response["skipped"]
                
                plt.plot(x_values, y_values)
                plt.xlabel(f"variable: {sweeper}")
                plt.ylabel(f"variable: {target}")
                plt.title(f"{sweeper} vs {target} relationship")
                plt.grid(True)
                plt.show()
                break
                
            except Exception as e:
                print(f"error {e}")
                continue
        again = input("\nSolve another formula? (y/n): ")
        if again.lower() != 'y':
            break
    except Exception as e:
        print(e)
        retry = input("Try again? (y/n): ")
        if retry.lower() != 'y':
            break




        
        
        
        
            
    
        
            
            
    
        
        
        
               
    
    
    
    

    