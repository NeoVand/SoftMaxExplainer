<script lang="ts">
	import { fade } from 'svelte/transition';
	import BarChart from '$lib/components/BarChart.svelte';
	import Histogram from '$lib/components/Histogram.svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import InfoModal from '$lib/components/InfoModal.svelte';
	import LatexEquation from '$lib/components/LatexEquation.svelte';
	import { softmax, generateRandomData } from '$lib/utils/softmax';
	import { onMount } from 'svelte';

	// State
	let fullDataset = $state<number[]>([]); // Always store 100 points
	let temperature = $state(1.0);
	let numDataPoints = $state(50);
	let showInfo = $state(false);
	let generationKey = $state(0); // Track when we actually regenerate
	let isSorted = $state(false);

	// Cache for sorted data at each length to avoid re-sorting
	let sortCache = $state<Map<number, number[]>>(new Map());

	// Derived - FIRST slice to get N points, THEN optionally sort them
	const slicedData = $derived(fullDataset.slice(0, numDataPoints));
	
	const displayedData = $derived.by(() => {
		if (!isSorted) return slicedData;
		
		// Check cache first
		const cacheKey = generationKey * 1000 + numDataPoints; // Unique key per generation and count
		if (sortCache.has(cacheKey)) {
			return sortCache.get(cacheKey)!;
		}
		
		// Sort and cache
		const sorted = [...slicedData].sort((a, b) => b - a);
		sortCache.set(cacheKey, sorted);
		return sorted;
	});
	
	// Derived - softmax is always computed from displayed data and temperature
	const softmaxData = $derived(displayedData.length > 0 ? softmax(displayedData, temperature) : []);
	
	// Derived display values
	const temperatureDisplay = $derived(temperature.toFixed(2));
	const temperaturePercent = $derived(((temperature - 0.1) / 4.9) * 100);
	const dataPointsPercent = $derived(((numDataPoints - 2) / 98) * 100);

	// Generate new data - always generate 100 points
	function regenerateData() {
		fullDataset = generateRandomData(100, -5, 10);
		sortCache.clear(); // Clear cache on new data generation
		generationKey++; // Increment only on actual regeneration
	}

	onMount(() => {
		regenerateData();
	});
</script>

<svelte:head>
	<title>SoftMaxExplainer - Interactive Visualization</title>
	<meta
		name="description"
		content="Interactive visualization of the softmax function with temperature control"
	/>
</svelte:head>

