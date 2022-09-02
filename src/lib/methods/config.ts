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
	value: any;
}

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

export async function updateDotEnv(
	this: Crosis,
	env: Record<string, any>,
): Promise<Record<string, any> | boolean> {
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

export async function updateDotReplit(
	this: Crosis,
	ops: DotReplitOp[],
): Promise<Record<string, any> | boolean> {
	const chan = await this.channel('dotreplit');

	const res = await chan.request({ dotReplitUpdateRequest: { ops } });

	if (res.error) throw new Error('CrosisError: ' + res.error);
	return await this.dotReplit();
}

export async function gitignore(this: Crosis): Promise<string | boolean> {
	if (this.ignore) return this.ignore;

	const filesChan = await this.channel('files');

	const res = await filesChan.request({
		read: { path: '.gitignore' },
	});

	if (res.error) throw new Error('CrosisError: ' + res.error);
	return res.file ? Buffer.from(res.file.content).toString() : false;
}
