<script lang="ts">
	import { fade } from 'svelte/transition';
	import BarChart from '$lib/components/BarChart.svelte';
	import Histogram from '$lib/components/Histogram.svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import InfoModal from '$lib/components/InfoModal.svelte';
	import LatexEquation from '$lib/components/LatexEquation.svelte';
	import { softmax, generateRandomData } from '$lib/utils/softmax';
	import { theme } from '$lib/stores/theme.svelte';
	import { onMount } from 'svelte';

	// State
	let fullDataset = $state<number[]>([]); // Always store 1000 points
	let temperature = $state(1.0);
	let numDataPoints = $state(500);
	let mean = $state(0);
	let stdDev = $state(1);

	// Default values for reset
	const DEFAULT_TEMP = 1.0;
	const DEFAULT_DATA_POINTS = 500;
	const DEFAULT_MEAN = 0;
	const DEFAULT_STD_DEV = 1;
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
	
	// Dynamic temperature color - interpolate from blue (cold) to red (hot)
	const temperatureColor = $derived(() => {
		const t = (temperature - 0.1) / 4.9; // 0 to 1
		const r = Math.round(59 + (239 - 59) * t);
		const g = Math.round(130 - 130 * t);
		const b = Math.round(246 - 178 * t);
		return `rgb(${r}, ${g}, ${b})`;
	});
	const dataPointsPercent = $derived(((numDataPoints - 2) / 998) * 100);
	const meanPercent = $derived(((mean + 2) / 4) * 100);
	const stdDevPercent = $derived((stdDev / 2) * 100);
	
	// Dynamic data points color - blue → green → yellow → red
	const dataPointsColor = $derived(() => {
		if (numDataPoints <= 250) {
			// Blue to Green (2 to 250)
			const t = (numDataPoints - 2) / 248; // 0 to 1
			const r = Math.round(59 - (59 - 16) * t);
			const g = Math.round(130 + (185 - 130) * t);
			const b = Math.round(246 - (246 - 129) * t);
			return `rgb(${r}, ${g}, ${b})`;
		} else if (numDataPoints <= 500) {
			// Green to Yellow (250 to 500)
			const t = (numDataPoints - 250) / 250; // 0 to 1
			const r = Math.round(16 + (234 - 16) * t);
			const g = Math.round(185 - (185 - 179) * t);
			const b = Math.round(129 - (129 - 60) * t);
			return `rgb(${r}, ${g}, ${b})`;
		} else {
			// Yellow to Red (500 to 1000)
			const t = (numDataPoints - 500) / 500; // 0 to 1
			const r = Math.round(234 + (239 - 234) * t);
			const g = Math.round(179 - (179 - 68) * t);
			const b = Math.round(60 - 60 * t);
			return `rgb(${r}, ${g}, ${b})`;
		}
	});
	
	// Dynamic std dev color - blue (0) → green (1) → orange (2)
	const stdDevColor = $derived(() => {
		if (stdDev <= 1) {
			// First half: Blue to Green (0 to 1)
			const t = stdDev; // 0 to 1
			const r = Math.round(59 - (59 - 16) * t);
			const g = Math.round(130 + (185 - 130) * t);
			const b = Math.round(246 - (246 - 129) * t);
			return `rgb(${r}, ${g}, ${b})`;
		} else {
			// Second half: Green to Orange (1 to 2)
			const t = (stdDev - 1); // 0 to 1
			const r = Math.round(16 + (251 - 16) * t);
			const g = Math.round(185 - (185 - 146) * t);
			const b = Math.round(129 - (129 - 60) * t);
			return `rgb(${r}, ${g}, ${b})`;
		}
	});
	
	// Dynamic mean color - gray at 0, red for negative, blue for positive
	const meanColor = $derived(() => {
		if (mean === 0) return 'rgb(156, 163, 175)'; // gray
		
		if (mean < 0) {
			// Interpolate from gray to red as we go more negative
			const t = Math.abs(mean) / 2; // 0 to 1
			const r = Math.round(156 + (239 - 156) * t);
			const g = Math.round(163 - (163 - 68) * t);
			const b = Math.round(175 - (175 - 68) * t);
			return `rgb(${r}, ${g}, ${b})`;
		} else {
			// Interpolate from gray to blue as we go more positive
			const t = mean / 2; // 0 to 1
			const r = Math.round(156 - (156 - 59) * t);
			const g = Math.round(163 - (163 - 130) * t);
			const b = Math.round(175 + (246 - 175) * t);
			return `rgb(${r}, ${g}, ${b})`;
		}
	});
	
	// Adaptive bin count using square root rule with bounds
	const adaptiveBins = $derived(
		Math.min(Math.max(Math.ceil(Math.sqrt(displayedData.length)), 8), 30)
	);

	// Generate new data - always generate 1000 points from Gaussian distribution
	function regenerateData() {
		fullDataset = generateRandomData(1000, mean, stdDev);
		sortCache.clear(); // Clear cache on new data generation
		generationKey++; // Increment only on actual regeneration
	}

	// Track previous values to detect actual changes
	let prevMean = $state(0);
	let prevStdDev = $state(1);
	
	// Watch for changes to mean or stdDev and regenerate
	$effect(() => {
		if (fullDataset.length > 0 && (mean !== prevMean || stdDev !== prevStdDev)) {
			prevMean = mean;
			prevStdDev = stdDev;
			regenerateData();
		}
	});

	onMount(async () => {
		regenerateData();
		
		// Render f(x) icon with KaTeX
		const katex = await import('katex');
		const iconElement = document.querySelector('.equation-icon') as HTMLElement;
		if (iconElement) {
			katex.default.render('f(x)', iconElement, {
				displayMode: false,
				throwOnError: false
			});
		}
	});
