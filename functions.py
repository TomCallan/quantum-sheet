# sqaure root

def sqrt(n, i = 500):
    a = float(n) # number to get square root of
    for i in range(i): # iteration number
        n = 0.5 * (n + a / n) # update
	  # x_(n+1) = 0.5 * (x_n +a / x_n)
    return n

def _sqrt(n, i = 500):
    return lambda n: [for i in range(i): n = 0.5 * (n+a/n)]