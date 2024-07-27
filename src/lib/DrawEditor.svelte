<script lang="ts">
	import {
		embedding_string_to_embedding,
		adj_string_to_adj,
		embedding_to_embedding_string,
		adj_to_adj_string
	} from "$lib/util.client"
	import ComputedProperties from "./ComputedProperties.svelte";

	export let new_data;

	export let disable_editing: boolean;
	export let disable_ordering: boolean;

	$: moveMode = disable_editing
		? true
		: false

	let adj = adj_string_to_adj(new_data.graph?.adj)
	let N = Object.entries(adj).length;
	$: next_id = get_next_id(adj);
	function get_next_id(_adj: Record<number, Array<number>>): number {
		if (!_adj) return 1;
		let ids = new Set(Object.keys(_adj).map(Number));
		let i = 1;
		for (; i <= N+1; i++) {
			if (!ids.has(i)) return i;
		}
		return i;
	}

	// let embedding = new_data.graph.embedding
	// 	? embedding_string_to_embedding(new_data.graph.embedding)
	// 	: regular_polygon_embedding(Object.keys(adj), 100, {x: 0, y: 0})
	let embedding = embedding_string_to_embedding(new_data.graph.embedding);

	let history = [{
		adj: JSON.parse(JSON.stringify(adj)),
		emb: JSON.parse(JSON.stringify(embedding))
	}]
	let history_pointer = 0;

	$: on_history_pointer_change = blah(history_pointer)
	function blah(history_pointer) {
		adj = JSON.parse(JSON.stringify(history[history_pointer].adj));
		embedding = JSON.parse(JSON.stringify(history[history_pointer].emb));
	}

	let timer;
	function record_history(
		_adj: Record<number, number[]>,
		_emb: Record<number, {x: number; y: number; }>
	) {
		if (history_pointer < history.length-1) {
			history.splice(history_pointer+1);
		}

		clearTimeout(timer);
		timer = setTimeout(() => {
			// history.splice(history.length-1)
			// history_pointer--;
			

			let adj_copy = JSON.parse(JSON.stringify(_adj));
			let emb_copy = JSON.parse(JSON.stringify(_emb));
			history.push({
				adj: adj_copy,
				emb: emb_copy
			});
			history = history; // force reaction
			history_pointer++;
		}, 100);
	}

	$: on_new_data = update_graph(new_data)
	function update_graph(new_data) {
		adj = adj_string_to_adj(new_data.graph?.adj);
		N = Object.entries(adj).length;
		// embedding = new_data.graph.embedding
		// 	? embedding_string_to_embedding(new_data.graph.embedding)
		// 	: regular_polygon_embedding(Object.keys(adj), 400, {x: 0, y: 0})
		let _em = embedding_string_to_embedding(new_data.graph.embedding);

		let missing_vertices = Object.keys(adj).filter(x => !Object.keys(_em).includes(x));
		for (let v of missing_vertices) {
			_em[v] = {
				x: Math.floor(Math.random()*999-500),
				y: Math.floor(Math.random()*999-500)
			};
		}

		embedding = _em
	}

	// $: ordering = update_ordering(embedding, adj)
	// function update_ordering(_emb, _adj) {
	// 	if (disable_ordering) return;
	// 	for (const [k, v] of Object.entries(adj)) {
	// 		adj[Number(k)] = v.sort((_emb, _adj) => orientation(embedding[Number(k)], embedding[_emb]) - orientation(embedding[Number(k)], embedding[_adj]))
	// 	}
	// }

	// $: update_d = update_new_data(adj, embedding);
	// function update_new_data(_adj: Record<number, Array<number>>, _embedding: Record<number, {x: number, y: number }>) {
	// 	new_data.graph.adj = adj_to_adj_string(_adj);
	// 	new_data.graph.embedding = embedding_to_embedding_string(_embedding);
	// }

	function normal_vector(p1: {x: number, y: number}, p2: {x: number, y: number}) {
		let dx = p2.x - p1.x;
		let dy = p2.y - p1.y;
		return {
			x: -dy,
			y: +dx
		}
	}

	function count_edges(p: number, q: number) {
		return adj[p].filter(x => x == q).length;
	}

	function orientation(p1, p2) {
		let x = p2.x - p1.x
		let y = p2.y - p1.y
		return Math.atan2(y, x)
	}

	$: vertexid_to_componentid = components(adj);
	function components(_adj: Record<number, Array<number>>): Map<number, number> {
		let components = []
		// DFS
		let visited = new Set()
		for (let v of Object.keys(_adj).map(Number)) {
			if (!visited.has(v)) {
				let stack = [v]
				visited = new Set()
				let component = []
				while (stack.length > 0) {
					const v = stack.pop()!
					visited.add(v)
					component.push(v)
					for (const u of _adj[v]) {
						if (!visited.has(u)) {
							stack.push(u)
						}
					}
				}
				components.push(component)
			}
		}

		const map = new Map<number, number>();
		let i = 0;
		for (let component of components) {
			for (let x of component) {
				map.set(x, i)
			}
			i++;
		}

		return map;
	}

	function component_color(k: number) {
		let component_id = vertexid_to_componentid?.get(k) ?? 0;
		let num_components = (new Set(vertexid_to_componentid.values())).size;
		let hue_max = 360;
		let offset = 200;
		let hue = (offset + hue_max / num_components * component_id) % hue_max;
		let color = `oklch(50% 0.5 ${hue})`
		return color;
	}

	function addVertex(x: number, y: number) {
		N++;
		const newId = next_id;
		
		adj[newId] = []
		embedding[newId] = {x, y};

		adj = adj; // force reaction
		embedding = embedding; // force reaction
		record_history(adj, embedding)
	}

	function removeItemAll(arr, value) {
		var i = 0;
		while (i < arr.length) {
			if (arr[i] === value) {
			arr.splice(i, 1);
			} else {
			++i;
			}
		}
		return arr;
	}

	function removeVertex(id: number) {
		N--;
		
		delete adj[id];
		delete embedding[id];
		
		for (const [k, v] of Object.entries(adj)) {
			adj[Number(k)] = removeItemAll(v, id);
		}

		adj = adj; // force reaction
		embedding = embedding; // force reaction
		record_history(adj, embedding)
	}

	function addEdge(u: number, v: number) {
		adj[u].push(v);
		adj[v].push(u);
		adj = adj; // force reaction
		record_history(adj, embedding)
	}

	function removeEdge(u: number, v: number) {
		adj[u] = removeItemAll(adj[u], v);
		adj[v] = removeItemAll(adj[v], u);
		adj = adj; // force reaction
		record_history(adj, embedding)
	}

	$: adj_string = adj_to_adj_string(adj);

	$: embedding_string = embedding_to_embedding_string(embedding);

	let drag_from: number | null = null;

	let drag_to: {x: number, y: number} | null = null;

	let error_msg = ''

	function onKeyDown(evt: KeyboardEvent) {
		if (evt.key === "Shift") {
			moveMode = true;
		}
		if (evt.key === "z") {
			history_pointer = Math.max(0, history_pointer-1);
		}
		if (evt.key === "y") {
			history_pointer = Math.min(history.length-1, history_pointer+1);
		}
	}
	function onKeyUp(evt: KeyboardEvent) {
		if (evt.key === "Shift" && !disable_editing) {
			moveMode = false;
		}
	}

	let svg_sidelength = 1000;

	function regular_polygon_embedding(keys: string[], radius: number, center: {x: number, y: number}): Record<number, {x: number, y: number}> {
		let rotateVector = function(rad) {
			const vec = {x: 0, y: -1}
			let cos = Math.cos(rad);
			let sin = Math.sin(rad);
			return {
				x: vec.x * cos - vec.y * sin,
				y: vec.x * sin + vec.y * cos
			}
		}

		let points = [];

		let n = keys.length;

		for (let i = 0; i < n; i++) {
			points.push(rotateVector(i*Math.PI*2/n))
		}

		const embedding = points.reduce((obj: Record<number, {x: number, y: number}>, point, i) => {
			obj[Number(keys[i])] = {
				x: Math.round(center.x + (point.x * radius)),
				y: Math.round(center.y + (point.y * radius))
			};
			return obj
		}, {})

		return embedding
	}

	function neigbors_has_correct_rotation(k: number): boolean {
		if (adj[k].length < 2) return true
		
		const origin = embedding[k]
		
		let min_orientation_idx = 0
		let min_orientation = orientation(origin, embedding[adj[k][0]])
		for (let i = 1; i < adj[k].length; i++) {
			let candidate = orientation(origin, embedding[adj[k][i]])
			if (candidate < min_orientation) {
				min_orientation_idx = i
				min_orientation = candidate
			}
		}

		console.log("min element", adj[k][min_orientation_idx])

		console.log("orientations around", k)
		for (let i = 0; i < adj[k].length; i++) {
			let idx = (min_orientation_idx + i) % adj[k].length
			let other = adj[k][idx]
			console.log("to", other, orientation(origin, embedding[other]))
		}

		for (let i = 0; i < adj[k].length-1; i++) {
			if (
				orientation(origin, embedding[adj[k][(min_orientation_idx + i) % adj[k].length]])
				> orientation(origin, embedding[adj[k][(min_orientation_idx + i + 1) % adj[k].length]])
			) {
				return false
			}
		}

		return true
	}
