import type Crosis from '../crosis';

import { parse as dotenv } from 'dotenv';

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
	const filesChan = await this.channel('files');

	const res = await filesChan.request({
		read: { path: '.gitignore' },
	});

	if (res.error) throw new Error('CrosisError: ' + res.error);
	return res.file ? Buffer.from(res.file.content).toString() : false;
}
