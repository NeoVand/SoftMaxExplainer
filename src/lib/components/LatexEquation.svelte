<script lang="ts">
	import { onMount } from 'svelte';

	let container: HTMLDivElement;
	let mounted = $state(false);

	onMount(async () => {
		// Dynamically import KaTeX
		const katex = await import('katex');

		// Render the equation
		if (container) {
			katex.default.render(
				String.raw`\text{softmax}(x_i) = \dfrac{e^{x_i/\tau}}{\displaystyle\sum_{j=1}^{n} e^{x_j/\tau}}`,
				container,
				{
					displayMode: true,
					throwOnError: false
				}
			);
			mounted = true;
		}
	});
</script>

<svelte:head>
	<link
		rel="stylesheet"
		href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css"
		integrity="sha384-n8MVd4RsNIU0tAv4ct0nTaAbDJwPJzDEaqSD1odI+WdtXRGWt2kTvGFasHpSy3SV"
		crossorigin="anonymous"
	/>
</svelte:head>

<div bind:this={container} class="katex-container"></div>

<style>
	.katex-container {
		min-height: 60px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.katex-container :global(.katex) {
		font-size: 1.1em;
		color: rgb(17, 24, 39); /* gray-900 */
	}

	:global(.dark) .katex-container :global(.katex) {
		color: rgb(243, 244, 246); /* gray-100 */
	}

	.katex-container :global(.katex-display) {
		margin: 0;
	}
</style>
