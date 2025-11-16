<script lang="ts">
	interface Props {
		data: number[];
		title: string;
		color?: string;
		bins?: number;
		isProbability?: boolean;
	}

	let { data, title, color = 'blue', bins = 20, isProbability = false }: Props = $props();
	
	// Calculate sum for display in title
	const sum = $derived(data.reduce((acc, val) => acc + val, 0));

	// Calculate histogram for HORIZONTAL display
	const histogram = $derived.by(() => {
		if (data.length === 0) return { path: '', maxCount: 0, xMin: 0, xMax: 1 };

		let min, max;
		
		if (isProbability) {
			// Probabilities: use actual range (0 to max)
			min = Math.min(...data);
			max = Math.max(...data);
		} else {
			// Logits: use symmetric range like the bar chart
			const dataMin = Math.min(...data);
			const dataMax = Math.max(...data);
			const maxAbs = Math.max(Math.abs(dataMin), Math.abs(dataMax));
			min = -maxAbs;
			max = maxAbs;
		}
		
		const range = max - min;
		
		if (range === 0) {
			return { path: '', maxCount: data.length, xMin: min, xMax: max };
		}
		
		const binWidth = range / bins;
		const binCounts = new Array(bins).fill(0);
		
		// Count values in each bin
		data.forEach(value => {
			let binIndex = Math.floor((value - min) / binWidth);
			if (binIndex >= bins) binIndex = bins - 1;
			if (binIndex >= 0 && binIndex < bins) {
				binCounts[binIndex]++;
			}
		});

		const maxCount = Math.max(...binCounts, 1);

		const binHeightPercent = 100 / bins;
		
		let positivePath = '';
		let negativePath = '';
		
		if (isProbability) {
			// For probabilities (always >= 0), use single path
			positivePath = `M 0 0`;
			
			for (let i = bins - 1; i >= 0; i--) {
				const y = (bins - 1 - i) * binHeightPercent;
				const x = (binCounts[i] / maxCount) * 100;
				
				positivePath += ` L ${x} ${y}`;
				positivePath += ` L ${x} ${y + binHeightPercent}`;
			}
			
			positivePath += ` L 0 100 L 0 0 Z`;
		} else {
			// For logits (can be negative), split into positive and negative
			const zeroBinIndex = Math.floor((0 - min) / binWidth);
			
			// POSITIVE path (bins with values >= 0)
			if (zeroBinIndex < bins) {
				positivePath = `M 0 0`; // Start at top-left
				
				// Draw the positive bins from top down to zero line
				for (let i = bins - 1; i >= zeroBinIndex; i--) {
					const y = (bins - 1 - i) * binHeightPercent;
					const x = (binCounts[i] / maxCount) * 100;
					
					positivePath += ` L ${x} ${y}`;
					positivePath += ` L ${x} ${y + binHeightPercent}`;
				}
				
				// Close path: draw back to left edge then up to start
				positivePath += ` L 0 ${(bins - zeroBinIndex) * binHeightPercent}`;
				positivePath += ` L 0 0 Z`;
			}
			
			// NEGATIVE path (bins with values < 0)
			if (zeroBinIndex > 0) {
				const zeroY = (bins - zeroBinIndex) * binHeightPercent;
				negativePath = `M 0 ${zeroY}`; // Start at zero line
				
				// Draw negative bins from zero down to bottom
				for (let i = zeroBinIndex - 1; i >= 0; i--) {
					const y = (bins - 1 - i) * binHeightPercent;
					const x = (binCounts[i] / maxCount) * 100;
					
					negativePath += ` L ${x} ${y}`;
					negativePath += ` L ${x} ${y + binHeightPercent}`;
				}
				
				// Close path: draw back to left edge then up to start
				negativePath += ` L 0 100`;
				negativePath += ` L 0 ${zeroY} Z`;
			}
		}

		return {
			positivePath,
			negativePath,
			maxCount,
			xMin: min,
			xMax: max
		};
	});

	// Gradient fills for histograms
	const colorSchemes = {
		blue: {
			fill: 'url(#gradient-blue-h)',
			text: 'text-blue-600 dark:text-blue-400'
		},
		emerald: {
			fill: 'url(#gradient-emerald-h)',
			text: 'text-emerald-600 dark:text-emerald-400'
		}
	};

	const scheme = $derived(colorSchemes[color as keyof typeof colorSchemes] || colorSchemes.blue);
</script>

<style>
	/* Dark mode: dark at left to vibrant at right */
	:global(.dark) .blue-h-start {
		stop-color: rgb(30, 60, 110) !important;
	}
	:global(.dark) .blue-h-end {
		stop-color: rgb(70, 130, 220) !important;
	}
	:global(.dark) .emerald-h-start {
		stop-color: rgb(20, 90, 70) !important;
	}
	:global(.dark) .emerald-h-end {
		stop-color: rgb(16, 160, 120) !important;
	}
	:global(.dark) .red-h-start {
		stop-color: rgb(100, 40, 40) !important;
	}
	:global(.dark) .red-h-end {
		stop-color: rgb(220, 80, 80) !important;
	}
</style>

<div class="flex h-full w-full flex-col">
	<h3 class="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
		<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="transform: rotate(90deg)">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
		</svg>
		<span>{title} <span class="text-[10px] font-mono font-normal {scheme.text}">({sum.toFixed(2)})</span></span>
	</h3>
	
	<!-- Chart area - horizontal histogram -->
	<div class="relative flex-1">
		<!-- Axis labels on left side - outside the chart -->
		<div class="absolute bottom-0 left-0 top-0 flex w-8 flex-col justify-between text-[10px] text-right text-gray-500 dark:text-gray-500">
			<span class="leading-none">{histogram.xMax.toFixed(1)}</span>
			<span class="leading-none">{histogram.xMin.toFixed(1)}</span>
		</div>

		<!-- SVG Chart - offset from left to make room for labels -->
		<div class="absolute bottom-0 left-9 right-0 top-0">
			<svg viewBox="0 0 100 100" preserveAspectRatio="none" class="h-full w-full">
				<!-- Horizontal gradients - left to right -->
				<defs>
					<linearGradient id="gradient-blue-h" x1="0%" y1="0%" x2="100%" y2="15%">
						<stop offset="0%" class="blue-h-start" style="stop-color: rgb(191, 219, 254)" />
						<stop offset="100%" class="blue-h-end" style="stop-color: rgb(59, 130, 246)" />
					</linearGradient>
					<linearGradient id="gradient-emerald-h" x1="0%" y1="0%" x2="100%" y2="15%">
						<stop offset="0%" class="emerald-h-start" style="stop-color: rgb(167, 243, 208)" />
						<stop offset="100%" class="emerald-h-end" style="stop-color: rgb(16, 185, 129)" />
					</linearGradient>
					<linearGradient id="gradient-red-h" x1="0%" y1="0%" x2="100%" y2="15%">
						<stop offset="0%" class="red-h-start" style="stop-color: rgb(254, 202, 202)" />
						<stop offset="100%" class="red-h-end" style="stop-color: rgb(239, 68, 68)" />
					</linearGradient>
				</defs>
				<!-- Positive area (blue/emerald) -->
				{#if histogram.positivePath}
					<path
						d={histogram.positivePath}
						fill={scheme.fill}
					/>
				{/if}
				<!-- Negative area (red) for non-probability -->
				{#if !isProbability && histogram.negativePath}
					<path
						d={histogram.negativePath}
						fill="url(#gradient-red-h)"
					/>
				{/if}
			</svg>
		</div>
	</div>
</div>
