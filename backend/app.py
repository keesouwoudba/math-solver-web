from solver import FormulaSolver
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from io import BytesIO
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from functools import wraps

app = Flask(__name__)
CORS(app)

def require_json(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        if not request.is_json:
            return jsonify({
                "status": "error",
                "status_bool": False,
                "error": "Content-Type must be application/json"
            }), 415
        return func(*args, **kwargs)
    return wrapper

def require_body(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        data = request.json
        if not data:
            return jsonify({
                "status": "error",
                "status_bool": False,
                "error": "Body is required"
            }), 400
        return func(*args, **kwargs)
    return wrapper

def require_fields(*required_fields):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            data = request.json
            for field in required_fields:
                if field not in data:
                    return jsonify({
                        "status": "error",
                        "status_bool": False,
                        "error": f"{field} is required",
                    }), 400
            return func(*args, **kwargs)
        return wrapper
    return decorator

def require_not_null(*fields):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            data = request.json
            for field in fields:
                if data.get(field) is None:
                    return jsonify({
                        "status": "error",
                        "status_bool": False,
                        "error": f"{field} cannot be null",
                    }), 400
            return func(*args, **kwargs)
        return wrapper
    return decorator

def require_types(**field_types):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            data = request.json
            for field, expected_type in field_types.items():
                value = data.get(field)
                if not isinstance(value, expected_type):
                    type_name = (
                        expected_type.__name__
                        if isinstance(expected_type, type)
                        else " or ".join(t.__name__ for t in expected_type)
                    )
                    return jsonify({
                        "status": "error",
                        "status_bool": False,
                        "error": f"{field} must be {type_name}, we got {type(value).__name__}"
                    }), 400
            return func(*args, **kwargs)
        return wrapper
    return decorator

@app.route("/api")
def api():
    return jsonify({
        "status": "api is running",
        "Available Endpoints": [
            "/api/set_formula",
            "/api/solve_for_target",
            "/api/choose_solution",
            "/api/verify_fixed",
            "/api/pass_sweeper",
            "/api/perform_sweep"
        ]
    })

@app.route("/api/set_formula", methods=["POST"])
@require_json
@require_body
@require_fields("formula_string")
@require_not_null("formula_string")
@require_types(formula_string=str)
def set_formula():
    try:
        data = request.json
        formula_string = data['formula_string']
        solver = FormulaSolver()
        sf_result = solver.set_formula(formula_string)
        if not sf_result["status_bool"]:
            return jsonify(sf_result), 400

        return jsonify(sf_result), 200

    except KeyError as e:
        return jsonify({
            "valid": False,
            "status_bool": False,
            "error": f"Missing required field: {str(e)}",
            "formula_string": ""
        }), 400

    except Exception as e:
        return jsonify({
            "valid": False,
            "status_bool": False,
            "error": f"Server error: {str(e)}",
            "formula_string": ""
        }), 500

@app.route("/api/solve_for_target", methods=["POST"])
@require_json
@require_body
@require_fields("formula_string", "target")
@require_not_null("formula_string", "target")
@require_types(formula_string=str, target=str)
def solve_for_target():
    try:
        data = request.json
        target = data["target"]
        formula_string = data['formula_string']
        solver = FormulaSolver()

        sf_response = solver.set_formula(formula_string)

        if not sf_response["status_bool"]:
            return jsonify({
                "status": "error",
                "status_bool": False,
                "solutions": [],
                "needs_choice": False,
                "error": sf_response["error"],
                "target": target,
                "available": sf_response.get("variables", []),
                "required_list_str": [],
                "formula_string": formula_string,
                "is_const": False,          
                "is_one_var": False,         
                "is_multi_var": False,       
                "equation_type": ""          
            }), 400

        sft_response = solver.solve_for_target(target)

        if not sft_response["status_bool"]:
            return jsonify(sft_response), 400

        return jsonify(sft_response), 200

    except KeyError as e:
        return jsonify({
            "status": "error",
            "status_bool": False,
            "solutions": [],
            "needs_choice": False,
            "error": f"Missing key: {str(e)}",
            "target": None,
            "available": [],
            "required_list_str": [],
            "formula_string": "",
            "is_const": False,          
            "is_one_var": False,        
            "is_multi_var": False,      
            "equation_type": ""         
        }), 400

    except Exception as e:
        return jsonify({
            "status": "error",
            "status_bool": False,
            "solutions": [],
            "needs_choice": False,
            "error": f"Server error: {str(e)}",
            "target": None,
            "available": [],
            "required_list_str": [],
            "formula_string": "",
            "is_const": False,           
            "is_one_var": False,         
            "is_multi_var": False,      
            "equation_type": ""          
        }), 500

@app.route("/api/choose_solution", methods=["POST"])
@require_json
@require_body
@require_fields("formula_string", "target", "solutions", "needs_choice", "index")
@require_not_null("formula_string", "target", "solutions", "needs_choice", "index")
@require_types(formula_string=str, target=str, solutions=list, needs_choice=bool, index=int)
def choose_solution():
    try:
        data = request.json
        target = data["target"]
        formula_string = data["formula_string"]
        solutions = data["solutions"]
        needs_choice = data["needs_choice"]
        index = data["index"]


        if len(solutions) == 0:
            return jsonify({
                "status": "error",
                "status_bool": False,
                "solution": "",
                "error": "No solutions available",
                "index": index,
                "required_list_str": [],
                "formula_string": formula_string,
                "target": target,
                "solutions": solutions,
                "needs_choice": needs_choice,
                "is_const": False,          
                "is_one_var": False,        
                "is_multi_var": False,      
                "equation_type": ""          
            }), 400

        if index < 0 or index >= len(solutions):
            return jsonify({
                "status": "error",
                "status_bool": False,
                "solution": "",
                "error": f"index must be between 0 and {len(solutions) - 1}, we got {index}",
                "index": index,
                "required_list_str": [],
                "formula_string": formula_string,
                "target": target,
                "solutions": solutions,
                "needs_choice": needs_choice,
                "is_const": False,          
                "is_one_var": False,         
                "is_multi_var": False,       
                "equation_type": ""          
            }), 400

        solver = FormulaSolver()
        sf_response = solver.set_formula(formula_string)

        if not sf_response["status_bool"]:
            return jsonify({
                "status": "error",
                "status_bool": False,
                "solution": "",
                "error": sf_response["error"],
                "index": index,
                "required_list_str": [],
                "formula_string": formula_string,
                "target": target,
                "solutions": solutions,
                "needs_choice": needs_choice,
                "is_const": False,           
                "is_one_var": False,        
                "is_multi_var": False,      
                "equation_type": ""         
            }), 400

        sft_response = solver.solve_for_target(target)

        if not sft_response["status_bool"]:
            return jsonify({
                "status": "error",
                "status_bool": False,
                "solution": "",
                "error": sft_response["error"],
                "index": index,
                "required_list_str": [],
                "formula_string": formula_string,
                "target": target,
                "solutions": solutions,
                "needs_choice": needs_choice,
                "is_const": False,          
                "is_one_var": False,        
                "is_multi_var": False,      
                "equation_type": ""          
            }), 400

        cs_response = solver.choose_solution(index)

        if not cs_response["status_bool"]:
            return jsonify({
                "status": "error",
                "status_bool": False,
                "solution": "",
                "error": cs_response["error"],
                "index": index,
                "required_list_str": [],
                "formula_string": formula_string,
                "target": target,
                "solutions": solutions,
                "needs_choice": needs_choice,
                "is_const": False,          
                "is_one_var": False,        
                "is_multi_var": False,    
                "equation_type": ""         
            }), 400


        cs_response["formula_string"] = formula_string
        cs_response["target"] = target
        cs_response["solutions"] = solutions
        cs_response["needs_choice"] = needs_choice
        cs_response["is_const"] = cs_response.get("is_const", False)
        cs_response["is_one_var"] = cs_response.get("is_one_var", False)
        cs_response["is_multi_var"] = cs_response.get("is_multi_var", False)
        cs_response["equation_type"] = cs_response.get("equation_type", "")

        return jsonify(cs_response), 200

    except KeyError as e:
        return jsonify({
            "status": "error",
            "status_bool": False,
            "solution": "",
            "error": f"Missing key: {str(e)}",
            "index": None,
            "required_list_str": [],
            "formula_string": "",
            "target": "",
            "solutions": [],
            "needs_choice": False,
            "is_const": False,          
            "is_one_var": False,         
            "is_multi_var": False,      
            "equation_type": ""          
        }), 400

    except Exception as e:
        return jsonify({
            "status": "error",
            "status_bool": False,
            "solution": "",
            "error": f"Server error: {str(e)}",
            "index": None,
            "required_list_str": [],
            "formula_string": "",
            "target": "",
            "solutions": [],
            "needs_choice": False,
            "is_const": False,         
            "is_one_var": False,         
            "is_multi_var": False,     
            "equation_type": ""         
        }), 500

@app.route("/api/pass_sweeper", methods=["POST"])
@require_json
@require_body
@require_fields("formula_string", "target", "solutions", "needs_choice", "index", "sweeper")
@require_not_null("formula_string", "target", "solutions", "needs_choice", "index", "sweeper")
@require_types(formula_string=str, target=str, solutions=list, needs_choice=bool, index=int, sweeper=str)
def pass_sweeper():
    try:
        data = request.json
        target = data["target"]
        formula_string = data["formula_string"]
        solutions = data["solutions"]
        needs_choice = data["needs_choice"]
        index = data["index"]
        sweeper = data["sweeper"]

        
        if len(solutions) == 0:
            return jsonify({
                "status": "error",
                "status_bool": False,
                "is_const": False,
                "is_one_var": False,
                "is_multi_var": False,
                "equation_type": "",
                "index": index,
                "solution": "",
                "solutions": solutions,
                "needs_choice": needs_choice,
                "target": target,
                "required_list_final_str": [],
                "required_list_str": [],
                "sweeper": sweeper,
                "error": "solutions cannot be empty"
            }), 400

        if index < 0 or index >= len(solutions):
            return jsonify({
                "status": "error",
                "status_bool": False,
                "is_const": False,
                "is_one_var": False,
                "is_multi_var": False,
                "equation_type": "",
                "index": index,
                "solution": "",
                "solutions": solutions,
                "needs_choice": needs_choice,
                "target": target,
                "required_list_final_str": [],
                "required_list_str": [],
                "sweeper": sweeper,
                "error": f"index must be between 0 and {len(solutions) - 1}, we got {index}"
            }), 400

        solver = FormulaSolver()
        sf_response = solver.set_formula(formula_string)

        if not sf_response["status_bool"]:
            return jsonify({
                "status": "error",
                "status_bool": False,
                "is_const": False,
                "is_one_var": False,
                "is_multi_var": False,
                "equation_type": "",
                "index": index,
                "solution": "",
                "solutions": solutions,
                "needs_choice": needs_choice,
                "target": target,
                "required_list_final_str": [],
                "required_list_str": [],
                "sweeper": sweeper,
                "error": sf_response["error"]
            }), 400

        sft_response = solver.solve_for_target(target)

        if not sft_response["status_bool"]:
            return jsonify({
                "status": "error",
                "status_bool": False,
                "is_const": False,
                "is_one_var": False,
                "is_multi_var": False,
                "equation_type": "",
                "index": index,
                "solution": "",
                "solutions": solutions,
                "needs_choice": needs_choice,
                "target": target,
                "required_list_final_str": [],
                "required_list_str": [],
                "sweeper": sweeper,
                "error": sft_response["error"]
            }), 400

       
        if sft_response.get("is_const", False):
            return jsonify({
                "status": "error",
                "status_bool": False,
                "is_const": True,
                "is_one_var": False,
                "is_multi_var": False,
                "equation_type": "constant",
                "index": index,
                "solution": solutions[0],
                "solutions": solutions,
                "needs_choice": needs_choice,
                "target": target,
                "required_list_final_str": [],
                "required_list_str": [],
                "sweeper": sweeper,
                "error": "Cannot call pass_sweeper for constant equations. Skip to perform_sweep directly."
            }), 400

       
        if needs_choice:
            cs_response = solver.choose_solution(index)
            if not cs_response["status_bool"]:
                return jsonify({
                    "status": "error",
                    "status_bool": False,
                    "is_const": False,
                    "is_one_var": False,
                    "is_multi_var": False,
                    "equation_type": "",
                    "index": index,
                    "solution": "",
                    "solutions": solutions,
                    "needs_choice": needs_choice,
                    "target": target,
                    "required_list_final_str": [],
                    "required_list_str": [],
                    "sweeper": sweeper,
                    "error": cs_response["error"]
                }), 400
        else:
            
            cs_response = {
                "status": "success",
                "status_bool": True,
                "solution": solutions[0],
                "required_list_str": sft_response.get("required_list_str", [])
            }

        ps_response = solver.pass_sweeper(sweeper)

        if ps_response["status"] != "success":
            return jsonify({
                "status": "error",
                "status_bool": False,
                "is_const": False,
                "is_one_var": False,
                "is_multi_var": False,
                "equation_type": "",
                "index": index,
                "solution": cs_response.get("solution", ""),
                "solutions": solutions,
                "needs_choice": needs_choice,
                "target": target,
                "required_list_final_str": [],
                "required_list_str": cs_response.get("required_list_str", []),
                "sweeper": sweeper,
                "error": ps_response["error"]
            }), 400

        return jsonify({
            "status": "success",
            "status_bool": True,
            "is_const": solver.is_const,
            "is_one_var": solver.is_one_var,
            "is_multi_var": solver.is_multi_var,
            "equation_type": ps_response["equation_type"],
            "index": index,
            "solution": cs_response["solution"],
            "solutions": solutions,
            "needs_choice": needs_choice,
            "target": target,
            "required_list_final_str": ps_response.get("required_list_final_str", []),  
            "required_list_str": cs_response.get("required_list_str", []),
            "sweeper": sweeper,
            "error": ""
        }), 200

    except KeyError as e:
        return jsonify({
            "status": "error",
            "status_bool": False,
            "is_const": False,
            "is_one_var": False,
            "is_multi_var": False,
            "equation_type": "",
            "index": None,
            "solution": "",
            "solutions": [],
            "needs_choice": False,
            "target": "",
            "required_list_final_str": [],
            "required_list_str": [],
            "sweeper": "",
            "error": f"Missing key: {str(e)}"
        }), 400

    except Exception as e:
        return jsonify({
            "status": "error",
            "status_bool": False,
            "is_const": False,
            "is_one_var": False,
            "is_multi_var": False,
            "equation_type": "",
            "index": None,
            "solution": "",
            "solutions": [],
            "needs_choice": False,
            "target": "",
            "required_list_final_str": [],
            "required_list_str": [],
            "sweeper": "",
            "error": f"Server error: {str(e)}"
        }), 500

@app.route("/api/verify_fixed", methods=["POST"])
@require_json
@require_body
@require_fields("formula_string", "target", "solutions", "needs_choice", "index", "sweeper", "fixed")
@require_not_null("formula_string", "target", "solutions", "needs_choice", "index", "sweeper", "fixed")
@require_types(formula_string=str, target=str, solutions=list, needs_choice=bool, index=int, sweeper=str, fixed=dict)
def verify_fixed():
    try:
        data = request.json
        target = data["target"]
        formula_string = data["formula_string"]
        solutions = data["solutions"]
        needs_choice = data["needs_choice"]
        index = data["index"]
        sweeper = data["sweeper"]
        fixed = data["fixed"]

        

        if len(solutions) == 0:
            return jsonify({
                "status": "error",
                "status_bool": False,
                "is_const": False,
                "is_one_var": False,
                "is_multi_var": False,
                "equation_type": "",
                "index": index,
                "solution": "",
                "solutions": solutions,
                "needs_choice": needs_choice,
                "target": target,
                "required_list_final_str": [],
                "required_list_str": [],
                "sweeper": sweeper,
                "is_fixed_correct": False,
                "fixed": fixed,
                "error": "solutions cannot be empty"
            }), 400

        if index < 0 or index >= len(solutions):
            return jsonify({
                "status": "error",
                "status_bool": False,
                "is_const": False,
                "is_one_var": False,
                "is_multi_var": False,
                "equation_type": "",
                "index": index,
                "solution": "",
                "solutions": solutions,
                "needs_choice": needs_choice,
                "target": target,
                "required_list_final_str": [],
                "required_list_str": [],
                "sweeper": sweeper,
                "is_fixed_correct": False,
                "fixed": fixed,
                "error": f"index must be between 0 and {len(solutions) - 1}, we got {index}"
            }), 400

        solver = FormulaSolver()
        sf_result = solver.set_formula(formula_string)

        if not sf_result["status_bool"]:
            return jsonify({
                "status": "error",
                "status_bool": False,
                "is_const": False,
                "is_one_var": False,
                "is_multi_var": False,
                "equation_type": "",
                "index": index,
                "solution": "",
                "solutions": solutions,
                "needs_choice": needs_choice,
                "target": target,
                "required_list_final_str": [],
                "required_list_str": [],
                "sweeper": sweeper,
                "is_fixed_correct": False,
                "fixed": fixed,
                "error": sf_result["error"]
            }), 400

        sft_response = solver.solve_for_target(target)

        if not sft_response["status_bool"]:
            return jsonify({
                "status": "error",
                "status_bool": False,
                "is_const": False,
                "is_one_var": False,
                "is_multi_var": False,
                "equation_type": "",
                "index": index,
                "solution": "",
                "solutions": solutions,
                "needs_choice": needs_choice,
                "target": target,
                "required_list_final_str": [],
                "required_list_str": [],
                "sweeper": sweeper,
                "is_fixed_correct": False,
                "fixed": fixed,
                "error": sft_response["error"]
            }), 400

       
        if needs_choice:
            cs_response = solver.choose_solution(index)
            if not cs_response["status_bool"]:
                return jsonify({
                    "status": "error",
                    "status_bool": False,
                    "is_const": False,
                    "is_one_var": False,
                    "is_multi_var": False,
                    "equation_type": "",
                    "index": index,
                    "solution": "",
                    "solutions": solutions,
                    "needs_choice": needs_choice,
                    "target": target,
                    "required_list_final_str": [],
                    "required_list_str": [],
                    "sweeper": sweeper,
                    "is_fixed_correct": False,
                    "fixed": fixed,
                    "error": cs_response["error"]
                }), 400
        else:
            
            cs_response = {
                "status": "success",
                "status_bool": True,
                "solution": solutions[0],
                "required_list_str": sft_response.get("required_list_str", [])
            }

        ps_response = solver.pass_sweeper(sweeper)

        if ps_response["status"] != "success":
            return jsonify({
                "status": "error",
                "status_bool": False,
                "is_const": False,
                "is_one_var": False,
                "is_multi_var": False,
                "equation_type": "",
                "index": index,
                "solution": "",
                "solutions": solutions,
                "needs_choice": needs_choice,
                "target": target,
                "required_list_final_str": [],
                "required_list_str": [],
                "sweeper": sweeper,
                "is_fixed_correct": False,
                "fixed": fixed,
                "error": ps_response["error"]
            }), 400

        vf_response = solver.verify_fixed(fixed)

        if vf_response["status"] != "success":
            return jsonify({
                "status": vf_response["status"],
                "status_bool": False,
                "is_const": ps_response.get("is_const", False),
                "is_one_var": ps_response.get("is_one_var", False),
                "is_multi_var": ps_response.get("is_multi_var", False),
                "equation_type": ps_response.get("equation_type", ""),
                "index": index,
                "solution": cs_response.get("solution", ""),
                "solutions": solutions,
                "needs_choice": needs_choice,
                "target": target,
                "required_list_final_str": ps_response.get("required_list_final_str", []),
                "required_list_str": cs_response.get("required_list_str", []),
                "sweeper": sweeper,
                "is_fixed_correct": vf_response["is_fixed_correct"],
                "fixed": vf_response.get("fixed", {}),
                "error": vf_response["error"]
            }), 400

        return jsonify({
            "status": "success",
            "status_bool": True,
            "is_const": vf_response["is_const"],
            "is_one_var": ps_response.get("is_one_var", False),
            "is_multi_var": ps_response.get("is_multi_var", False),
            "equation_type": ps_response.get("equation_type", ""),
            "index": index,
            "solution": cs_response["solution"],
            "solutions": solutions,
            "needs_choice": needs_choice,
            "target": target,
            "required_list_final_str": ps_response.get("required_list_final_str", []),
            "required_list_str": cs_response["required_list_str"],
            "sweeper": sweeper,
            "is_fixed_correct": vf_response["is_fixed_correct"],
            "fixed": vf_response["fixed"],
            "error": ""
        }), 200

    except KeyError as e:
        return jsonify({
            "status": "error",
            "status_bool": False,
            "is_const": False,
            "is_one_var": False,
            "is_multi_var": False,
            "equation_type": "",
            "index": None,
            "solution": "",
            "solutions": [],
            "needs_choice": False,
            "target": "",
            "required_list_final_str": [],
            "required_list_str": [],
            "sweeper": "",
            "is_fixed_correct": False,
            "fixed": {},
            "error": f"Missing key: {str(e)}"
        }), 400

    except Exception as e:
        return jsonify({
            "status": "error",
            "status_bool": False,
            "is_const": False,
            "is_one_var": False,
            "is_multi_var": False,
            "equation_type": "",
            "index": None,
            "solution": "",
            "solutions": [],
            "needs_choice": False,
            "target": "",
            "required_list_final_str": [],
            "required_list_str": [],
            "sweeper": "",
            "is_fixed_correct": False,
            "fixed": {},
            "error": f"Server error: {str(e)}"
        }), 500

@app.route("/api/perform_sweep", methods=["POST"])
@require_json
@require_body
@require_fields("formula_string", "target", "solutions", "needs_choice", "index", "sweeper", "fixed", "start", "end", "steps")
@require_not_null("formula_string", "target", "solutions", "needs_choice", "index", "sweeper", "fixed", "start", "end", "steps")
@require_types(formula_string=str, target=str, solutions=list, needs_choice=bool, index=int, sweeper=str, fixed=dict, start=(float, int), end=(float, int), steps=(float, int))
def perform_sweep():
    try:
        data = request.json
        target = data["target"]
        formula_string = data["formula_string"]
        solutions = data["solutions"]
        needs_choice = data["needs_choice"]
        index = data["index"]
        sweeper = data["sweeper"]
        fixed = data["fixed"]
        start = data["start"]
        end = data["end"]
        steps = data["steps"]

       

        if len(solutions) == 0:
            return jsonify({
                "status": "error",
                "status_bool": False,
                "error": "solutions cannot be empty"
            }), 400

        if index < 0 or index >= len(solutions):
            return jsonify({
                "status": "error",
                "status_bool": False,
                "error": f"index must be between 0 and {len(solutions) - 1}, we got {index}"
            }), 400

        if steps < 2:
            return jsonify({
                "status": "error",
                "status_bool": False,
                "error": "steps must be at least 2"
            }), 400

        if start >= end:
            return jsonify({
                "status": "error",
                "status_bool": False,
                "error": "start must be less than end"
            }), 400

        solver = FormulaSolver()
        sf_result = solver.set_formula(formula_string)

        if not sf_result["status_bool"]:
            return jsonify({
                "status": "error",
                "status_bool": False,
                "error": sf_result["error"]
            }), 400

        sft_response = solver.solve_for_target(target)

        if not sft_response["status_bool"]:
            return jsonify({
                "status": "error",
                "status_bool": False,
                "error": sft_response["error"]
            }), 400

        
        if needs_choice:
            cs_response = solver.choose_solution(index)
            if not cs_response["status_bool"]:
                return jsonify({
                    "status": "error",
                    "status_bool": False,
                    "error": cs_response["error"]
                }), 400
            
            is_const = cs_response.get("is_const", False)
            is_one_var = cs_response.get("is_one_var", False)
            is_multi_var = cs_response.get("is_multi_var", False)
        else:
           
            is_const = sft_response.get("is_const", False)
            is_one_var = sft_response.get("is_one_var", False)
            is_multi_var = sft_response.get("is_multi_var", False)

        
        if is_const:
          
            sweep_response = solver.perform_sweep(start, end, steps)

            if sweep_response["status"] != "success":
                return jsonify({
                    "status": "error",
                    "status_bool": False,
                    "error": sweep_response["error"]
                }), 400

            x_label = "x" 
        elif is_one_var:
            
            if not sweeper:
                return jsonify({
                    "status": "error",
                    "status_bool": False,
                    "error": "sweeper is required for one-variable equations"
                }), 400

            ps_response = solver.pass_sweeper(sweeper)
            if ps_response["status"] != "success":
                return jsonify({
                    "status": "error",
                    "status_bool": False,
                    "error": ps_response["error"]
                }), 400

            vf_response = solver.verify_fixed({})
            if vf_response["status"] != "success":
                return jsonify({
                    "status": "error",
                    "status_bool": False,
                    "error": vf_response["error"]
                }), 400

            sweep_response = solver.perform_sweep(start, end, steps)
            if sweep_response["status"] != "success":
                return jsonify({
                    "status": "error",
                    "status_bool": False,
                    "error": sweep_response["error"]
                }), 400

            x_label = sweeper

        elif is_multi_var:
           
            if not sweeper:
                return jsonify({
                    "status": "error",
                    "status_bool": False,
                    "error": "sweeper is required for multi-variable equations"
                }), 400

            ps_response = solver.pass_sweeper(sweeper)
            if ps_response["status"] != "success":
                return jsonify({
                    "status": "error",
                    "status_bool": False,
                    "error": ps_response["error"]
                }), 400

            vf_response = solver.verify_fixed(fixed)
            if vf_response["status"] != "success":
                return jsonify({
                    "status": "error",
                    "status_bool": False,
                    "error": vf_response["error"]
                }), 400

            sweep_response = solver.perform_sweep(start, end, steps)
            if sweep_response["status"] != "success":
                return jsonify({
                    "status": "error",
                    "status_bool": False,
                    "error": sweep_response["error"]
                }), 400

            x_label = sweeper

        else:
            return jsonify({
                "status": "error",
                "status_bool": False,
                "error": "Unknown equation type"
            }), 400

        x_values = sweep_response["x_values"]
        y_values = sweep_response["y_values"]
        skipped = sweep_response["skipped"]

        plt.figure(figsize=(10, 6))
        plt.plot(x_values, y_values, 'b-', linewidth=2)
        plt.xlabel(x_label, fontsize=12) 
        plt.ylabel(target, fontsize=12)
        plt.title(f'{target} vs {x_label}', fontsize=14, fontweight='bold')
        plt.grid(True, alpha=0.3)

        if len(skipped) > 0:
            plt.text(0.02, 0.98, f'Skipped points: {len(skipped)}',
                    transform=plt.gca().transAxes,
                    verticalalignment='top',
                    bbox=dict(boxstyle='round', facecolor='yellow', alpha=0.5))

        img_io = BytesIO()
        plt.savefig(img_io, format='png', dpi=150, bbox_inches='tight')
        img_io.seek(0)
        plt.close()

        return send_file(
            img_io,
            mimetype='image/png',
            as_attachment=False,
            download_name=f'{target}_vs_{x_label}.png'
        )

    except KeyError as e:
        return jsonify({
            "status": "error",
            "status_bool": False,
            "error": f"Missing key: {str(e)}"
        }), 400

    except Exception as e:
        return jsonify({
            "status": "error",
            "status_bool": False,
            "error": f"Server error: {str(e)}"
        }), 500

if __name__ == '__main__':
    app.run(host="0.0.0.0", debug=True, port=5000)
