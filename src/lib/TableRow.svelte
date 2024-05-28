<script lang="ts">
	export let data: {
		id: number,
		name: string,
		adj: string
	};

	export let show_actions: boolean;
</script>

{#if show_actions}
	<div class="grid grid-cols-4 place-items-center">
		<p class="text-sm text-gray-500">id:{data.id}</p>
		<p class="font-medium leading-none">{data.name}</p>
		<p class="text-sm text-gray-500" style="font-family: monospace; white-space: pre">{data.adj}</p>
		<div>
			<a href={`/view/${data.id}`}>
				<button>View</button>
			</a>
			<a href={`/edit/${data.id}`}>
				<button>Edit</button>
			</a>
			<a href={`/delete/${data.id}`}>
				<button>Delete</button>
			</a>
		</div>
	</div>
{:else}
	<div class="grid grid-cols-3 place-items-center">
		<p class="text-sm text-gray-500">id:{data.id}</p>
		<p class="font-medium leading-none">{data.name}</p>
		<p class="text-sm text-gray-500" style="white-space: pre">{data.adj}</p>
	</div>
{/if}