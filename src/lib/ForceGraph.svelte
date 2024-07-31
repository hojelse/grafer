<script lang="ts">
	import { onMount } from 'svelte';
	import * as d3 from 'd3';

	interface Node {
		id: string;
		x?: number;
		y?: number;
		fx?: number | null;
		fy?: number | null;
	}

	interface Link {
		source: string | Node;
		target: string | Node;
	}

	export let name: number = -1;
	export let adj: Record<string, Array<string>>;

	function adj_to_node_array(adj: any) {
		return Object.keys(adj).map(x => { return { id: x }})
	}

	function adj_to_links_array(adj: any) {
		let links = []

		for (let [a,bs] of Object.entries(adj)) {
			for (let b of bs) {
				links.push({ source: a, target: `${b}`})
			}
		}

		return links
	}

	let nodes: Node[] = adj_to_node_array(adj);
	let links: Link[] = adj_to_links_array(adj);

	onMount(() => {
		const svg = d3.select<SVGSVGElement, unknown>(`#svg-${name}`);
		const width = +svg.attr("width");
		const height = +svg.attr("height");

		const simulation = d3.forceSimulation(nodes)
			.force("link", d3.forceLink(links).id((d: Node) => d.id).distance(60))
			.force("charge", d3.forceManyBody().strength(-100))
			.force("center", d3.forceCenter(width / 2, height / 2))
			.on("tick", ticked);
	
		const link = svg.append("g")
			.attr("class", "links")
			.selectAll("line")
			.data(links)
			.enter().append("line")
			.attr("stroke-width", 1.5)
			.attr("stroke", "black")

		const node = svg.append("g")
			.attr("class", "nodes")
			.selectAll("text")
			.data(nodes)
			.enter()
			.append("text")
			.attr("text-anchor", "middle")
			.attr("dominant-baseline", "middle")
			.attr("filter", "url(#solid)")
			.text(d => d.id)
			.call(d3.drag<SVGTextElement, Node>()
				.on("start", dragstarted)
				.on("drag", dragged)
				.on("end", dragended))
	
		function ticked() {
			link
				.attr("x1", d => (d.source as Node).x)
				.attr("y1", d => (d.source as Node).y)
				.attr("x2", d => (d.target as Node).x)
				.attr("y2", d => (d.target as Node).y);

			node
				.attr("x", d => d.x)
				.attr("y", d => d.y);
		}

		function dragstarted(event: d3.D3DragEvent<SVGCircleElement, Node, Node>, d: Node) {
			if (!event.active) simulation.alphaTarget(0.3).restart();
			d.fx = d.x;
			d.fy = d.y;
		}

		function dragged(event: d3.D3DragEvent<SVGCircleElement, Node, Node>, d: Node) {
			d.fx = event.x;
			d.fy = event.y;
		}

		function dragended(event: d3.D3DragEvent<SVGCircleElement, Node, Node>, d: Node) {
			if (!event.active) simulation.alphaTarget(0);
			d.fx = null;
			d.fy = null;
		}
	});
</script>

<svg id={`svg-${name}`} width="800" height="600">
	<defs>
		<filter x="0" y="0" width="1" height="1" id="solid">
			<feFlood flood-color={`rgb(var(--background-rgb))`} result="bg" />
			<feMerge>
			<feMergeNode in="bg"/>
			<feMergeNode in="SourceGraphic"/>
			</feMerge>
		</filter>
	</defs>
</svg>

<style>
	.links line {
		stroke: #999;
		stroke-opacity: 0.6;
	}

	.nodes circle {
		fill: #69b3a2;
		stroke: #fff;
		stroke-width: 1.5px;
	}
  </style>
  