import ms from "ms"

export function timeAgo(timestamp: string | number | Date, timeOnly: boolean = false) {
	if (!timestamp) return 'never';
	return `${ms(Date.now() - new Date(timestamp).getTime())}${timeOnly ? '' : ' ago'}`;
}

export const scriptNames = [
	"is_planar",
	"is_cubic",
	"is_undirected",
	"is_connected",
	"count_hamcyc_brute_force",
	"contraction"
];

export function adj_string_to_adj(_adj_string: string): Record<string, Array<string>> {
	if (!_adj_string) return {};

	const lines = _adj_string.trim().split(/[\n\r]+/).map(x => x.trim().split(' '));

	const adj: Record<string, Array<string>> = {}

	for (const line of lines.slice(1)) {
		adj[line[0]] = line.slice(1)
	}

	return adj;
}

export function adj_to_adj_string(_adj: Record<number, Array<number>>): string {
	if (!_adj) return "";

	return  Object.keys(_adj).length + '\n'
		+ Object.entries(_adj)
			.reduce((prev, curr, i) => {
				return prev += `${curr[0]} ${Array.from(curr[1]).join(' ')}\n`
			}, "")
}

export function embedding_string_to_embedding(_embedding_string: string): Record<string, {x: number, y: number}> {
	if (!_embedding_string) return {};

	const lines = _embedding_string.trim().split('\n').map(x => x.trim().split(' ').map(x => Number(x)));

	const _embedding: Record<string, {x: number, y: number}> = {}

	for (const line of lines) {
		_embedding[line[0]] = {
			x: line.slice(1)[0],
			y: line.slice(1)[1]
		}
	}

	return _embedding;
}

export function embedding_to_embedding_string(_embedding: Record<number, {x: number, y: number}>): string {
	if (!_embedding) return "";

	return Object.entries(_embedding)
		.reduce((prev, curr, i) => {
			return prev += `${curr[0]} ${curr[1].x} ${curr[1].y}\n`
		}, "")
}