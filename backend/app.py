from solver import FormulaSolver
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from io import BytesIO
import matplotlib
matplotlib.use('Agg')  # Use non-GUI backend for server
import matplotlib.pyplot as plt


app = Flask(__name__)
CORS(app)



@app.route("/api")
def api():
    return jsonify({
        "message": "api is running",
        "Available Endpoints": [
            "/api/set_formula",
            "/api/solve_for_target",
            "/api/choose_solution"
        ]
    })


'''
example json received: {"formula_string": "S = v * t"}


example json return: {
                "valid": true,
                "variables": ["S", "t", "v"],
                "error": "",
                "formula_string": "S = v * t"
            }
'''
@app.route("/api/set_formula", methods=["POST"])
def set_formula():
    try:
        if not request.is_json:
            return jsonify({
                "valid": False,
                "error": "Content-Type must be application/json",
                "formula_string": ""
            }), 415
        
        data = request.json
        
        if not data or 'formula_string' not in data:
            return jsonify({
                "valid": False,
                "error": "formula_string is required",
                "formula_string": ""
            }), 400
        
        formula_string = data['formula_string']
        
        if formula_string is None:
            return jsonify({
                "valid": False,
                "error": "formula_string cannot be null",
                "formula_string": ""
            }), 400
   
        if not isinstance(formula_string, str):
            return jsonify({
                "valid": False,
                "error": f"formula_string must be a string, we got {type(formula_string).__name__}",
                "formula_string": ""
            }), 400
        
        solver = FormulaSolver()
        sf_result = solver.set_formula(formula_string)
        
        if not sf_result["valid"]:
            return jsonify(sf_result), 400
        
        return jsonify(sf_result), 200
        
    except KeyError as e:
        return jsonify({
            "valid": False,
            "error": f"Missing required field: {str(e)}",
            "formula_string": ""
        }), 400
        
    except Exception as e:
        return jsonify({
            "valid": False,
            "error": f"Server error: {str(e)}",
            "formula_string": ""
        }), 500



'''
example json received: {"formula_string": "S = v * t", "target": "S"}


example json return: {
                "status": "success",
                "status_bool": True,
                "solutions": ["S/t"],
                "needs_choice": false,
                "error": "",
                "target": "S",
                "available": ["S", "t", "v"],
                "required_list_str": ["t"],
                "formula_string": "S = v * t"
            }
'''
@app.route("/api/solve_for_target", methods=["POST"])
def solve_for_target():
    try:
        if not request.is_json:
            return jsonify({
                "status": "error",
                "status_bool": False,
                "solutions": [],
                "needs_choice": False,
                "error": "content type must be application/json",
                "target": "",
                "available": [],
                "required_list_str": [],
                "formula_string": ""
            }), 415
        
        data = request.json
        
        if not data:
            return jsonify({
                "status": "error",
                "status_bool": False,
                "solutions": [],
                "needs_choice": False,
                "error": "Request body is required",
                "target": "",
                "available": [],
                "required_list_str": [],
                "formula_string": ""
            }), 400
            
        if 'formula_string' not in data:
            return jsonify({
                "status": "error",
                "status_bool": False,
                "solutions": [],
                "needs_choice": False,
                "error": "formula_string is required",
                "target": None,
                "available": [],
                "required_list_str": [],
                "formula_string": ""
            }), 400
            
        if "target" not in data:
            return jsonify({
                "status": "error",
                "status_bool": False,
                "solutions": [],
                "needs_choice": False,
                "error": "target is required",
                "target": None,
                "available": [],
                "required_list_str": [],
                "formula_string": data.get("formula_string", "")
            }), 400
            
        target = data["target"]
        formula_string = data['formula_string']
        
        if target is None:
            return jsonify({
                "status": "error",
                "status_bool": False,
                "solutions": [],
                "needs_choice": False,
                "error": "target cannot be null",
                "target": None,
                "available": [],
                "required_list_str": [],
                "formula_string": formula_string
            }), 400
        
        if not isinstance(target, str):
            return jsonify({
                "status": "error",
                "status_bool": False,
                "solutions": [],
                "needs_choice": False,
                "error": f"target must be a string, we got {type(target).__name__}",
                "target": target,
                "available": [],
                "required_list_str": [],
                "formula_string": formula_string
            }), 400

        if formula_string is None:
            return jsonify({
                "status": "error",
                "status_bool": False,
                "solutions": [],
                "needs_choice": False,
                "error": "formula_string cannot be null",
                "target": target,
                "available": [],
                "required_list_str": [],
                "formula_string": ""
            }), 400

        if not isinstance(formula_string, str):
            return jsonify({
                "status": "error",
                "status_bool": False,
                "solutions": [],
                "needs_choice": False,
                "error": f"formula_string must be a string, we got {type(formula_string).__name__}",
                "target": target,
                "available": [],
                "required_list_str": [],
                "formula_string": ""
            }), 400
                 
        solver = FormulaSolver()
        sf_response = solver.set_formula(formula_string)
        
        if not sf_response["valid"]:
            return jsonify({
                "status": "error",
                "status_bool": False,
                "solutions": [],
                "needs_choice": False,
                "error": sf_response["error"],
                "target": target,
                "available": sf_response.get("variables", []),
                "required_list_str": [],
                "formula_string": formula_string
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
            "formula_string": ""
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
            "formula_string": ""
        }), 500


