import type Crosis from '../crosis';

import { parse as dotenv } from 'dotenv';
import stringify from 'dotenv-stringify';

type DotReplitOps = 'add' | 'remove';

type DotReplitOpPaths =
	| 'run'
	| 'compile'
	| 'debugger'
	| 'language'
	| 'onBoot'
	| 'packager'
	| 'interpreter'
	| 'entrypoint'
	| 'languages'
	| 'unitTest'
	| 'hidden'
	| 'nix'
	| 'audio'
	| 'hosting'
	| 'env'
	| 'gitHubImport'
	| 'auth'
	| 'hintsList'
	| 'ports';

interface DotReplitOp {
	op: DotReplitOps;
	path: DotReplitOpPaths;
	value?: any;
}

/**
 * Read a Repl's Secrets via the .env file.
 *
 * @example
 *     const dotenv = await client.dotEnv();
 *     console.log(dotenv);
 *
 */
export async function dotEnv(
	this: Crosis,
): Promise<Record<string, any> | boolean> {
	const filesChan = await this.channel('files');

	const res = await filesChan.request({
		read: { path: '.env' },
	});

	if (res.error) throw new Error('CrosisError: ' + res.error);
	return res.file ? dotenv(Buffer.from(res.file.content)) : false;
}

/**
 * Update a Repl's Secrets via an object of secrets.
 *
 * @param {{ string }} env
 * - Secrets to merge into the Repl's existing secrets.
 * @example
 *     const dotenv = await client.updateDotEnv({ MY_API_KEY: 'SECRET_VALUE' });
 *     console.log(dotenv);
 *
 */
export async function updateDotEnv(
	this: Crosis,
	env: Record<string, string>,
): Promise<Record<string, string> | boolean> {
	const prevEnv = await this.dotEnv();
	let newEnv = {};

	if (prevEnv) newEnv = Object.assign({}, prevEnv, env);
	else newEnv = env;

	const envFile = stringify(newEnv);

	const filesChan = await this.channel('files');

	const encoder = new TextEncoder();
	const content = encoder.encode(envFile);

	const res = await filesChan.request({
		write: { path: '.env', content },
	});

	if (res.error) throw new Error('CrosisError: ' + res.error);
	return res.ok ? await this.dotEnv() : false;
}

/**
 * Read a Repl's DotReplit configuration via the .replit file.
 *
 * @example
 *     const dotreplit = await client.dotReplit();
 *     console.log(dotreplit);
 *
 */
export async function dotReplit(
	this: Crosis,
): Promise<Record<string, any> | boolean> {
	const dotReplitChan = await this.channel('dotreplit');

	const res = await dotReplitChan.request({
		dotReplitGetRequest: {},
	});

	if (res.error) throw new Error('CrosisError: ' + res.error);
	return res.dotReplitGetResponse
		? res.dotReplitGetResponse.dotReplit
		: false;
}

/**
 * Update a Repl's DotReplit configuration via an array of DotReplitOps.
 *
 * @param {DotReplitOps[]} ops
 * - An array of DotReplitOps to execute.
 * @example
 *     const dotreplit = await client.updateDotReplit([
 *     	{ op: 'add', path: 'run', value: 'node index.js' },
 *     	{ op: 'add', path: 'entrypoint', value: 'index.js' },
 *     	{ op: 'remove', path: 'interpreter' },
 *     ]);
 *     console.log(dotreplit);
 *
 */
export async function updateDotReplit(
	this: Crosis,
	ops: DotReplitOp[],
): Promise<Record<string, any> | boolean> {
	const chan = await this.channel('dotreplit');

	const res = await chan.request({ dotReplitUpdateRequest: { ops } });

	if (res.error) throw new Error('CrosisError: ' + res.error);
	return await this.dotReplit();
}

/**
 * Read a Repl's Gitignore configuration via the .gitignore file.
 *
 * @example
 *     const gitignore = await client.gitignore();
 *     console.log(gitignore);
 *
 */
export async function gitignore(this: Crosis): Promise<string | boolean> {
	if (this.ignore) return this.ignore;

	const filesChan = await this.channel('files');

	try {
		const res = await filesChan.request({
			read: { path: '.gitignore' },
		});

		if (res.error) return false;
		return res.file ? Buffer.from(res.file.content).toString() : false;
	} catch {
		return false;
	}
}
