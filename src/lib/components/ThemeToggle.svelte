<script lang="ts">
	import { theme } from '$lib/stores/theme.svelte';
</script>

<button
	onclick={() => theme.toggle()}
	class="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 transition-all hover:bg-gray-200 dark:bg-gray-700/50 dark:hover:bg-gray-600/50"
	aria-label="Toggle theme"
>
	{#if theme.current === 'light'}
		<!-- Moon icon for light mode -->
		<svg
			class="h-4 w-4 text-gray-700"
			fill="none"
			stroke="currentColor"
			viewBox="0 0 24 24"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
			></path>
		</svg>
	{:else}
		<!-- Sun icon for dark mode -->
		<svg
			class="h-4 w-4 text-gray-200"
			fill="none"
			stroke="currentColor"
			viewBox="0 0 24 24"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
			></path>
		</svg>
	{/if}
</button>