'''
example json received: {
                        "formula_string": "x**2 = 4",
                        "target": "x",
                        "solutions": ["-2", "2"],
                        "needs_choice": True,
                        "index": 0
                    }


example json return: {
                        "status": "success",
                        "status_bool": True,
                        "solution": "-2",
                        "error": "",
                        "index": 0,
                        "required_list_str": [],
                        "formula_string": "x**2 = 4",
                        "target": "x",
                        "solutions": ["-2", "2"],
                        "needs_choice": True
                    }
'''
@app.route("/api/choose_solution", methods=["POST"])
def choose_solution():
    try:
        if not request.is_json:
            return jsonify({
                "status": "error",
                "status_bool": False,
                "solution": "",
                "error": "content type must be application/json",
                "index": None,
                "required_list_str": [],
                "formula_string": "",
                "target": "",
                "solutions": [],
                "needs_choice": False
            }), 415

        data = request.json
        
        if not data:
            return jsonify({
                "status": "error",
                "status_bool": False,
                "solution": "",
                "error": "Request body is required",
                "index": None,
                "required_list_str": [],
                "formula_string": "",
                "target": "",
                "solutions": [],
                "needs_choice": False
            }), 400
        
        if "formula_string" not in data:
            return jsonify({
                "status": "error",
                "status_bool": False,
                "solution": "",
                "error": "formula_string is required",
                "index": None,
                "required_list_str": [],
                "formula_string": "",
                "target": "",
                "solutions": [],
                "needs_choice": False
            }), 400
        
        if "target" not in data:
            return jsonify({
                "status": "error",
                "status_bool": False,
                "solution": "",
                "error": "target is required",
                "index": None,
                "required_list_str": [],
                "formula_string": data.get("formula_string", ""),
                "target": "",
                "solutions": [],
                "needs_choice": False
            }), 400
            
        if "solutions" not in data:
            return jsonify({
                "status": "error",
                "status_bool": False,
                "solution": "",
                "error": "solutions list is required",
                "index": None,
                "required_list_str": [],
                "formula_string": data.get("formula_string", ""),
                "target": data.get("target", ""),
                "solutions": [],
                "needs_choice": False
            }), 400
            
        if "needs_choice" not in data:
            return jsonify({
                "status": "error",
                "status_bool": False,
                "solution": "",
                "error": "needs_choice is required",
                "index": None,
                "required_list_str": [],
                "formula_string": data.get("formula_string", ""),
                "target": data.get("target", ""),
                "solutions": data.get("solutions", []),
                "needs_choice": False
            }), 400
          
        if "index" not in data:
            return jsonify({
                "status": "error",
                "status_bool": False,
                "solution": "",
                "error": "index is required",
                "index": None,
                "required_list_str": [],
                "formula_string": data.get("formula_string", ""),
                "target": data.get("target", ""),
                "solutions": data.get("solutions", []),
                "needs_choice": data.get("needs_choice", False)
            }), 400
        
        target = data["target"]
        formula_string = data['formula_string']
        solutions = data["solutions"]
        needs_choice = data["needs_choice"]
        index = data["index"]
        
        if not needs_choice:
            return jsonify({
                "status": "error",
                "status_bool": False,
                "solution": "",
                "error": "needs_choice must be true to choose a solution",
                "index": index,
                "required_list_str": [],
                "formula_string": formula_string,
                "target": target,
                "solutions": solutions,
                "needs_choice": needs_choice
            }), 400
        
        if not isinstance(solutions, list) or len(solutions) < 2:
            return jsonify({
                "status": "error",
                "status_bool": False,
                "solution": "",
                "error": "solutions must be a list with at least 2 items",
                "index": index,
                "required_list_str": [],
                "formula_string": formula_string,
                "target": target,
                "solutions": solutions,
                "needs_choice": needs_choice
            }), 400
        
        if not isinstance(target, str):
            return jsonify({
                "status": "error",
                "status_bool": False,
                "solution": "",
                "error": f"target must be a string, we got {type(target).__name__}",
                "index": index,
                "required_list_str": [],
                "formula_string": formula_string,
                "target": target,
                "solutions": solutions,
                "needs_choice": needs_choice
            }), 400
        
        if not isinstance(formula_string, str):
            return jsonify({
                "status": "error",
                "status_bool": False,
                "solution": "",
                "error": f"formula_string must be a string, we got {type(formula_string).__name__}",
                "index": index,
                "required_list_str": [],
                "formula_string": formula_string,
                "target": target,
                "solutions": solutions,
                "needs_choice": needs_choice
            }), 400
        
        if not isinstance(index, int):
            return jsonify({
                "status": "error",
                "status_bool": False,
                "solution": "",
                "error": f"index must be an integer, we got {type(index).__name__}",
                "index": index,
                "required_list_str": [],
                "formula_string": formula_string,
                "target": target,
                "solutions": solutions,
                "needs_choice": needs_choice
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
                "needs_choice": needs_choice
            }), 400
        
        solver = FormulaSolver()
        
        sf_response = solver.set_formula(formula_string)
        if not sf_response["valid"]:
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
                "needs_choice": needs_choice
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
                "needs_choice": needs_choice
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
                "needs_choice": needs_choice
            }), 400
        
        cs_response["formula_string"] = formula_string #just in case i forgot.
        cs_response["target"] = target
        cs_response["solutions"] = solutions
        cs_response["needs_choice"] = True
        
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
            "needs_choice": False
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
            "needs_choice": False
        }), 500


