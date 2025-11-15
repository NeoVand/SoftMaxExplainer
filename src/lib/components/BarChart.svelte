<script lang="ts">
	import { scale } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';

	interface Props {
		data: number[];
		title: string;
		color?: string;
		isProbability?: boolean;
		generationKey?: number;
		sortKey?: number;
	}

	let { data, title, color = 'blue', isProbability = false, generationKey = 0, sortKey = 0 }: Props = $props();

	// For probabilities, auto-scale to max value for better visibility
	// For logits, use symmetric range around zero
	const maxValue = $derived(
		isProbability 
			? Math.max(...data, 0.01) // Auto-scale to actual max probability
			: Math.max(...data.map(Math.abs), 1)
	);
	const minValue = $derived(isProbability ? 0 : -maxValue);
	const range = $derived(maxValue - minValue);

	// Gradient colors
	const positiveGradient = $derived(
		color === 'emerald'
			? 'linear-gradient(to top, rgb(16, 185, 129), rgb(52, 211, 153))'
			: 'linear-gradient(to top, rgb(37, 99, 235), rgb(96, 165, 250))'
	);
	const negativeGradient = 'linear-gradient(to bottom, rgb(220, 38, 38), rgb(248, 113, 113))';

	// Calculate bar metrics for each value
	function getBarMetrics(value: number) {
		const zeroPosition = ((maxValue - 0) / range) * 100;
		const valuePosition = ((maxValue - value) / range) * 100;
		
		if (value >= 0) {
			// Positive bar
			return {
				top: valuePosition,
				height: zeroPosition - valuePosition,
				gradient: positiveGradient
			};
		} else {
			// Negative bar
			return {
				top: zeroPosition,
				height: valuePosition - zeroPosition,
				gradient: negativeGradient
			};
		}
	}

	// Generate grid lines
	const gridLines = $derived(() => {
		const lines: number[] = [];
		
		if (isProbability) {
			// For probabilities, use 6 evenly spaced lines
			const numLines = 6;
			const step = maxValue / (numLines - 1);
			for (let i = 0; i < numLines; i++) {
				lines.push(i * step);
			}
		} else {
			// For logits, use 4 lines
			const step = Math.max(1, Math.ceil(maxValue / 4));
			for (let i = -maxValue; i <= maxValue; i += step) {
				lines.push(i);
			}
			// Ensure zero line is included
			if (!lines.includes(0)) {
				lines.push(0);
			}
		}
		return lines.sort((a, b) => b - a);
	});

	// Get grid line position
	function getLinePosition(value: number): number {
		return ((maxValue - value) / range) * 100;
	}
</script>

<div class="flex h-full w-full flex-col">
	<h3 class="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-300">{title}</h3>
	
	<div class="relative flex flex-1 items-stretch gap-2">
		<!-- Y-axis with ticks -->
		<div class="relative flex-shrink-0" style="width: 32px;">
			{#if isProbability}
				<!-- Detailed ticks for probability chart -->
				{#each gridLines() as line}
					<div
						class="absolute right-0 text-right text-xs leading-none text-gray-500 dark:text-gray-500"
						style="top: {getLinePosition(line)}%; transform: translateY(-50%)"
					>
						<span>{line.toFixed(2)}</span>
					</div>
				{/each}
			{:else}
				<!-- Simple ticks for logits chart -->
				<div class="flex flex-col justify-between text-xs text-gray-500 dark:text-gray-500" style="height: 100%;">
					<span class="text-right leading-none">{maxValue.toFixed(1)}</span>
					<span class="text-right font-medium leading-none">0</span>
					<span class="text-right leading-none">{minValue.toFixed(1)}</span>
				</div>
			{/if}
		</div>

		<!-- Chart area -->
		<div class="relative flex-1">
			<!-- Grid lines (theme-aware) -->
			{#each gridLines() as line}
				<div
					class="absolute left-0 right-0 border-t-gray-200 dark:hidden"
					class:border-gray-400={line === 0}
					style="
						top: {getLinePosition(line)}%;
						border-top-width: {line === 0 ? '1px' : '0.5px'};
					"
				></div>
				<div
					class="absolute left-0 right-0 hidden dark:block"
					style="
						top: {getLinePosition(line)}%;
						border-top-width: {line === 0 ? '1px' : '0.5px'};
						border-top-style: solid;
						border-top-color: {line === 0 
							? 'rgba(107, 114, 128, 0.3)' 
							: 'rgba(75, 85, 99, 0.15)'};
					"
				></div>
			{/each}

			<!-- Bars container -->
			<div class="absolute inset-0 flex px-1">
				{#each data as value, i (`${generationKey}-${sortKey}-${i}`)}
					{@const metrics = getBarMetrics(value)}
					<div class="relative flex-1" style="min-width: 3px;">
						<div
							class="absolute inset-x-0.5 border border-white/30 transition-all duration-200 dark:border-gray-900/40"
							class:rounded-t-sm={value >= 0}
							class:rounded-b-sm={value < 0}
							style="
								background: {metrics.gradient};
								top: {metrics.top}%;
								height: {metrics.height}%;
								min-height: 2px;
							"
						></div>
					</div>
				{/each}
			</div>
		</div>
	</div>
</div>
