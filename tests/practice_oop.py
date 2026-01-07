import redis
import json
import uuid

# Connect to Redis
r = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)

# Data for 5 solvers
solvers_data = [
    {"formula": "S = v * t", "target": "S", "status": "initialized"},
    {"formula": "E = m * c^2", "target": "E", "status": "initialized"},
    {"formula": "F = m * a", "target": "F", "status": "solved"},
    {"formula": "P = V * I", "target": "P", "status": "initialized"},
    {"formula": "d = 0.5 * g * t^2", "target": "d", "status": "needs_choice"}
]

# Step 1 - Create and store all 5 solvers
solver_ids = []
solver_keys = {}

for i in range(len(solvers_data)):
    solver_id = str(uuid.uuid4())
    solver_ids.append(solver_id)  # ✓ FIXED: added solver_id
    solver_json_string = json.dumps(solvers_data[i])
    key = f"solver:{solver_id}"
    solver_keys[i] = key
    r.set(key, solver_json_string)
    print(f"✓ Stored solver {i+1} with ID: {solver_id}")  # ✓ ADDED

# Step 2 - Retrieve solver #3 by its ID
key_3 = solver_keys[2]
solver_3 = r.get(key_3)
solver_3_dict = json.loads(solver_3)  # ✓ ADDED
print(f"\nRetrieved solver #3: Formula: {solver_3_dict['formula']}, Status: {solver_3_dict['status']}")  # ✓ ADDED

# Step 3 - Update solver #2's status to "completed"
key_2 = solver_keys[1]
solver_2 = r.get(key_2)
retreived_solver_2 = json.loads(solver_2) 
retreived_solver_2["status"] = "completed"
solver_2 = json.dumps(retreived_solver_2)
r.set(key_2, solver_2)
print(f"\n✓ Updated solver #2 status to: {retreived_solver_2['status']}")  # ✓ ADDED

# Step 4 - Count all solvers
solvers_keys = r.keys("solver:*")  # ✓ FIXED: removed 's'
print(f"\nTotal solvers in Redis: {len(solvers_keys)}")

# Step 5 - Delete only completed/solved solvers
print("\nDeleting completed/solved solvers...")
deleted_count = 0

for key in solvers_keys:
    solver_data = json.loads(r.get(key))
    status = solver_data["status"]
    
    if status == "completed" or status == "solved":
        r.delete(key)
        print(f"✗ Deleted {key.split(':')[1][:8]}... (status: {status})")
        deleted_count += 1

remaining = r.keys("solver:*")
print(f"\nFinal count: {len(remaining)} solvers remaining")