'''
example json received: {
                        "formula_string": "x**2 + y = 4",
                        "target": "x",
                        "solutions": ["-sqrt(4 - y)", "sqrt(4 - y)"],
                        "needs_choice": true,
                        "index": 0,
                        "sweeper": "y"
                    }


example json output: {
                        "status": "success",
                        "status_bool": true,
                        "is_const": false,
                        "is_one_var": false,
                        "is_multi_var": true,
                        "equation_type": "multi_variable",
                        "index": 0,
                        "solution": "-sqrt(4 - y)",
                        "solutions": ["-sqrt(4 - y)", "sqrt(4 - y)"],
                        "needs_choice": true,
                        "target": "x",
                        "required_list_final_str": [],
                        "required_list_str": ["y"],
                        "sweeper": "y",
                        "error": ""
                    }
'''


@app.route("/api/pass_sweeper", methods=["POST"])
def pass_sweeper():
    try:
        if not request.is_json:
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
                "error": "content type must be application/json"
            }), 415
            
        data = request.json
        
        if not data:
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
                "error": "Request body is required"
            }), 400
        
        if "formula_string" not in data:
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
                "error": "formula_string is required"
            }), 400
            
        if "target" not in data:
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
                "error": "target is required"
            }), 400
            
        if "solutions" not in data:
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
                "error": "solutions are required"
            }), 400
            
        if "needs_choice" not in data:
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
                "error": "needs_choice is required"
            }), 400
            
        if "index" not in data:
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
                "error": "index is required"
            }), 400
            
        if "sweeper" not in data:
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
                "error": "sweeper is required"
            }), 400
        
        target = data["target"]
        formula_string = data["formula_string"]
        solutions = data["solutions"]
        needs_choice = data["needs_choice"]
        index = data["index"]
        sweeper = data["sweeper"]
        
        if not isinstance(solutions, list):
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
                "error": "solutions must be a list"
            }), 400
        
        if not isinstance(target, str):
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
                "error": f"target must be a string, we got {type(target).__name__}"
            }), 400
        
        if not isinstance(formula_string, str):
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
                "error": f"formula_string must be a string, we got {type(formula_string).__name__}"
            }), 400
        
        if not isinstance(sweeper, str):
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
                "error": f"sweeper must be a string, we got {type(sweeper).__name__}"
            }), 400
        
        if not isinstance(index, int):
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
                "error": f"index must be an integer, we got {type(index).__name__}"
            }), 400
        
        if target is None or target == "":
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
                "error": "target cannot be null or empty"
            }), 400
        
        if formula_string is None or formula_string == "":
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
                "error": "formula_string cannot be null or empty"
            }), 400
        
        if sweeper is None or sweeper == "":
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
                "error": "sweeper cannot be null or empty"
            }), 400
        
        if not needs_choice:
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
                "error": "needs_choice must be true"
            }), 400
        
        if len(solutions) < 2:
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
                "error": "solutions must have at least 2 items"
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
        if not sf_response["valid"]:
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
        cs_response["target"] = target
        cs_response["solutions"] = solutions
        cs_response["needs_choice"] = needs_choice
        
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
            "required_list_final_str": ps_response["required_list_str"],
            "required_list_str": cs_response["required_list_str"],
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


