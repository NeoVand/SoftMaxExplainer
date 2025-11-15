<script lang="ts">
	interface Props {
		data: number[];
		title: string;
		color?: string;
		bins?: number;
	}

	let { data, title, color = 'blue', bins = 10 }: Props = $props();

	// Calculate histogram and create smooth curve
	const histogram = $derived.by(() => {
		if (data.length === 0) return { path: '', maxCount: 0, totalSum: 0, xMin: 0, xMax: 1, yMax: 0 };

		const min = Math.min(...data);
		const max = Math.max(...data);
		const range = max - min;
		
		if (range === 0) {
			return { path: '', maxCount: data.length, totalSum: data.reduce((a, b) => a + b, 0), xMin: min, xMax: max, yMax: data.length };
		}
		
		const binWidth = range / bins;
		const binCounts = new Array(bins).fill(0);
		const binCenters = new Array(bins).fill(0).map((_, i) => min + (i + 0.5) * binWidth);
		
		// Count values in each bin
		data.forEach(value => {
			let binIndex = Math.floor((value - min) / binWidth);
			if (binIndex >= bins) binIndex = bins - 1;
			if (binIndex >= 0 && binIndex < bins) {
				binCounts[binIndex]++;
			}
		});

		const maxCount = Math.max(...binCounts, 1);
		const totalSum = data.reduce((sum, val) => sum + val, 0);

		// Create stepped histogram path (rectangular/square curve)
		// SVG viewBox: 0 0 100 100 (percentage-based)
		const binWidthPercent = 100 / bins;
		
		// Start at bottom-left
		let path = `M 0 100`;
		
		// Create rectangular steps for each bin
		binCounts.forEach((count, i) => {
			const x = i * binWidthPercent;
			const y = 100 - (count / maxCount) * 100;
			
			// Vertical line up to the bin height
			path += ` L ${x} ${y}`;
			// Horizontal line across the bin width
			path += ` L ${x + binWidthPercent} ${y}`;
		});
		
		// Drop down to baseline and close
		path += ` L 100 100 Z`

		return {
			path,
			maxCount,
			totalSum,
			xMin: min,
			xMax: max,
			yMax: maxCount
		};
	});

	// Color schemes
	const colorSchemes = {
		blue: {
			fill: 'rgba(59, 130, 246, 0.3)',
			stroke: 'rgb(59, 130, 246)',
			text: 'text-blue-600 dark:text-blue-400'
		},
		emerald: {
			fill: 'rgba(16, 185, 129, 0.3)',
			stroke: 'rgb(16, 185, 129)',
			text: 'text-emerald-600 dark:text-emerald-400'
		}
	};

	const scheme = $derived(colorSchemes[color as keyof typeof colorSchemes] || colorSchemes.blue);
</script>

<div class="flex h-full w-full flex-col">
	<h3 class="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">{title}</h3>
	
	<!-- Chart area -->
	<div class="relative flex-1">
		<!-- Y-axis -->
		<div class="absolute bottom-0 left-0 top-0 flex w-7 flex-col justify-between text-xs text-gray-500 dark:text-gray-500">
			<span class="text-right leading-none">{histogram.yMax}</span>
			<span class="text-right leading-none">0</span>
		</div>

		<!-- SVG Chart -->
		<div class="absolute bottom-8 left-8 right-0 top-0">
			<svg viewBox="0 0 100 100" preserveAspectRatio="none" class="h-full w-full">
				<!-- Filled area under curve -->
				<path
					d={histogram.path}
					fill={scheme.fill}
					stroke={scheme.stroke}
					stroke-width="0.5"
					vector-effect="non-scaling-stroke"
				/>
			</svg>
		</div>

		<!-- X-axis labels -->
		<div class="absolute bottom-0 left-8 right-0 flex justify-between text-xs text-gray-500 dark:text-gray-500">
			<span>{histogram.xMin.toFixed(2)}</span>
			<span>{histogram.xMax.toFixed(2)}</span>
		</div>
	</div>

	<!-- Sum display -->
	<div class="mt-2 flex items-center justify-center gap-1.5 text-xs">
		<span class="text-gray-600 dark:text-gray-400">Sum:</span>
		<span class="font-mono font-semibold {scheme.text}">
			{histogram.totalSum.toFixed(3)}
		</span>
	</div>
</div>
