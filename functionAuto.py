def f(name):
    with open('functions.txt', 'a+') as file:
        sympyName = 'sympy.'+name.lower()
        file.write('else if(functionName == "'+name+'" {\n        pythonFunctionName = "'+sympyName+'";}\n}')

'''
else if(functionName == "Sin") {
        pythonFunctionName = "sympy.sin"; 
}'''


