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
 * Generate random data for demonstration
 * @param count - Number of data points
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Array of random numbers (can include negative values)
 */
export function generateRandomData(count: number = 5, min: number = -5, max: number = 10): number[] {
	return Array.from({ length: count }, () => Math.random() * (max - min) + min);
}

