from solver import FormulaSolver
from flask import Flask, request, jsonify
from flask_cors import CORS


app = Flask(__name__)
CORS(app)


@app.route("/api")
def home():
    return jsonify({
        "message": "api is running",
        "Available Endpoints for now": [
            "/api/set_formula",
            "/api/solve_for_target"
        ]
    })


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
                "available": [],
                "target": None
            }), 415
        
        data = request.json
        
        if not data:
            return jsonify({
                "status": "error",
                "status_bool": False,
                "solutions": [],
                "needs_choice": False,
                "error": "Request body is required",
                "available": [],
                "target": None
            }), 400
    
        if "target" not in data:
            return jsonify({
                "status": "error",
                "status_bool": False,
                "solutions": [],
                "needs_choice": False,
                "error": "target is required",
                "available": [],
                "target": None
            }), 400
        
        
        if 'formula_string' not in data:
            return jsonify({
                "status": "error",
                "status_bool": False,
                "solutions": [],
                "needs_choice": False,
                "error": "formula_string is required",
                "available": [],
                "target": None
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
                "available": [],
                "target": None
            }), 400
     
        if not isinstance(target, str):
            return jsonify({
                "status": "error",
                "status_bool": False,
                "solutions": [],
                "needs_choice": False,
                "error": f"target must be a string, we got {type(target).__name__}",
                "available": [],
                "target": target
            }), 400
      
        if formula_string is None:
            return jsonify({
                "status": "error",
                "status_bool": False,
                "solutions": [],
                "needs_choice": False,
                "error": "formula_string cannot be null",
                "available": [],
                "target": target
            }), 400
        
        # Check formula_string type
        if not isinstance(formula_string, str):
            return jsonify({
                "status": "error",
                "status_bool": False,
                "solutions": [],
                "needs_choice": False,
                "error": f"formula_string must be a string, got {type(formula_string).__name__}",
                "available": [],
                "target": target
            }), 400
        
       
        solver = FormulaSolver()
        sf_result = solver.set_formula(formula_string)
        
        if not sf_result["valid"]:
            return jsonify({
                "status": "error",
                "status_bool": False,
                "solutions": [],
                "needs_choice": False,
                "error": sf_result["error"],
                "available": sf_result.get("variables", []),
                "target": target
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
            "available": [],
            "target": None
        }), 400
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "status_bool": False,
            "solutions": [],
            "needs_choice": False,
            "error": f"Server error: {str(e)}",
            "available": [],
            "target": None
        }), 500


if __name__ == '__main__':
    app.run(debug=True, port=5000)