'''
json received: {
                    "formula_string": "x**2 + y = 4",
                    "target": "x",
                    "solutions": ["-sqrt(4 - y)", "sqrt(4 - y)"],
                    "needs_choice": true,
                    "index": 0,
                    "sweeper": "y",
                    "fixed": {}
                }


json output: {
                    "status": "success",
                    "status_bool": true,
                    "is_const": false,
                    "is_one_var": false,
                    "is_multi_var": true,
                    "equation_type": "multi_variable",
                    "index": 0,
                    "solution": "-sqrt(4 - y)",
                    "solutions": ["-sqrt(4 - y)", "sqrt(4 - y)"],
                    "needs_choice": true,
                    "target": "x",
                    "required_list_final_str": [],
                    "required_list_str": ["y"],
                    "sweeper": "y",
                    "is_fixed_correct": true,
                    "fixed": {},
                    "error": ""
                }
'''
@app.route("/api/verify_fixed", methods=["POST"])
def verify_fixed():
    try:
        if not request.is_json:
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
                "error": "content type must be application/json"
            }), 415
        
        data = request.json
        
        if not data:
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
                "error": "Request body is required"
            }), 400
        
        if "formula_string" not in data:
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
                "error": "formula_string is required"
            }), 400
        
        if "target" not in data:
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
                "error": "target is required"
            }), 400
        
        if "solutions" not in data:
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
                "error": "solutions are required"
            }), 400
        
        if "needs_choice" not in data:
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
                "error": "needs_choice is required"
            }), 400
        
        if "index" not in data:
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
                "error": "index is required"
            }), 400
        
        if "sweeper" not in data:
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
                "error": "sweeper is required"
            }), 400
        
        if "fixed" not in data:
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
                "error": "fixed is required"
            }), 400
        
        target = data["target"]
        formula_string = data["formula_string"]
        solutions = data["solutions"]
        needs_choice = data["needs_choice"]
        index = data["index"]
        sweeper = data["sweeper"]
        fixed = data["fixed"]
        
        if not isinstance(solutions, list):
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
                "error": "solutions must be a list"
            }), 400
        
        if not isinstance(target, str):
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
                "error": f"target must be a string, we got {type(target).__name__}"
            }), 400
        
        if not isinstance(formula_string, str):
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
                "error": f"formula_string must be a string, we got {type(formula_string).__name__}"
            }), 400
        
        if not isinstance(sweeper, str):
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
                "error": f"sweeper must be a string, we got {type(sweeper).__name__}"
            }), 400
        
        if not isinstance(index, int):
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
                "error": f"index must be an integer, we got {type(index).__name__}"
            }), 400
        
        if not isinstance(fixed, dict):
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
                "error": f"fixed must be a dict, we got {type(fixed).__name__}"
            }), 400
        
        if target is None or target == "":
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
                "error": "target cannot be null or empty"
            }), 400
        
        if formula_string is None or formula_string == "":
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
                "error": "formula_string cannot be null or empty"
            }), 400
        
        if sweeper is None or sweeper == "":
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
                "error": "sweeper cannot be null or empty"
            }), 400
        
        if not needs_choice:
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
                "error": "needs_choice must be true"
            }), 400
        
        if len(solutions) < 2:
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
                "error": "solutions must have at least 2 items"
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
        if not sf_result["valid"]:
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
                "required_list_final_str": ps_response.get("required_list_str", []),
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
            "required_list_final_str": ps_response.get("required_list_str", []),
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




