import fs from 'fs'
import type { Actions } from '@sveltejs/kit'

export function load() {
	return {
		cwd: process.cwd(),
	}
}

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const dir = formData.get('dir');
		
		if (!dir) {
			return {
				error: 'No directory specified',
			};
		}

		try {
			const { graphs, common_embedding } = get_graphs(dir.toString())
			const directories = fs.readdirSync(dir.toString(), { withFileTypes: true })
				.filter(dirent => dirent.isDirectory())
				.map(dirent => dirent.name)

			return {
				res: {
					graphs: graphs,
					dir: dir,
					directories: directories,
					common_embedding: common_embedding
				}
			};
		} catch (error) {
			if (error.code === 'ENOENT') {
				return {
					error: 'Directory not found',
				};
			}
		}
	},
};

function get_graphs(dir: string) {
	const graphs = []
	const files = fs.readdirSync(dir.toString())
	const graph_filenames = files.filter(file => file.endsWith('.in'))
	let id = 1
	for (let graph_filename of graph_filenames) {
		const graph = fs.readFileSync(dir + '/' + graph_filename, 'utf8')
		graphs.push({
			id: id++,
			name: dir + '/' + graph_filename,
			adj: graph,
		})
	}

	const common_embeddings_filenames = files.filter(file => file.endsWith('common_embedding.txt'))
	if (common_embeddings_filenames.length === 0) {
		return {
			graphs: graphs,
			common_embedding: undefined
		}
	}
	const common_embedding = fs.readFileSync(dir + '/' + common_embeddings_filenames?.[0], 'utf8')
	return {
		graphs: graphs,
		common_embedding: common_embedding
	}
}
