<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { theme } from '$lib/stores/theme.svelte';
	import { onMount } from 'svelte';

	let { children } = $props();

	// Ensure theme is applied when component mounts
	onMount(() => {
		theme; // Access theme to ensure it's initialized
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}
