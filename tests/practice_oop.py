def validate_keys(*required_keys):  #name, age
    def decorator(func):            
        def wrapper(*args, **kwargs): 
            data = args[0] 
            for key in required_keys:
                if key not in data:
                    print(f"Error: Missing required key: {key}")
                    return None
            return func(*args, **kwargs)
        return wrapper
    return decorator



@validate_keys('name', 'age')
def process_user(data):
    return f"User {data['name']} is {data['age']} years old"

print(process_user({'name': 'John'}))  # Missing 'age'