</script>

<svelte:head>
	<title>SoftMax Explainer - Interactive Visualization</title>
	<meta
		name="description"
		content="Interactive visualization of the softmax function with temperature control"
	/>
</svelte:head>

<div class="flex h-screen overflow-hidden" style="background: {theme.current === 'dark' ? 'rgb(15, 23, 30)' : 'linear-gradient(135deg, rgb(215, 238, 248), rgb(220, 242, 238))'}">
	{#if fullDataset.length > 0}
		<div class="flex h-full w-full gap-6 p-6" in:fade={{ duration: 300 }}>
			<!-- Sidebar -->
			<aside
				class="flex w-80 flex-shrink-0 flex-col"
			>
				<div class="flex h-full flex-col overflow-y-auto rounded-xl bg-white p-5 dark:bg-[rgb(25,35,45)]">
					<!-- Header -->
					<div class="mb-4">
					<div class="mb-2 flex items-center gap-2">
						<div class="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-700/50">
							<!-- Bell curve with rainbow gradient -->
							<svg class="h-6 w-6" viewBox="0 0 24 24" fill="none">
								<defs>
									<linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
										<stop offset="0%" style="stop-color: rgb(59, 130, 246)"></stop>
										<stop offset="25%" style="stop-color: rgb(16, 185, 129)"></stop>
										<stop offset="50%" style="stop-color: rgb(234, 179, 60)"></stop>
										<stop offset="75%" style="stop-color: rgb(251, 146, 60)"></stop>
										<stop offset="100%" style="stop-color: rgb(239, 68, 68)"></stop>
									</linearGradient>
								</defs>
								<path
									d="M3 20c2-4 4-8 4.5-10C8 8 9 6 12 6s4 2 4.5 4c.5 2 2.5 6 4.5 10"
									stroke="url(#logo-gradient)"
									stroke-width="2.5"
									stroke-linecap="round"
									stroke-linejoin="round"
								/>
							</svg>
						</div>
						<h1 class="text-lg font-bold text-gray-900 dark:text-gray-100">SoftMax Explainer</h1>
					</div>
						<p class="text-xs text-gray-600 dark:text-gray-400">
							Explore and Understand SoftMax
						</p>
					</div>

				<!-- Controls -->
				<div class="mb-4 space-y-3">
					<div>
						<div class="mb-1.5 flex items-center justify-between">
							<label for="datapoints" class="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
								<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"></path>
								</svg>
								Data Points
							</label>
							<div class="flex items-center gap-1.5">
								<span class="rounded border border-gray-300 bg-gray-50 px-2 py-0.5 font-mono text-xs font-semibold text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100">
									{numDataPoints}
								</span>
								<button
									onclick={() => numDataPoints = DEFAULT_DATA_POINTS}
									class="flex h-[22px] w-6 items-center justify-center rounded border border-gray-300 bg-gray-50 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600"
									aria-label="Reset data points"
								>
									<svg class="h-3.5 w-3.5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
									</svg>
								</button>
							</div>
						</div>
						<input
							id="datapoints"
							type="range"
							min="2"
							max="1000"
							step="1"
							bind:value={numDataPoints}
							class="h-2 w-full cursor-pointer appearance-none rounded-lg"
							style="--value: {dataPointsPercent}%; --datapoints-color: {dataPointsColor()}"
						/>
						<div class="mt-1.5 flex justify-between text-xs text-gray-500 dark:text-gray-500">
							<span>2</span>
							<span>1000</span>
						</div>
					</div>

					<div>
						<div class="mb-1.5 flex items-center justify-between">
							<label for="mean" class="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
								<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<circle cx="12" cy="12" r="8" stroke-width="2"></circle>
									<circle cx="12" cy="12" r="2" fill="currentColor"></circle>
								</svg>
								Mean (μ)
							</label>
							<div class="flex items-center gap-1.5">
								<span class="rounded border border-gray-300 bg-gray-50 px-2 py-0.5 font-mono text-xs font-semibold text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100">
									{mean.toFixed(2)}
								</span>
								<button
									onclick={() => mean = DEFAULT_MEAN}
									class="flex h-[22px] w-6 items-center justify-center rounded border border-gray-300 bg-gray-50 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600"
									aria-label="Reset mean"
								>
									<svg class="h-3.5 w-3.5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
									</svg>
								</button>
							</div>
						</div>
						<input
							id="mean"
							type="range"
							min="-2"
							max="2"
							step="0.05"
							bind:value={mean}
							class="h-2 w-full cursor-pointer appearance-none rounded-lg"
							style="--value: {meanPercent}%; --mean-color: {meanColor()}"
						/>
						<div class="mt-1.5 flex justify-between text-xs text-gray-500 dark:text-gray-500">
							<span>-2</span>
							<span>2</span>
						</div>
					</div>

					<div>
						<div class="mb-1.5 flex items-center justify-between">
							<label for="stddev" class="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
								<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 12h16M4 12l3-3m-3 3l3 3m13-3l-3-3m3 3l-3 3"></path>
								</svg>
								Standard Deviation
							</label>
							<div class="flex items-center gap-1.5">
								<span class="rounded border border-gray-300 bg-gray-50 px-2 py-0.5 font-mono text-xs font-semibold text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100">
									{stdDev.toFixed(2)}
								</span>
								<button
									onclick={() => stdDev = DEFAULT_STD_DEV}
									class="flex h-[22px] w-6 items-center justify-center rounded border border-gray-300 bg-gray-50 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600"
									aria-label="Reset standard deviation"
								>
									<svg class="h-3.5 w-3.5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
									</svg>
								</button>
							</div>
						</div>
						<input
							id="stddev"
							type="range"
							min="0"
							max="2"
							step="0.01"
							bind:value={stdDev}
							class="h-2 w-full cursor-pointer appearance-none rounded-lg"
							style="--value: {stdDevPercent}%; --stddev-color: {stdDevColor()}"
						/>
						<div class="mt-1.5 flex justify-between text-xs text-gray-500 dark:text-gray-500">
							<span>0</span>
							<span>2</span>
						</div>
					</div>

					<!-- Sorted & Resample -->
					<div class="grid grid-cols-2 gap-2">
						<button
							onclick={() => isSorted = !isSorted}
							class="flex items-center justify-between gap-1.5 rounded-lg bg-gray-100 p-2.5 transition-colors hover:bg-gray-200 dark:bg-gray-700/50 dark:hover:bg-gray-600/50"
						>
							<div class="flex items-center gap-1.5">
								<svg class="h-4 w-4 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4"></path>
								</svg>
								<span class="text-xs font-medium text-gray-700 dark:text-gray-300">Sorted</span>
							</div>
							<div class="relative flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-all" class:bg-gradient-to-r={isSorted} class:from-blue-500={isSorted} class:to-emerald-500={isSorted} class:bg-gray-300={!isSorted} class:dark:bg-gray-600={!isSorted}>
								<div class="h-4 w-4 rounded-full bg-white shadow-md transition-transform" class:translate-x-4={isSorted} class:translate-x-0.5={!isSorted}></div>
							</div>
						</button>
						<button
							onclick={regenerateData}
							class="flex items-center justify-center gap-1.5 rounded-lg bg-gray-100 p-2.5 transition-colors hover:bg-gray-200 dark:bg-gray-700/50 dark:hover:bg-gray-600/50"
							aria-label="Resample data"
						>
							<svg class="h-4 w-4 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
							</svg>
							<span class="text-xs font-medium text-gray-700 dark:text-gray-300">Resample</span>
						</button>
					</div>
				</div>

				<!-- Equation Section -->
				<div class="mt-4">
					<h2 class="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
						<span class="equation-icon"></span>
						The Equation
					</h2>
					<button 
						onclick={() => (showInfo = true)}
						class="w-full cursor-pointer rounded-lg bg-gray-50 p-3 transition-colors hover:bg-gray-100 dark:bg-gray-700/50 dark:hover:bg-gray-600/50"
					>
						<LatexEquation />
					</button>

					<!-- Temperature Control -->
					<div class="mt-3">
						<div class="mb-1.5 flex items-center justify-between">
							<label for="temperature" class="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
								<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
									<path stroke-linecap="round" stroke-linejoin="round" d="M3 12a9 9 0 0118 0M6 12a6 6 0 0112 0M12 12v6"></path>
								</svg>
								Temperature (τ)
							</label>
							<div class="flex items-center gap-1.5">
								<span class="rounded border border-gray-300 bg-gray-50 px-2 py-0.5 font-mono text-xs font-semibold text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100">
									{temperatureDisplay}
								</span>
								<button
									onclick={() => temperature = DEFAULT_TEMP}
									class="flex h-[22px] w-6 items-center justify-center rounded border border-gray-300 bg-gray-50 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600"
									aria-label="Reset temperature"
								>
									<svg class="h-3.5 w-3.5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
									</svg>
								</button>
							</div>
						</div>
						<input
							id="temperature"
							type="range"
							min="0.1"
							max="5"
							step="0.1"
							bind:value={temperature}
							class="h-2 w-full cursor-pointer appearance-none rounded-lg"
							style="--value: {temperaturePercent}%; --temp-color: {temperatureColor()}"
						/>
						<div class="mt-1.5 flex justify-between text-xs text-gray-500 dark:text-gray-500">
							<span>Sharp</span>
							<span>Uniform</span>
						</div>
					</div>

					<!-- Action Buttons -->
					<div class="mt-3 flex gap-2">
						<button
							onclick={() => (showInfo = true)}
							class="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 transition-all hover:bg-gray-200 dark:bg-gray-700/50 dark:text-gray-300 dark:hover:bg-gray-600/50"
						>
							<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
							</svg>
							Learn More
						</button>
						<ThemeToggle />
					</div>
				</div>
				</div>
			</aside>

			<!-- Main Content Area -->
			<main class="flex flex-1 flex-col">
				<!-- Charts Grid -->
				<div class="grid h-full grid-rows-2 gap-6">
					<!-- Top Row: Input Data -->
					<div class="flex gap-6">
						<div class="flex-1 overflow-hidden rounded-xl bg-white p-8 dark:bg-[rgb(25,35,45)]">
							<BarChart data={displayedData} title="Input Data (Logits)" color="blue" generationKey={generationKey} sortKey={isSorted ? 1 : 0} />
						</div>
						<div class="aspect-square w-72 overflow-hidden rounded-xl bg-white p-8 dark:bg-[rgb(25,35,45)]">
							<Histogram data={displayedData} title="Input Distribution" color="blue" bins={adaptiveBins} isProbability={false} />
						</div>
					</div>

					<!-- Bottom Row: Softmax Output -->
					<div class="flex gap-6">
						<div class="flex-1 overflow-hidden rounded-xl bg-white p-8 dark:bg-[rgb(25,35,45)]">
							<BarChart data={softmaxData} title="Softmax Output (Probabilities)" color="emerald" isProbability={true} generationKey={generationKey} sortKey={isSorted ? 1 : 0} />
						</div>
						<div class="aspect-square w-72 overflow-hidden rounded-xl bg-white p-8 dark:bg-[rgb(25,35,45)]">
							<Histogram data={softmaxData} title="Output Distribution" color="emerald" bins={adaptiveBins} isProbability={true} />
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
	/* Temperature slider - filled portion changes color based on temperature */
	#temperature {
		background: linear-gradient(
			to right,
			var(--temp-color) 0%,
			var(--temp-color) var(--value),
			rgb(229, 231, 235) var(--value),
			rgb(229, 231, 235) 100%
		);
	}

	:global(.dark) #temperature {
		background: linear-gradient(
			to right,
			var(--temp-color) 0%,
			var(--temp-color) var(--value),
			rgb(55, 65, 81) var(--value),
			rgb(55, 65, 81) 100%
		);
	}

	/* Temperature slider thumb - color changes with temperature */
	#temperature::-webkit-slider-thumb {
		appearance: none;
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background: var(--temp-color);
		cursor: pointer;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
		border: 2px solid rgba(255, 255, 255, 0.9);
		transition: all 0.15s ease;
	}

	:global(.dark) #temperature::-webkit-slider-thumb {
		border: 2px solid rgba(0, 0, 0, 0.4);
	}

	#temperature::-webkit-slider-thumb:hover {
		transform: scale(1.2);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
	}

	#temperature::-moz-range-thumb {
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background: var(--temp-color);
		cursor: pointer;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
		border: 2px solid rgba(255, 255, 255, 0.9);
		transition: all 0.15s ease;
	}

	:global(.dark) #temperature::-moz-range-thumb {
		border: 2px solid rgba(0, 0, 0, 0.4);
	}

	#temperature::-moz-range-thumb:hover {
		transform: scale(1.2);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
	}

	/* Data points slider - filled portion matches data points color */
	#datapoints {
		background: linear-gradient(
			to right,
			var(--datapoints-color) 0%,
			var(--datapoints-color) var(--value),
			rgb(229, 231, 235) var(--value),
			rgb(229, 231, 235) 100%
		);
	}

	:global(.dark) #datapoints {
		background: linear-gradient(
			to right,
			var(--datapoints-color) 0%,
			var(--datapoints-color) var(--value),
			rgb(55, 65, 81) var(--value),
			rgb(55, 65, 81) 100%
		);
	}

	/* Data points slider thumb - color changes with value */
	#datapoints::-webkit-slider-thumb {
		appearance: none;
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background: var(--datapoints-color);
		cursor: pointer;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
		border: 2px solid rgba(255, 255, 255, 0.9);
		transition: all 0.15s ease;
	}

	:global(.dark) #datapoints::-webkit-slider-thumb {
		border: 2px solid rgba(0, 0, 0, 0.4);
	}

	#datapoints::-webkit-slider-thumb:hover {
		transform: scale(1.2);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
	}

	#datapoints::-moz-range-thumb {
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background: var(--datapoints-color);
		cursor: pointer;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
		border: 2px solid rgba(255, 255, 255, 0.9);
		transition: all 0.15s ease;
	}

	:global(.dark) #datapoints::-moz-range-thumb {
		border: 2px solid rgba(0, 0, 0, 0.4);
	}

	#datapoints::-moz-range-thumb:hover {
		transform: scale(1.2);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
	}

	/* Mean slider thumb - color changes with value */
	#mean::-webkit-slider-thumb {
		appearance: none;
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background: var(--mean-color);
		cursor: pointer;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
		border: 2px solid rgba(255, 255, 255, 0.9);
		transition: all 0.15s ease;
	}

	:global(.dark) #mean::-webkit-slider-thumb {
		border: 2px solid rgba(0, 0, 0, 0.4);
	}

	#mean::-moz-range-thumb {
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background: var(--mean-color);
		cursor: pointer;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
		border: 2px solid rgba(255, 255, 255, 0.9);
		transition: all 0.15s ease;
	}

	:global(.dark) #mean::-moz-range-thumb {
		border: 2px solid rgba(0, 0, 0, 0.4);
	}

	/* Mean slider track - filled portion matches mean color */
	#mean {
		background: linear-gradient(
			to right,
			var(--mean-color) 0%,
			var(--mean-color) var(--value),
			rgb(229, 231, 235) var(--value),
			rgb(229, 231, 235) 100%
		);
	}

	:global(.dark) #mean {
		background: linear-gradient(
			to right,
			var(--mean-color) 0%,
			var(--mean-color) var(--value),
			rgb(55, 65, 81) var(--value),
			rgb(55, 65, 81) 100%
		);
	}

	/* Standard deviation slider thumb - color changes with value */
	#stddev::-webkit-slider-thumb {
		appearance: none;
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background: var(--stddev-color);
		cursor: pointer;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
		border: 2px solid rgba(255, 255, 255, 0.9);
		transition: all 0.15s ease;
	}

	:global(.dark) #stddev::-webkit-slider-thumb {
		border: 2px solid rgba(0, 0, 0, 0.4);
	}

	#stddev::-moz-range-thumb {
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background: var(--stddev-color);
		cursor: pointer;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
		border: 2px solid rgba(255, 255, 255, 0.9);
		transition: all 0.15s ease;
	}

	:global(.dark) #stddev::-moz-range-thumb {
		border: 2px solid rgba(0, 0, 0, 0.4);
	}

	/* Standard deviation slider track - filled portion matches stddev color */
	#stddev {
		background: linear-gradient(
			to right,
			var(--stddev-color) 0%,
			var(--stddev-color) var(--value),
			rgb(229, 231, 235) var(--value),
			rgb(229, 231, 235) 100%
		);
	}

	:global(.dark) #stddev {
		background: linear-gradient(
			to right,
			var(--stddev-color) 0%,
			var(--stddev-color) var(--value),
			rgb(55, 65, 81) var(--value),
			rgb(55, 65, 81) 100%
		);
	}

	/* Equation icon styling */
	.equation-icon :global(.katex) {
		font-size: 1.1em;
		color: currentColor;
	}

	/* Minimal scrollbar for sidebar - only visible on hover */
	aside .overflow-y-auto {
		scrollbar-width: thin;
		scrollbar-color: transparent transparent;
	}

	aside .overflow-y-auto:hover {
		scrollbar-color: rgb(209, 213, 219) transparent;
	}

	aside .overflow-y-auto::-webkit-scrollbar {
		width: 6px;
	}

	aside .overflow-y-auto::-webkit-scrollbar-track {
		background: transparent;
	}

	aside .overflow-y-auto::-webkit-scrollbar-thumb {
		background: transparent;
		border-radius: 3px;
	}

	aside .overflow-y-auto:hover::-webkit-scrollbar-thumb {
		background: rgb(209, 213, 219);
	}

	aside .overflow-y-auto::-webkit-scrollbar-thumb:hover {
		background: rgb(156, 163, 175);
	}

	/* Dark mode */
	:global(.dark) aside .overflow-y-auto:hover {
		scrollbar-color: rgb(75, 85, 99) transparent;
	}

	:global(.dark) aside .overflow-y-auto:hover::-webkit-scrollbar-thumb {
		background: rgb(75, 85, 99);
	}

	:global(.dark) aside .overflow-y-auto::-webkit-scrollbar-thumb:hover {
		background: rgb(107, 114, 128);
	}
</style>
