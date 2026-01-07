from solver import FormulaSolver
from flask import Flask, request, jsonify, send_file, session
from flask_cors import CORS
from io import BytesIO
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from functools import wraps
import redis
import json
import uuid

app = Flask(__name__)


app.secret_key = "daisuki-neko-chan"  
app.config['SESSION_COOKIE_HTTPONLY'] = True  # Security: prevent JavaScript access
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'  # Security: CSRF protection

CORS(app, supports_credentials=True)


r = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)

"""require specific preconditions for  run"""
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

""""helper/saver methods"""
def get_solver_from_session():
    """
    Load solver from Redis using session ID
    Returns: (solver, error_dict) - if error_dict is not None, return it as error response
    """
    solver_id = session.get("solver_id")
    if not solver_id:
        return None, {
            "status": "error",
            "status_bool": False,
            "error": "No solver session found. Call /api/set_formula first."
        }
    
    solver_json = r.get(f"solver:{solver_id}")
    if not solver_json:
        return None, {
            "status": "error",
            "status_bool": False,
            "error": "Solver session expired. Please start over with /api/set_formula."
        }
    
    try:
        solver_dict = json.loads(solver_json)
        solver = FormulaSolver.from_dict(solver_dict)
        return solver, None
    except Exception as e:
        return None, {
            "status": "error",
            "status_bool": False,
            "error": f"Failed to load solver: {str(e)}"
        }

def save_solver_to_session(solver):
    """Save solver to Redis"""
    solver_id = session.get("solver_id")
    if solver_id:
        r.set(f"solver:{solver_id}", json.dumps(solver.to_dict()))





@app.route("/api")
def api():
    return jsonify({
        "status": "api is running",
        "Available Endpoints": [
            "/api/set_formula",
            "/api/solve_for_target",
            "/api/choose_solution",
            "/api/pass_sweeper",
            "/api/verify_fixed",
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
    """
    Create a new solver session
    Expects: {"formula_string": "S = v * t"}
    Returns: {status, variables, etc.}
    """
    try:
        data = request.json
        formula_string = data['formula_string']
        
        solver = FormulaSolver()
        sf_result = solver.set_formula(formula_string)
        
        if not sf_result["status_bool"]:
            return jsonify(sf_result), 400
        
        solver_id = str(uuid.uuid4())
        r.set(f"solver:{solver_id}", json.dumps(solver.to_dict()))
        
        session["solver_id"] = solver_id
        
        #DEBUG_MODE - Remove in production
        if app.debug:
            sf_result["debug_solver_id"] = solver_id
        
        return jsonify(sf_result), 200
        
    except KeyError as e:
        return jsonify({
            "valid": False,
            "status_bool": False,
            "variables": [],
            "error": f"Missing required field: {str(e)}",
            "formula_string": ""
        }), 400
    
    except Exception as e:
        return jsonify({
            "valid": False,
            "status_bool": False,
            "variables": [],
            "error": f"Server error: {str(e)}",
            "formula_string": ""
        }), 500

@app.route("/api/solve_for_target", methods=["POST"])
@require_json
@require_body
@require_fields("target")
@require_not_null("target")
@require_types(target=str)
def solve_for_target():
    """
    Solve for a target variable
    Expects: {"target": "S"}
    Returns: {status, solutions, needs_choice, etc.}
    """
    try:
        solver, error = get_solver_from_session()
        if error:
            error.update({
                "solutions": [],
                "needs_choice": False,
                "target": None,
                "available": [],
                "required_list_str": [],
                "formula_string": "",
                "is_const": False,
                "is_one_var": False,
                "is_multi_var": False,
                "equation_type": "",
                "index": None,
                "sweeper": None,
                "fixed": {}
            })
            return jsonify(error), 400
        
        target = request.json["target"]
        sft_response = solver.solve_for_target(target)
        
        if not sft_response["status_bool"]:
            return jsonify(sft_response), 400
        
        save_solver_to_session(solver)
        
        #DEBUG_MODE - Remove in production
        if app.debug:
            sft_response["debug_solver_id"] = session.get("solver_id")
        
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
            "equation_type": "",
            "index": None,
            "sweeper": None,
            "fixed": {}
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
            "equation_type": "",
            "index": None,
            "sweeper": None,
            "fixed": {}
        }), 500


@app.route("/api/choose_solution", methods=["POST"])
@require_json
@require_body
@require_fields("index")
@require_not_null("index")
@require_types(index=int)
def choose_solution():
    """
    Choose a solution from multiple solutions
    Expects: {"index": 0}
    Returns: {status, solution, required_list_str, etc.}
    """
    try:
        solver, error = get_solver_from_session()
        if error:
            return jsonify(error), 400
        
        index = request.json["index"]
        
        if not solver.solutions_list:
            return jsonify({
                "status": "error",
                "status_bool": False,
                "solution": "",
                "error": "No multiple solutions to choose from",
                "index": index,
                "required_list_str": [],
                "formula_string": solver.formula_string or "",
                "target": solver.target_variable or "", 
                "solutions": [],
                "needs_choice": False,
                "is_const": False,
                "is_one_var": False,
                "is_multi_var": False,
                "equation_type": ""
            }), 400
        
        if index < 0 or index >= len(solver.solutions_list):
            return jsonify({
                "status": "error",
                "status_bool": False,
                "solution": "",
                "error": f"index must be between 0 and {len(solver.solutions_list) - 1}, we got {index}",
                "index": index,
                "required_list_str": solver.required_list_str or [],
                "formula_string": solver.formula_string or "",
                "target": solver.target_variable or "", 
                "solutions": solver.solutions_list_strings or [], 
                "needs_choice": False, 
                "is_const": False,
                "is_one_var": False,
                "is_multi_var": False,
                "equation_type": ""
            }), 400
        
        cs_response = solver.choose_solution(index)
        
        if not cs_response["status_bool"]:
            return jsonify(cs_response), 400
        
        cs_response["target"] = solver.target_variable or ""
        cs_response["solutions"] = solver.solutions_list_strings or []
        cs_response["needs_choice"] = False
        
        save_solver_to_session(solver)
        
        #DEBUG_MODE - Remove in production
        if app.debug:
            cs_response["debug_solver_id"] = session.get("solver_id")
        
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
            "needs_choice": False,  # ✅ Add
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
            "needs_choice": False,  # ✅ Add
            "is_const": False,
            "is_one_var": False,
            "is_multi_var": False,
            "equation_type": ""
        }), 500

        
