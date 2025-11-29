<script>
	import favicon from '$lib/assets/favicon.svg';
	import "$lib/custom.scss";

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}