<div class="flex h-screen overflow-hidden bg-white dark:bg-gray-900">
	{#if fullDataset.length > 0}
		<div class="flex w-full" in:fade={{ duration: 300 }}>
			<!-- Sidebar -->
			<aside
				class="flex w-80 flex-shrink-0 flex-col bg-gray-50 pb-8 pl-8 pr-0 pt-8 dark:bg-gray-900"
			>
				<!-- Header -->
				<div class="mb-6">
					<div class="mb-2 flex items-center gap-2">
						<div
							class="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-emerald-500"
						>
							<!-- Bell curve / Normal distribution icon -->
							<svg class="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M3 20c2-4 4-8 4.5-10C8 8 9 6 12 6s4 2 4.5 4c.5 2 2.5 6 4.5 10"
								/>
							</svg>
						</div>
						<h1 class="text-xl font-bold text-gray-900 dark:text-gray-100">SoftMaxExplainer</h1>
					</div>
					<p class="text-sm text-gray-600 dark:text-gray-400">
						Interactive visualization with temperature control
					</p>
				</div>

				<!-- Controls -->
				<div class="mb-6 space-y-5">
					<div>
						<div class="mb-2 flex items-center justify-between">
							<label for="temperature" class="text-sm font-medium text-gray-700 dark:text-gray-300">
								Temperature (τ)
							</label>
							<span
								class="rounded-md bg-gradient-to-r from-blue-500 to-emerald-500 px-2.5 py-1 font-mono text-xs font-semibold text-white shadow-sm"
							>
								{temperatureDisplay}
							</span>
						</div>
						<input
							id="temperature"
							type="range"
							min="0.1"
							max="5"
							step="0.1"
							bind:value={temperature}
							class="h-2 w-full cursor-pointer appearance-none rounded-lg"
							style="--value: {temperaturePercent}%"
						/>
						<div class="mt-1.5 flex justify-between text-xs text-gray-500 dark:text-gray-500">
							<span>Sharp</span>
							<span>Uniform</span>
						</div>
					</div>

					<div>
						<div class="mb-2 flex items-center justify-between">
							<label for="datapoints" class="text-sm font-medium text-gray-700 dark:text-gray-300">
								Data Points
							</label>
							<span
								class="rounded-md bg-gradient-to-r from-blue-500 to-emerald-500 px-2.5 py-1 font-mono text-xs font-semibold text-white shadow-sm"
							>
								{numDataPoints}
							</span>
						</div>
						<input
							id="datapoints"
							type="range"
							min="2"
							max="100"
							step="1"
							bind:value={numDataPoints}
							class="h-2 w-full cursor-pointer appearance-none rounded-lg"
							style="--value: {dataPointsPercent}%"
						/>
						<div class="mt-1.5 flex justify-between text-xs text-gray-500 dark:text-gray-500">
							<span>2</span>
							<span>100</span>
						</div>
					</div>

					<!-- Sorted Checkbox -->
					<div class="flex items-center gap-2.5 rounded-lg bg-white p-3 shadow-sm dark:bg-gray-800">
						<input
							id="sorted"
							type="checkbox"
							bind:checked={isSorted}
							class="h-4 w-4 cursor-pointer rounded border-gray-300 text-emerald-600 focus:ring-2 focus:ring-emerald-500 dark:border-gray-600 dark:bg-gray-700 dark:checked:bg-emerald-500"
						/>
						<label for="sorted" class="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300">
							Sorted (Descending)
						</label>
					</div>

					<button
						onclick={regenerateData}
						class="w-full rounded-lg bg-gradient-to-r from-blue-500 to-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md hover:scale-[1.01] active:scale-[0.99]"
					>
						<div class="flex items-center justify-center gap-2">
							<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
								/>
							</svg>
							Regenerate
						</div>
					</button>
				</div>

				<!-- Equation Section -->
				<div class="mt-auto">
					<h2 class="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">The Equation</h2>
					<div class="rounded-lg bg-white p-5 shadow-sm dark:bg-gray-800">
						<div class="flex flex-col items-center">
							<LatexEquation />
							<p class="mt-3 text-xs text-gray-500 dark:text-gray-400">
								Converts values to probabilities
							</p>
						</div>
					</div>
					<div class="mt-3 space-y-1.5 text-xs text-gray-600 dark:text-gray-400">
						<p>• Higher τ → more uniform</p>
						<p>• Lower τ → more peaked</p>
						<p>• All outputs sum to 1.0</p>
					</div>

					<!-- Action Buttons -->
					<div class="mt-4 flex gap-2">
						<button
							onclick={() => (showInfo = true)}
							class="flex-1 rounded-lg bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
						>
							Learn More
						</button>
						<ThemeToggle />
					</div>
				</div>
			</aside>

			<!-- Main Content Area -->
			<main class="flex flex-1 flex-col overflow-hidden bg-gray-50 dark:bg-gray-900">
				<!-- Charts Grid -->
				<div class="grid h-full grid-rows-2 gap-8 p-8">
					<!-- Top Row: Input Data -->
					<div class="flex gap-8">
						<div class="flex-1 overflow-hidden rounded-xl bg-white p-8 shadow-lg dark:bg-black/40">
							<BarChart data={displayedData} title="Input Data (Logits)" color="blue" generationKey={generationKey} sortKey={isSorted ? 1 : 0} />
						</div>
						<div class="aspect-square w-72 overflow-hidden rounded-xl bg-white p-8 shadow-lg dark:bg-black/40">
							<Histogram data={displayedData} title="Input Distribution" color="blue" bins={10} />
						</div>
					</div>

					<!-- Bottom Row: Softmax Output -->
					<div class="flex gap-8">
						<div class="flex-1 overflow-hidden rounded-xl bg-white p-8 shadow-lg dark:bg-black/40">
							<BarChart data={softmaxData} title="Softmax Output (Probabilities)" color="emerald" isProbability={true} generationKey={generationKey} sortKey={isSorted ? 1 : 0} />
						</div>
						<div class="aspect-square w-72 overflow-hidden rounded-xl bg-white p-8 shadow-lg dark:bg-black/40">
							<Histogram data={softmaxData} title="Output Distribution" color="emerald" bins={10} />
						</div>
					</div>
				</div>
			</main>
		</div>
	{/if}
</div>

<!-- Info Modal -->
<InfoModal bind:open={showInfo} onclose={() => (showInfo = false)} />

<style>
	/* Temperature slider with thermal gradient */
	#temperature {
		background: linear-gradient(
			to right,
			rgb(59, 130, 246) 0%,
			rgb(16, 185, 129) calc(var(--value) * 0.5),
			rgb(251, 191, 36) calc(var(--value) * 0.75),
			rgb(239, 68, 68) var(--value),
			rgb(229, 231, 235) var(--value),
			rgb(229, 231, 235) 100%
		);
	}

	:global(.dark) #temperature {
		background: linear-gradient(
			to right,
			rgb(59, 130, 246) 0%,
			rgb(16, 185, 129) calc(var(--value) * 0.5),
			rgb(251, 191, 36) calc(var(--value) * 0.75),
			rgb(239, 68, 68) var(--value),
			rgb(55, 65, 81) var(--value),
			rgb(55, 65, 81) 100%
		);
	}

	/* Temperature slider thumb */
	#temperature::-webkit-slider-thumb {
		appearance: none;
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background: linear-gradient(135deg, rgb(59, 130, 246), rgb(16, 185, 129));
		cursor: pointer;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
		border: 2px solid white;
		transition: all 0.15s ease;
	}

	#temperature::-webkit-slider-thumb:hover {
		transform: scale(1.2);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
	}

	#temperature::-moz-range-thumb {
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background: linear-gradient(135deg, rgb(59, 130, 246), rgb(16, 185, 129));
		cursor: pointer;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
		border: 2px solid white;
		transition: all 0.15s ease;
	}

	#temperature::-moz-range-thumb:hover {
		transform: scale(1.2);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
	}

	/* Data points slider - matching gradient */
	#datapoints {
		background: linear-gradient(
			to right,
			rgb(59, 130, 246) 0%,
			rgb(16, 185, 129) var(--value),
			rgb(229, 231, 235) var(--value),
			rgb(229, 231, 235) 100%
		);
	}

	:global(.dark) #datapoints {
		background: linear-gradient(
			to right,
			rgb(59, 130, 246) 0%,
			rgb(16, 185, 129) var(--value),
			rgb(55, 65, 81) var(--value),
			rgb(55, 65, 81) 100%
		);
	}

	/* Data points slider thumb */
	#datapoints::-webkit-slider-thumb {
		appearance: none;
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background: linear-gradient(135deg, rgb(59, 130, 246), rgb(16, 185, 129));
		cursor: pointer;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
		border: 2px solid white;
		transition: all 0.15s ease;
	}

	#datapoints::-webkit-slider-thumb:hover {
		transform: scale(1.2);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
	}

	#datapoints::-moz-range-thumb {
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background: linear-gradient(135deg, rgb(59, 130, 246), rgb(16, 185, 129));
		cursor: pointer;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
		border: 2px solid white;
		transition: all 0.15s ease;
	}

	#datapoints::-moz-range-thumb:hover {
		transform: scale(1.2);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
	}
</style>
