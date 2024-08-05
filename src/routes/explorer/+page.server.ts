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

		const graphs = [];
		let path = dir.toString();

		if (!fs.existsSync(path)) {
			path = path.substring(0, path.lastIndexOf('/'));
		}

		if (!fs.existsSync(path)) {
			return {
				error: 'Directory not found',
			};
		}

		const pathStats = fs.statSync(path);
		if (pathStats.isFile()) {
			const graphs = [{
				id: 0,
				name: dir,
				adj: fs.readFileSync(path, 'utf8')
			}];

			return {
				res: {
					graphs: graphs,
					dir: dir,
					directories: undefined,
					common_embedding: undefined
				}
			};
		} else if (pathStats.isDirectory()) {
			const files = fs.readdirSync(path);
			const graph_filenames = files.filter(file => file.endsWith('.in'));
			
			let id = 1;
			for (const graph_filename of graph_filenames) {
				const graph = fs.readFileSync(path + '/' + graph_filename, 'utf8');

				const embedding_path = path + '/' + graph_filename.replace('.in', '.emb');
				let embedding: undefined | string = undefined;
				if (fs.existsSync(embedding_path)) {
					embedding = fs.readFileSync(embedding_path, 'utf8');
				}

				graphs.push({
					id: id++,
					name: path + '/' + graph_filename,
					adj: graph,
					embedding: embedding
				});
			}

			let common_embedding = undefined;
			if (fs.existsSync('common_embedding.emb')) {
				common_embedding = fs.readFileSync(path + '/' + 'common_embedding.emb', 'utf8');
			}

			const directories = fs.readdirSync(path, { withFileTypes: true })
				.filter(d => d.isDirectory() || d.isFile() && d.name.endsWith('.in'))
				.map(d => d.name);
			return {
				res: {
					graphs: graphs,
					dir: path,
					directories: directories,
					common_embedding: common_embedding
				}
			};
		} else {
			return {
				error: 'Directory not found',
			};
		}
	},
};
