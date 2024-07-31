<script lang="ts">
	import {
		embedding_string_to_embedding,
		adj_string_to_adj,
		multigraph_string_to_graph_object,
		embedding_to_embedding_string,
		adj_to_adj_string

	} from "$lib/util.client"

	export let new_data;

	export let disable_editing: boolean;
	export let disable_ordering: boolean;

	$: moveMode = disable_editing
		? true
		: false

	let graph = multigraph_string_to_graph_object(new_data.graph?.adj)
	let N = Object.entries(graph.adj).length;
	// $: next_id = get_next_id(graph.adj);
	// function get_next_id(_adj: Record<string, Array<string>>): number {
	// 	if (!_adj) return 1;
	// 	let ids = new Set(Object.keys(_adj).filter(x => typeof Number(x) === 'number').map(Number));
	// 	let i = 1;
	// 	for (; i <= N+1; i++) {
	// 		if (!ids.has(i)) return i;
	// 	}
	// 	return i;
	// }

	// let embedding = new_data.graph.embedding
	// 	? embedding_string_to_embedding(new_data.graph.embedding)
	// 	: regular_polygon_embedding(Object.keys(adj), 100, {x: 0, y: 0})
	let embedding = embedding_string_to_embedding(new_data.graph.embedding);

	let history = [{
		graph: JSON.parse(JSON.stringify(graph)),
		emb: JSON.parse(JSON.stringify(embedding))
	}]
	let history_pointer = 0;

	$: on_history_pointer_change = blah(history_pointer)
	function blah(history_pointer) {
		graph = JSON.parse(JSON.stringify(history[history_pointer].graph));
		embedding = JSON.parse(JSON.stringify(history[history_pointer].emb));
	}

	let timer;
	function record_history(
		_graph: {
			adj: Record<string, Array<string>>;
			edges: Record<string, Array<string>>;
		},
		_emb: Record<string, {x: number; y: number; }>
	) {
		if (history_pointer < history.length-1) {
			history.splice(history_pointer+1);
		}

		clearTimeout(timer);
		timer = setTimeout(() => {
			// history.splice(history.length-1)
			// history_pointer--;
			

			let graph_copy = JSON.parse(JSON.stringify(_graph));
			let emb_copy = JSON.parse(JSON.stringify(_emb));
			history.push({
				graph: graph_copy,
				emb: emb_copy
			});
			history = history; // force reaction
			history_pointer++;
		}, 100);
	}

	$: on_new_data = update_graph(new_data)
	function update_graph(new_data) {
		graph = multigraph_string_to_graph_object(new_data.graph?.adj);
		N = Object.entries(graph.adj).length;
		// embedding = new_data.graph.embedding
		// 	? embedding_string_to_embedding(new_data.graph.embedding)
		// 	: regular_polygon_embedding(Object.keys(adj), 400, {x: 0, y: 0})
		let _em = embedding_string_to_embedding(new_data.graph.embedding);

		let missing_vertices = Object.keys(graph.adj).filter(x => !Object.keys(_em).includes(x));
		for (let v of missing_vertices) {
			_em[v] = {
				x: Math.floor(Math.random()*999-500),
				y: Math.floor(Math.random()*999-500)
			};
		}

		embedding = _em
	}

	$: ordering = update_ordering(embedding, graph)
	function update_ordering(_emb, _graph) {
		if (disable_ordering) return;
		for (const [k, v] of Object.entries(graph.adj)) {
			graph.adj[k] = v.sort((e1, e2) => orientation(embedding[k], embedding[graph.edges[e1].filter(x => x!=k)[0]]) - orientation(embedding[k], embedding[graph.edges[e2].filter(x => x!=k)[0]]))
		}
	}

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

	function count_edges(p: string, q: string) {
		return graph.adj[p].filter(x => x == q).length;
	}

	function orientation(p1, p2) {
		let x = p2.x - p1.x
		let y = p2.y - p1.y
		return Math.atan2(y, x)
	}

	$: vertexid_to_componentid = components(graph);
	function components(
		_graph: {
			adj: Record<string, Array<string>>;
			edges: Record<string, Array<string>>;
		}
	): Map<string, number> {
		let components = []
		// DFS
		let visited = new Set()
		for (let v of Object.keys(_graph.adj)) {
			if (!visited.has(v)) {
				let stack = [v]
				visited = new Set()
				let component = []
				while (stack.length > 0) {
					const v = stack.pop()!
					visited.add(v)
					component.push(v)
					for (const u of _graph.adj[v].map(e => _graph.edges[e].filter(x => x!=v)[0])) {
						if (!visited.has(u)) {
							stack.push(u)
						}
					}
				}
				components.push(component)
			}
		}

		const map = new Map<string, number>();
		let i = 0;
		for (let component of components) {
			for (let x of component) {
				map.set(x, i)
			}
			i++;
		}

		return map;
	}

	function component_color(k: string) {
		let component_id = vertexid_to_componentid?.get(k) ?? 0;
		let num_components = (new Set(vertexid_to_componentid.values())).size;
		let hue_max = 360;
		let offset = 200;
		let hue = (offset + hue_max / num_components * component_id) % hue_max;
		let color = `oklch(50% 0.5 ${hue})`
		return color;
	}

	// function addVertex(x: number, y: number) {
	// 	N++;
	// 	const newId = next_id;
		
	// 	graph[newId] = []
	// 	embedding[newId] = {x, y};

	// 	graph = graph; // force reaction
	// 	embedding = embedding; // force reaction
	// 	record_history(graph, embedding)
	// }

	// function removeItemAll(arr, value) {
	// 	var i = 0;
	// 	while (i < arr.length) {
	// 		if (arr[i] === value) {
	// 			arr.splice(i, 1);
	// 		} else {
	// 			++i;
	// 		}
	// 	}
	// 	return arr;
	// }

	// function removeVertex(id: string) {
	// 	N--;
		
	// 	delete graph[id];
	// 	delete embedding[id];
		
	// 	for (const [k, v] of Object.entries(graph)) {
	// 		graph[k] = removeItemAll(v, id);
	// 	}

	// 	graph = graph; // force reaction
	// 	embedding = embedding; // force reaction
	// 	record_history(graph, embedding)
	// }

	// function addEdge(u: string, v: string) {
	// 	graph[u].push(v);
	// 	graph[v].push(u);
	// 	graph = graph; // force reaction
	// 	record_history(graph, embedding)
	// }

	// function removeEdge(u: string, v: string) {
	// 	graph[u] = removeItemAll(graph[u], v);
	// 	graph[v] = removeItemAll(graph[v], u);
	// 	graph = graph; // force reaction
	// 	record_history(graph, embedding)
	// }

	// $: adj_string = graph_object_to_multigraph_string(graph);

	// $: embedding_string = embedding_to_embedding_string(embedding);

	let drag_from: string | null = null;

	let drag_to: {x: number, y: number} | null = null;

	// let error_msg = ''

	// function onKeyDown(evt: KeyboardEvent) {
	// 	if (evt.key === "Shift") {
	// 		moveMode = true;
	// 	}
	// 	if (evt.key === "z") {
	// 		history_pointer = Math.max(0, history_pointer-1);
	// 	}
	// 	if (evt.key === "y") {
	// 		history_pointer = Math.min(history.length-1, history_pointer+1);
	// 	}
	// }
	// function onKeyUp(evt: KeyboardEvent) {
	// 	if (evt.key === "Shift" && !disable_editing) {
	// 		moveMode = false;
	// 	}
	// }

	let svg_sidelength = 1000;

	// function regular_polygon_embedding(keys: string[], radius: number, center: {x: number, y: number}): Record<string, {x: number, y: number}> {
	// 	let rotateVector = function(rad) {
	// 		const vec = {x: 0, y: -1}
	// 		let cos = Math.cos(rad);
	// 		let sin = Math.sin(rad);
	// 		return {
	// 			x: vec.x * cos - vec.y * sin,
	// 			y: vec.x * sin + vec.y * cos
	// 		}
	// 	}

	// 	let points = [];

	// 	let n = keys.length;

	// 	for (let i = 0; i < n; i++) {
	// 		points.push(rotateVector(i*Math.PI*2/n))
	// 	}

	// 	const embedding = points.reduce((obj: Record<string, {x: number, y: number}>, point, i) => {
	// 		obj[keys[i]] = {
	// 			x: Math.round(center.x + (point.x * radius)),
	// 			y: Math.round(center.y + (point.y * radius))
	// 		};
	// 		return obj
	// 	}, {})

	// 	return embedding
	// }

	// function neigbors_has_correct_rotation(k: string): boolean {
	// 	if (graph.adj[k].length < 2) return true
		
	// 	const origin = embedding[k]
		
	// 	let min_orientation_idx = 0
	// 	let min_orientation = orientation(origin, embedding[graph[k][0]])
	// 	for (let i = 1; i < graph[k].length; i++) {
	// 		let candidate = orientation(origin, embedding[graph[k][i]])
	// 		if (candidate < min_orientation) {
	// 			min_orientation_idx = i
	// 			min_orientation = candidate
	// 		}
	// 	}

	// 	for (let i = 0; i < graph[k].length; i++) {
	// 		let idx = (min_orientation_idx + i) % graph[k].length
	// 		let other = graph[k][idx]
	// 	}

	// 	for (let i = 0; i < graph[k].length-1; i++) {
	// 		if (
	// 			orientation(origin, embedding[graph[k][(min_orientation_idx + i) % graph[k].length]])
	// 			> orientation(origin, embedding[graph[k][(min_orientation_idx + i + 1) % graph[k].length]])
	// 		) {
	// 			return false
	// 		}
	// 	}

	// 	return true
	// }
