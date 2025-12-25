
class Car:
    def __init__(self, brand, model, year):
        self.brand = brand
        self.model = model
        self.year = year
        
       
    
    def start(self):
        return f"the brand {self.brand} {self.model} is starting"
    
    def stop(self):
        return f"the brand {self.brand} {self.model} is stopping"
    
    def get_info(self):
        return f"{self.year} {self.brand} {self.model}"


my_car = Car("Toyota", "Camry", 2020)
print(my_car.start())
print(my_car.get_info())
print(my_car.stop())