@app.route("/api/pass_sweeper", methods=["POST"])
@require_json
@require_body
@require_fields("sweeper")
@require_not_null("sweeper")
@require_types(sweeper=str)
def pass_sweeper():
    """
    Set the sweeper variable
    Expects: {"sweeper": "t"}
    Returns: {status, is_const, is_one_var, is_multi_var, required_list_final_str, etc.}
    """
    try:
        solver, error = get_solver_from_session()
        if error:
            return jsonify(error), 400
    
        sweeper = request.json["sweeper"]
        
       
        if solver.is_const:
            return jsonify({
                "status": "error",
                "status_bool": False,
                "is_const": True,
                "is_one_var": False,
                "is_multi_var": False,
                "equation_type": "constant",
                "index": solver.index,
                "solution": solver.solved_expression_string or "",
                "solutions": solver.solutions_list_strings or [],
                "needs_choice": False,
                "target": solver.target_variable or "",
                "required_list_final_str": [],
                "required_list_str": [],
                "sweeper": sweeper,
                "error": "Cannot call pass_sweeper for constant equations. Skip to perform_sweep directly."
            }), 400
        

        ps_response = solver.pass_sweeper(sweeper)
        
        if ps_response["status"] != "success":
            return jsonify({
                "status": "error",
                "status_bool": False,
                "is_const": solver.is_const,
                "is_one_var": solver.is_one_var,
                "is_multi_var": solver.is_multi_var,
                "equation_type": ps_response.get("equation_type", ""),
                "index": solver.index,
                "solution": solver.solved_expression_string or "",
                "solutions": solver.solutions_list_strings or [],
                "needs_choice": False,
                "target": solver.target_variable or "",
                "required_list_final_str": ps_response.get("required_list_final_str", []),
                "required_list_str": solver.required_list_str or [],
                "sweeper": sweeper,
                "error": ps_response["error"]
            }), 400
        
        save_solver_to_session(solver)
        
        response = {
            "status": "success",
            "status_bool": True,
            "is_const": solver.is_const,
            "is_one_var": solver.is_one_var,
            "is_multi_var": solver.is_multi_var,
            "equation_type": ps_response["equation_type"],
            "index": solver.index,
            "solution": solver.solved_expression_string or "",
            "solutions": solver.solutions_list_strings or [],
            "needs_choice": False,
            "target": solver.target_variable or "",
            "required_list_final_str": solver.required_list_final or [],
            "required_list_str": solver.required_list_str or [],
            "sweeper": solver.sweeper, 
            "error": ""
        }


        #DEBUG_MODE - Remove in production
        if app.debug:
            response["debug_solver_id"] = session.get("solver_id")
        
        return jsonify(response), 200
        
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
@require_fields("fixed")
@require_not_null("fixed")
@require_types(fixed=dict)
def verify_fixed():
    """
    Verify and set fixed variables
    Expects: {"fixed": {"v": 10}}
    Returns: {status, is_fixed_correct, fixed, etc.}
    """
    try:
        solver, error = get_solver_from_session()
        if error:
            return jsonify(error), 400
        
        fixed = request.json["fixed"]

        vf_response = solver.verify_fixed(fixed)
        
        if vf_response["status"] != "success":
            return jsonify({
                "status": vf_response["status"],
                "status_bool": False,
                "is_const": vf_response.get("is_const", False),
                "is_one_var": solver.is_one_var,
                "is_multi_var": solver.is_multi_var,
                "equation_type": solver.equation_type or "",
                "index": solver.index,
                "solution": solver.solved_expression_string or "",
                "solutions": solver.solutions_list_strings or [],
                "needs_choice": False,
                "target": solver.target_variable or "",
                "required_list_final_str": solver.required_list_final or [],
                "required_list_str": solver.required_list_str or [],
                "sweeper": solver.sweeper,
                "is_fixed_correct": vf_response["is_fixed_correct"],
                "fixed": vf_response.get("fixed", {}),
                "error": vf_response["error"]
            }), 400
        
        save_solver_to_session(solver)

        response = {
            "status": "success",
            "status_bool": True,
            "is_const": vf_response["is_const"],
            "is_one_var": solver.is_one_var,
            "is_multi_var": solver.is_multi_var,
            "equation_type": solver.equation_type or "",
            "index": solver.index,
            "solution": solver.solved_expression_string or "",
            "solutions": solver.solutions_list_strings or [],
            "needs_choice": False,
            "target": solver.target_variable or "",
            "required_list_final_str": solver.required_list_final or [],
            "required_list_str": solver.required_list_str or [],
            "sweeper": solver.sweeper,
            "is_fixed_correct": vf_response["is_fixed_correct"],
            "fixed": vf_response["fixed"],
            "error": ""
        }
        
        #DEBUG_MODE - Remove in production
        if app.debug:
            response["debug_solver_id"] = session.get("solver_id")
        
        return jsonify(response), 200
        
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
@require_fields("start", "end", "steps")
@require_not_null("start", "end", "steps")
@require_types(start=(float, int), end=(float, int), steps=(float, int))
def perform_sweep():
    """
    Perform sweep and return plot
    Expects: {"start": 0, "end": 100, "steps": 50}
    Returns: PNG image
    """
    try:
        solver, error = get_solver_from_session()
        if error:
            return jsonify(error), 400
    
        start = request.json["start"]
        end = request.json["end"]
        steps = int(request.json["steps"])
        
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
            
        if not solver.solved_expression:
            return jsonify({
                "status": "error",
                "status_bool": False,
                "error": "No solution set. Complete previous steps first (set_formula, solve_for_target, etc.)"
            }), 400
        
        sweep_response = solver.perform_sweep(start, end, steps)
        
        if sweep_response["status"] != "success":
            return jsonify({
                "status": "error",
                "status_bool": False,
                "error": sweep_response["error"]
            }), 400
        
        save_solver_to_session(solver)
        
        x_values = sweep_response["x_values"]
        y_values = sweep_response["y_values"]
        skipped = sweep_response["skipped"]
    
        if solver.sweeper and solver.sweeper != "const":
            x_label = solver.sweeper
        else:
            x_label = "x"
    
        plt.figure(figsize=(10, 6))
        plt.plot(x_values, y_values, 'b-', linewidth=2)
        plt.xlabel(x_label, fontsize=12)
        plt.ylabel(solver.target_variable or "y", fontsize=12)
        plt.title(f'{solver.target_variable or "y"} vs {x_label}', fontsize=14, fontweight='bold')
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
            download_name=f'{solver.target_variable or "result"}_vs_{x_label}.png'
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
