<script lang="ts">
	import { enhance } from "$app/forms"
	import { scriptNames, timeAgo } from "$lib/util.client"
	
	export let new_data;
	export let form;
</script>
<div
	class="flex flex-col gap-5 w-full p-12 mx-auto rounded-lg shadow-xl dark:bg-white/10 bg-white/30 ring-1 ring-gray-900/5 backdrop-blur-lg"
>
	<div class="flex items-center justify-between mb-4">
		<h2 class="text-xl font-semibold">Compute properties</h2>
	</div>
	{#each scriptNames as scriptName}
		<div class="flex justify-between">
			<form method="POST" action={`?/${scriptName}`} use:enhance>
				<textarea hidden name="inputString">
					{new_data.graph.adj}
				</textarea>
				<button type="submit">
					{scriptName}
				</button>
				{#if scriptName == "contraction"}
					<textarea name="moreInputString"></textarea>
				{/if}
			</form>
			<p class="text-sm text-gray-500" style="font-family: monospace; white-space: pre">{form?.[scriptName+"_outputString"] ?? "unknown"}</p>
			<p class="text-sm text-gray-500">
				Ran 
				{
					timeAgo(form?.[scriptName+"_timestamp"])
				} 
				{
					form?.[scriptName+"_timestamp"]
						? form?.[scriptName+"_duration"]
							? `in ${form?.[scriptName+"_duration"]} ms`
							: 'in unknown ms'
						: ""
				}
			</p>
		</div>
	{/each}
</div>