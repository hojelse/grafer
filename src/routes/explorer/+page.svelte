<script lang="ts">
	import { enhance } from "$app/forms"
	import DrawEditor from "$lib/DrawEditor.svelte"
	import ForceGraph from "$lib/ForceGraph.svelte";
	import MultigraphEditor from "$lib/MultigraphEditor.svelte";
	import { adj_string_to_adj, multigraph_string_to_graph_object } from "$lib/util.client";
	import type { ActionData, PageData } from './$types';

	export let data: PageData;

	let form_element: HTMLFormElement;

	$: form_element?.requestSubmit()
	
	export let form: ActionData;

	$: r = form

	let form_data = {
		dir: data.cwd
	}

	$: submit_trigger = submit(form_data);
	function submit(form_data: any) {
		form_element?.requestSubmit()
	}

	let isBeingEdited = false;

	$: common_embedding = form?.res?.common_embedding ?? ""
</script>

<main class="grid gap-5 p-5">
	<form
		style="width: 100%"
		method="POST"
		bind:this={form_element}
		use:enhance={() => {
			return async ({ update }) => {
				update({ reset: false });
			};
		}}
	>
		<input
			style="width: 100%"
			autocomplete="off"
			type="text"
			name="dir"
			on:focusin={() => isBeingEdited = true}
			on:focusout={() => isBeingEdited = false}
			autofocus={isBeingEdited}
			bind:value={form_data.dir}
		/>
	</form>
	<div
		style="max-height: 200px; overflow: scroll;"
	>
		{#if r && r.res && r.res.directories}
			{#each r.res.directories as d}
				<div
					style="background: none; margin: 0; padding: 0; display: block; border: none;"
				>
					{r.res?.dir}/{d}
				</div>
			{/each}
		{/if}
	</div>

	{#if r && r.error}
		Error:
		<p>
			{r.error}
		</p>
	{/if}
	{#if r && r.res}
		<p>
			Found { r.res.graphs.length } graphs with extension ".in"
		</p>
		<div
			style="display: block; position: sticky; top: 10px;"
		>
			<p>Common embedding</p>
			<textarea
				name="embedding"
				bind:value={common_embedding}
			/>
		</div>
		{#each r.res.graphs as graph, index}
			<p>{graph.name}</p>
			{#if graph.name.toString().endsWith(".t.in")}
				<ForceGraph
					name={index}
					adj={adj_string_to_adj(graph.adj)}
				/>
			{:else if graph.name.toString().endsWith(".m.in")}
				<MultigraphEditor
					disable_editing={true}
					disable_ordering={true}
					new_data={{ graph: {
						...graph,
						embedding: common_embedding
					} }}
				/>
			{:else}
				<DrawEditor
					disable_editing={true}
					disable_ordering={true}
					new_data={{ graph: {
						...graph,
						embedding: common_embedding
					} }}
				/>
			{/if}
		{/each}
	{/if}
</main>