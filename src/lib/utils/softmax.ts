/**
 * Calculate softmax with temperature parameter
 * @param values - Array of input values
 * @param temperature - Temperature parameter (higher = more uniform, lower = more peaked)
 * @returns Array of softmax probabilities
 */
export function softmax(values: number[], temperature: number = 1.0): number[] {
	// Apply temperature scaling
	const scaledValues = values.map((v) => v / temperature);

	// Find max for numerical stability
	const maxVal = Math.max(...scaledValues);

	// Compute exp(x - max) for numerical stability
	const expValues = scaledValues.map((v) => Math.exp(v - maxVal));

	// Sum of exponentials
	const sumExp = expValues.reduce((acc, val) => acc + val, 0);

	// Normalize
	return expValues.map((v) => v / sumExp);
}

/**
 * Generate random data from a Gaussian (normal) distribution
 * Uses Box-Muller transform to generate normally distributed values
 * @param count - Number of data points
 * @param mean - Mean of the distribution (default: 0)
 * @param stdDev - Standard deviation of the distribution (default: 3)
 * @returns Array of random numbers from normal distribution
 */
export function generateRandomData(count: number = 5, mean: number = 0, stdDev: number = 3): number[] {
	return Array.from({ length: count }, () => {
		// Box-Muller transform for Gaussian distribution
		const u1 = Math.random();
		const u2 = Math.random();
		const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
		return z0 * stdDev + mean;
	});
}

