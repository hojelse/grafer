import { execSync } from "child_process";
import { scriptNames } from "$lib/util.client";

export async function runPythonScript(scriptName: string, inputString: string) {
	const execStart = performance.now();

	console.log(`running ${scriptName}.py with inputString:`, inputString)

	const child = execSync(`python3 ../thesis/code/${scriptName}.py`, { input: inputString });

	const execEnd = performance.now();
	const duration = execEnd - execStart;

	const outputString = child.toString('utf-8');

	let returnObj: Record<string, string | number> = {}

	const timestamp = new Date().toISOString()

	returnObj[scriptName + "_outputString"] = outputString
	returnObj[scriptName + "_duration"] = Math.floor(duration)
	returnObj[scriptName + "_timestamp"] = timestamp

	return returnObj
}

export const computedPropertyActions = scriptNames.reduce((obj, scriptName) => {
	obj[scriptName] = async ({ request }) => {
		const data = await request.formData();
		const inputString = data.get("inputString");
		const moreInputString = data.get("moreInputString");
		return runPythonScript(scriptName, inputString + moreInputString)
	}
	return obj;
}, {});

export function validate_name(name: string): string {
	if (name.replaceAll(/[a-zA-Z0-9,\ ]/gi, '').length != 0) throw new Error('name must be alphanumeric')
	return name;
}

export function validate_adj(adj: string): string {
	if (!adj) throw new Error('adj is required')
	if (adj.replaceAll(/[0-9\s]/gi, '').length != 0) throw new Error('adj must be a valid adjacency matrix')
	return adj;
}
export function validate_embedding(embedding: string): string {
	if (!embedding) throw new Error('embedding is required')
	if (embedding.replaceAll(/[0-9\s]/gi, '').length != 0) throw new Error('embedding must be valid')
	return embedding;
}

export function validate_id(id: string | number): number {
	if (!id) throw new Error('id is required')
	return Number(id);
}