</script>
<svelte:window
	on:keydown={onKeyDown}
	on:keyup={onKeyUp}
/>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<main class="grid gap-5 p-5">
	<div class="wrapper">
		<div class="canvas-editor">
			<div class="svg-wrapper">
				<svg
					viewBox={`${-svg_sidelength/2} ${-svg_sidelength/2} ${svg_sidelength} ${svg_sidelength}`}
					on:click={evt => {
						if (moveMode) return;

						let x2 = (evt.offsetX / evt.currentTarget.clientWidth) * svg_sidelength - svg_sidelength/2;
						let y2 = (evt.offsetY / evt.currentTarget.clientHeight) * svg_sidelength - svg_sidelength/2;

						x2 = Math.round(x2);
						y2 = Math.round(y2);

						const dist = 10;
						for (const [k, {x: x1, y: y1}] of Object.entries(embedding)) {
							if (
								(x1-dist <= x2 && x2 <= x1+dist) &&
								(y1-dist <= y2 && y2 <= y1+dist)
							) {
								return;
							}
						}
						addVertex(x2, y2);
					}}

					on:pointermove={evt => {
						if (drag_from != null) {
							let x = (evt.offsetX / evt.currentTarget.clientWidth) * svg_sidelength - svg_sidelength/2;
							let y = (evt.offsetY / evt.currentTarget.clientHeight) * svg_sidelength - svg_sidelength/2;

							x = Math.round(x);
							y = Math.round(y);

							if (moveMode) {
								embedding[drag_from] = {x, y};
								record_history(adj, embedding)
							} else {
								drag_to = {x, y};
							}
						}
					}}

					on:pointerup={evt => {
						drag_from = null;
						drag_to = null;
					}}
				>
					{#if drag_from != null && drag_to != null}
						<line
							stroke={component_color(drag_from)}
							stroke-width="5"
							x1={embedding[drag_from].x}
							y1={embedding[drag_from].y}
							x2={drag_to.x}
							y2={drag_to.y}
						/>
					{/if}
					<g id="edges_container">
						{#each Object.entries(adj) as [k, v]}
							{#each v as u, idx}
								{#if Number(k) < u}
									<path
										on:click={(evt) => {
											evt.stopPropagation();
											if (!moveMode)
												removeEdge(Number(k), Number(u));
										}}
										stroke={component_color(Number(k))}
										stroke-width="5"
										fill="none"
										d={`
												M ${embedding[Number(k)].x} ${embedding[Number(k)].y}
												C ${embedding[Number(k)].x + (1 + Math.floor((idx - v.indexOf(u))/2)) * (idx%2==0 ? 1 : -1) * 0.1 * (count_edges(Number(k), u)<=1 ? 0 : 1) * normal_vector(embedding[Number(k)], embedding[u]).x} ${embedding[Number(k)].y + (1 + Math.floor((idx - v.indexOf(u))/2)) * (idx%2==0 ? 1 : -1) * 0.1 * (count_edges(Number(k), u)<=1 ? 0 : 1) * normal_vector(embedding[Number(k)], embedding[u]).y}
													${embedding[u].x - (1 + Math.floor((idx - v.indexOf(u))/2)) * (idx%2==0 ? 1 : -1) * 0.1 * (count_edges(Number(k), u)<=1 ? 0 : 1) * normal_vector(embedding[u], embedding[Number(k)]).x} ${embedding[u].y - (1 + Math.floor((idx - v.indexOf(u))/2)) * (idx%2==0 ? 1 : -1) * 0.1 * (count_edges(Number(k), u)<=1 ? 0 : 1) * normal_vector(embedding[u], embedding[Number(k)]).y}
													${embedding[u].x} ${embedding[u].y}
											`
										}
									/>
								{/if}
							{/each}
						{/each}
					</g>
					<g id="vertices_container">
						{#each Object.entries(adj) as [k, v]}
							{#if !neigbors_has_correct_rotation(k)}
								<circle
									r="15"
									cx={embedding[Number(k)].x}
									cy={embedding[Number(k)].y}
									fill={"orange"}
								></circle>
							{/if}
							<circle
								r="10"
								on:click={(evt) => {
									if (moveMode) return;
									evt.stopPropagation();
									removeVertex(Number(k));
								}}
								on:pointerdown={(evt) => {
									evt.stopPropagation();
									drag_from = Number(k)
								}}
								on:pointerup={(evt) => {
									if (moveMode) return;
									if (drag_from) {
										addEdge(drag_from, Number(k));
										evt.currentTarget.setAttribute("stroke", "none")
									}
								}}
								on:pointerenter={(evt) => {
									if (moveMode) return;
									if (drag_from) {
										evt.currentTarget.setAttribute("stroke", "red")
										evt.currentTarget.setAttribute("stroke-width", "5")
									}
								}}
								on:pointerleave={(evt) => {
									evt.currentTarget.setAttribute("stroke", "none")
								}}
								cx={embedding[Number(k)].x}
								cy={embedding[Number(k)].y}
								fill={component_color(Number(k))}
							/>
							<text
								class="unselectable"
								x={embedding[Number(k)].x}
								y={embedding[Number(k)].y}
								font-size="1em"
								fill="white"
							>{k}</text>
						{/each}
					</g>
				</svg>
			</div>
		</div>
	</div>
	{#if !disable_editing}
		<div style="display: flex; justify-content: space-around;">
			<p style="display: inline-block;"><span class="keybind">z</span> - undo</p>
			<p style="display: inline-block;"><span class="keybind">y</span> - redo</p>
			<p style="display: inline-block;">hold <span class="keybind">shift</span> - move</p>
		</div>
	{/if}
	<h2>Adj</h2>
	<textarea name="" id="" bind:value={adj_string}></textarea>
	<h2>Embedding</h2>
	<textarea name="" id="" bind:value={embedding_string}></textarea>
</main>

<style>
	.keybind {
		font-family: monospace;
		padding: 5px;
		border-radius: 5px;
		background-color: rgb(123, 123, 123);
		color: white;
	}

	.unselectable {
		-webkit-touch-callout: none; /* iOS Safari */
		-webkit-user-select: none; /* Safari */
		-khtml-user-select: none; /* Konqueror HTML */
		-moz-user-select: none; /* Old versions of Firefox */
		-ms-user-select: none; /* Internet Explorer/Edge */
		user-select: none; /* Non-prefixed version, currently
		supported by Chrome, Edge, Opera and Firefox */
	}

	.wrapper {
		display: grid;
		width: 100%;
		align-items: space-around;
		gap: 1em;
	}
	.wrapper > * {
		box-sizing: border-box;
		padding: 1em;
		border-radius: 0.1em;
		/* border: 1px solid black; */
	}

	.canvas-editor {
		display: grid;
		justify-items: center;
		width: 100%;
		min-height: 60vh;
	}

	.svg-wrapper {
		display: flex;
		height: 100%;
		aspect-ratio: 1/1;
	}

	svg {
		border: 1px solid black;
		height: 100%;
		width: 100%;
	}

	.adj-editor {
		display: flex;
		flex-direction: column;
	}
	
	textarea {
		box-sizing: border-box;
		width: 100%;
		background: none;
		resize: none;
		padding: 1em;
		flex-grow: 1;
	}

	svg text {
		text-anchor: middle;
		dominant-baseline: middle;
		pointer-events: none;
		cursor: pointer;
		-webkit-touch-callout: none; /* iOS Safari */
		-webkit-user-select: none; /* Safari */
		-khtml-user-select: none; /* Konqueror HTML */
		-moz-user-select: none; /* Old versions of Firefox */
		-ms-user-select: none; /* Internet Explorer/Edge */
		user-select: none; /* Non-prefixed version, currently
		supported by Chrome, Edge, Opera and Firefox */
	}

	.history-item {
		display: inline-block;
		height: 15px;
		width: 15px;
		border-radius: 50%;
		background-color: grey;
		margin-right: 10px;
	}

	.selected-history-item {
		background-color: red;
	}
</style>