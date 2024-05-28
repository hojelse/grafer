<script lang="ts">
	import DrawEditor from "$lib/DrawEditor.svelte"

	let new_data = {
		graph: {
			id: undefined,
			name: undefined,
			adj: undefined,
			embedding: undefined,
		}
	};
</script>

<main class="grid gap-5 p-5">
	<div
		class="w-full p-12 mx-auto rounded-lg shadow-xl dark:bg-white/10 bg-white/30 ring-1 ring-gray-900/5 backdrop-blur-lg"
	>
		<div class="flex items-center justify-between mb-4">
			<h2 class="text-xl font-semibold">Graph editor</h2>
		</div>

		<DrawEditor bind:new_data disable_editing={false} disable_ordering={false}/>
	</div>
</main>