</script>
<!-- <svelte:window
	on:keydown={onKeyDown}
	on:keyup={onKeyUp}
/> -->

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<main class="grid gap-5 p-5">
	<div class="wrapper">
		<div class="canvas-editor">
			<div class="svg-wrapper">
				<svg
					viewBox={`${-svg_sidelength/2} ${-svg_sidelength/2} ${svg_sidelength} ${svg_sidelength}`}
					on:click={evt => {
						// if (moveMode) return;

						// let x2 = (evt.offsetX / evt.currentTarget.clientWidth) * svg_sidelength - svg_sidelength/2;
						// let y2 = (evt.offsetY / evt.currentTarget.clientHeight) * svg_sidelength - svg_sidelength/2;

						// x2 = Math.round(x2);
						// y2 = Math.round(y2);

						// const dist = 10;
						// for (const [k, {x: x1, y: y1}] of Object.entries(embedding)) {
						// 	if (
						// 		(x1-dist <= x2 && x2 <= x1+dist) &&
						// 		(y1-dist <= y2 && y2 <= y1+dist)
						// 	) {
						// 		return;
						// 	}
						// }
						// addVertex(x2, y2);
					}}

					on:pointermove={evt => {
						if (drag_from != null) {
							let x = (evt.offsetX / evt.currentTarget.clientWidth) * svg_sidelength - svg_sidelength/2;
							let y = (evt.offsetY / evt.currentTarget.clientHeight) * svg_sidelength - svg_sidelength/2;

							x = Math.round(x);
							y = Math.round(y);

							if (moveMode) {
								embedding[drag_from] = {x, y};
								record_history(graph, embedding)
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
					<!-- {#if drag_from != null && drag_to != null}
						<line
							stroke={component_color(drag_from)}
							stroke-width="5"
							x1={embedding[drag_from].x}
							y1={embedding[drag_from].y}
							x2={drag_to.x}
							y2={drag_to.y}
						/>
					{/if} -->
					<g id="edges_container">
						{#each Object.entries(graph.edges) as [k, UV]}
							{#if Number(k) > 0}
								<path
									on:click={(evt) => {
										// evt.stopPropagation();
										// if (!moveMode)
										// 	removeEdge(UV[0], UV[1]);
									}}
									stroke={component_color(UV[0])}
									stroke-width="5"
									fill="none"
									d={`
											M ${embedding[UV[0]].x} ${embedding[UV[0]].y}
											L ${embedding[UV[1]].x} ${embedding[UV[1]].y}
										`
									}
								/>
								<text
									x={embedding[UV[1]].x + ((embedding[UV[0]].x - embedding[UV[1]].x) / 2)}
									y={embedding[UV[1]].y + ((embedding[UV[0]].y - embedding[UV[1]].y) / 2)}
									text-anchor=middle
									dominant-baseline=middle
								>
									{k}
								</text>
							{/if}
						{/each}
					</g>
					<g id="vertices_container">
						{#each Object.entries(graph.adj) as [k, v]}
							<!-- {#if !neigbors_has_correct_rotation(k)}
								<circle
									r="15"
									cx={embedding[k].x}
									cy={embedding[k].y}
									fill={"orange"}
								></circle>
							{/if} -->
							<circle
								r="10"
								on:click={(evt) => {
									// if (moveMode) return;
									// evt.stopPropagation();
									// removeVertex(k);
								}}
								on:pointerdown={(evt) => {
									evt.stopPropagation();
									drag_from = k
								}}
								on:pointerup={(evt) => {
									// if (moveMode) return;
									// if (drag_from) {
									// 	addEdge(drag_from, k);
									// 	evt.currentTarget.setAttribute("stroke", "none")
									// }
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
								cx={embedding[k].x}
								cy={embedding[k].y}
								fill={component_color(k)}
							/>
							<text
								class="unselectable"
								x={embedding[k].x}
								y={embedding[k].y}
								font-size="1em"
								fill="white"
							>{k}</text>
						{/each}
					</g>
				</svg>
			</div>
		</div>
	</div>
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