'''
example json received: {
                    "formula_string": "x**2 + y = 4",
                    "target": "x",
                    "solutions": ["-sqrt(4 - y)", "sqrt(4 - y)"],
                    "needs_choice": true,
                    "index": 0,
                    "sweeper": "y",
                    "fixed": {},
                    "start": 0.0,
                    "end": 10.0,
                    "steps": 100
                }


example output: image file in png formating (in case of success) or {"status": "error", "status_bool": False, "error": "error message"} (in case of error)
'''
@app.route("/api/perform_sweep", methods=["POST"])
def perform_sweep():
    try:
        if not request.is_json:
            return jsonify({
                "status": "error",
                "status_bool": False,
                "error": "content type must be application/json"
            }), 415
        
        data = request.json
        
        if not data:
            return jsonify({
                "status": "error",
                "status_bool": False,
                "error": "Request body is required"
            }), 400
        
        if "formula_string" not in data:
            return jsonify({
                "status": "error",
                "status_bool": False,
                "error": "formula_string is required"
            }), 400
        
        if "target" not in data:
            return jsonify({
                "status": "error",
                "status_bool": False,
                "error": "target is required"
            }), 400
        
        if "solutions" not in data:
            return jsonify({
                "status": "error",
                "status_bool": False,
                "error": "solutions are required"
            }), 400
        
        if "needs_choice" not in data:
            return jsonify({
                "status": "error",
                "status_bool": False,
                "error": "needs_choice is required"
            }), 400
        
        if "index" not in data:
            return jsonify({
                "status": "error",
                "status_bool": False,
                "error": "index is required"
            }), 400
        
        if "sweeper" not in data:
            return jsonify({
                "status": "error",
                "status_bool": False,
                "error": "sweeper is required"
            }), 400
        
        if "fixed" not in data:
            return jsonify({
                "status": "error",
                "status_bool": False,
                "error": "fixed is required"
            }), 400
        
        if "start" not in data:
            return jsonify({
                "status": "error",
                "status_bool": False,
                "error": "start is required"
            }), 400
        
        if "end" not in data:
            return jsonify({
                "status": "error",
                "status_bool": False,
                "error": "end is required"
            }), 400
        
        if "steps" not in data:
            return jsonify({
                "status": "error",
                "status_bool": False,
                "error": "steps is required"
            }), 400
        
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
        
        if not isinstance(solutions, list):
            return jsonify({
                "status": "error",
                "status_bool": False,
                "error": "solutions must be a list"
            }), 400
        
        if not isinstance(target, str):
            return jsonify({
                "status": "error",
                "status_bool": False,
                "error": f"target must be a string, we got {type(target).__name__}"
            }), 400
        
        if not isinstance(formula_string, str):
            return jsonify({
                "status": "error",
                "status_bool": False,
                "error": f"formula_string must be a string, we got {type(formula_string).__name__}"
            }), 400
        
        if not isinstance(sweeper, str):
            return jsonify({
                "status": "error",
                "status_bool": False,
                "error": f"sweeper must be a string, we got {type(sweeper).__name__}"
            }), 400
        
        if not isinstance(index, int):
            return jsonify({
                "status": "error",
                "status_bool": False,
                "error": f"index must be an integer, we got {type(index).__name__}"
            }), 400
        
        if not isinstance(fixed, dict):
            return jsonify({
                "status": "error",
                "status_bool": False,
                "error": f"fixed must be a dict, we got {type(fixed).__name__}"
            }), 400
        
        if not isinstance(start, (int, float)):
            return jsonify({
                "status": "error",
                "status_bool": False,
                "error": f"start must be a number, we got {type(start).__name__}"
            }), 400
        
        if not isinstance(end, (int, float)):
            return jsonify({
                "status": "error",
                "status_bool": False,
                "error": f"end must be a number, we got {type(end).__name__}"
            }), 400
        
        if not isinstance(steps, int):
            return jsonify({
                "status": "error",
                "status_bool": False,
                "error": f"steps must be an integer, we got {type(steps).__name__}"
            }), 400
        
        if target is None or target == "":
            return jsonify({
                "status": "error",
                "status_bool": False,
                "error": "target cannot be null or empty"
            }), 400
        
        if formula_string is None or formula_string == "":
            return jsonify({
                "status": "error",
                "status_bool": False,
                "error": "formula_string cannot be null or empty"
            }), 400
        
        if sweeper is None or sweeper == "":
            return jsonify({
                "status": "error",
                "status_bool": False,
                "error": "sweeper cannot be null or empty"
            }), 400
        
        if not needs_choice:
            return jsonify({
                "status": "error",
                "status_bool": False,
                "error": "needs_choice must be true"
            }), 400
        
        if len(solutions) < 2:
            return jsonify({
                "status": "error",
                "status_bool": False,
                "error": "solutions must have at least 2 items"
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
        if not sf_result["valid"]:
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
        
        cs_response = solver.choose_solution(index)
        if not cs_response["status_bool"]:
            return jsonify({
                "status": "error",
                "status_bool": False,
                "error": cs_response["error"]
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
        
        x_values = sweep_response["x_values"]
        y_values = sweep_response["y_values"]
        skipped = sweep_response["skipped"]
        
        plt.figure(figsize=(10, 6))
        plt.plot(x_values, y_values, 'b-', linewidth=2)
        plt.xlabel(sweeper, fontsize=12)
        plt.ylabel(target, fontsize=12)
        plt.title(f'{target} vs {sweeper}', fontsize=14, fontweight='bold')
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
            download_name=f'{target}_vs_{sweeper}.png'
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
