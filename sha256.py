counter = {t: 0 for t in range(64)}
def M_t(t):
	counter[t] += 1

	if t < 16:
		return f"M_{t}"
	elif counter[t] > 1:
		return f"W_{t}"
	else:
		return f"\u03C3({M_t(t-2)})+\u03C3(​{M_t(t-15)})+{M_t(t-16)}+{M_t(t-7)}"

out = M_t(63)
print(out)
print(len(out))
print(counter)

import matplotlib.pyplot as plt

plt.bar(counter.keys(), counter.values())
plt.xlabel('t')
plt.ylabel('Count')
plt.title('SHA-256 M_t Function Calls')
# log scale for better visualization
plt.yscale('log')

plt.show()