# tests/test_solver.py
import sys
import os
backend_path = os.path.join(os.path.dirname(__file__), '..', 'backend')
sys.path.insert(0, backend_path)
from solver import FormulaSolver #type: ignore
import matplotlib.pyplot as plt




#testing as front end immitation with single state and should work exactly as terminal interaction:

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
            required_list_final_str = ps_response["required_list_final_str"]
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
                        
            except Exception as e:
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