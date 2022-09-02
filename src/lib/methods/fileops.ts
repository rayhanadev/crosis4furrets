import { Buffer } from 'node:buffer';

import type Crosis from '../crosis';

import type { api } from '@replit/protocol';

import ignore from 'ignore';

type ReadEncodingValues = BufferEncoding | undefined;

// prettier-ignore
type ReadEncodingType<T extends ReadEncodingValues> =
	T extends BufferEncoding
	? string
	: T extends undefined
	? Buffer : never;

// prettier-ignore
type DirectoryContentType<T extends boolean> =
	T extends true
	? api.File
	: T extends false
	? string : never;

export async function read<T extends ReadEncodingValues>(
	this: Crosis,
	path: string,
	encoding?: T,
): Promise<ReadEncodingType<T>> {
	const filesChan = await this.channel('files');

	const res = await filesChan.request({
		read: { path },
	});

	if (res.error) throw new Error('CrosisError: ' + res.error);

	return (
		encoding
			? Buffer.from(res.file.content).toString(encoding)
			: Buffer.from(res.file.content)
	) as ReadEncodingType<T>;
}

export async function readdir(
	this: Crosis,
	path: string,
	raw = false,
): Promise<DirectoryContentType<typeof raw>[]> {
	const filesChan = await this.channel('files');

	const res = await filesChan.request({
		readdir: { path },
	});

	if (res.error) throw new Error('CrosisError: ' + res.error);

	const { files } = res.files || {};

	return (
		raw ? files : files.map((file) => file.path)
	) as DirectoryContentType<typeof raw>[];
}

export async function recursedir(
	this: Crosis,
	path: string,
	withIgnore = true,
): Promise<string[]> {
	const ignoreFile = await this.gitignore();
	const ig =
		withIgnore && ignoreFile ? ignore().add(<string>ignoreFile) : false;

	const isDir = (file: api.File) => file.type && file.type === 1;

	const recurse = async (dirPath: string, filesArray = []) => {
		const files = await this.readdir(dirPath, true);
		let arrayOfFiles = filesArray;

		await Promise.all(
			files.map(async (file: api.File) => {
				const leadingPath = dirPath + '/' === './' ? '' : dirPath + '/';
				const filePath = leadingPath + file.path;

				if (ig && ig.ignores(filePath)) {
					if (isDir(file)) {
						arrayOfFiles = await recurse(filePath, arrayOfFiles);
					} else {
						arrayOfFiles.push(filePath);
					}
				}
			}),
		);

		return Promise.all(arrayOfFiles);
	};

	return await recurse(path);
}

export async function write(
	this: Crosis,
	path: string,
	file: string | Buffer,
): Promise<boolean> {
	const filesChan = await this.channel('files');

	let content: Uint8Array;

	if (Buffer.isBuffer(file)) {
		content = file;
	} else {
		const encoder = new TextEncoder();
		content = encoder.encode(file);
	}

	const res = await filesChan.request({
		write: { path, content },
	});

	if (res.error) throw new Error('CrosisError: ' + res.error);
	return res.ok ? true : false;
}

export async function mkdir(this: Crosis, path: string): Promise<boolean> {
	const filesChan = await this.channel('files');

	const res = await filesChan.request({
		mkdir: { path },
	});

	if (res.error) throw new Error('CrosisError: ' + res.error);
	return res.ok ? true : false;
}

export async function remove(this: Crosis, path: string): Promise<boolean> {
	const filesChan = await this.channel('files');

	const res = await filesChan.request({
		remove: { path },
	});

	if (res.error) throw new Error('CrosisError: ' + res.error);
	return res.ok ? true : false;
}

export async function removeAll(this: Crosis): Promise<boolean> {
	const files = <string[]>await this.readdir('.');
	for (const file of files) await this.remove(file);
	return true;
}

export async function move(
	this: Crosis,
	oldPath: string,
	newPath: string,
): Promise<boolean> {
	const filesChan = await this.channel('files');

	const res = await filesChan.request({
		move: { oldPath, newPath },
	});

	if (res.error) throw new Error('CrosisError: ' + res.error);
	return res.ok ? true : false;
}

export async function snapshot(this: Crosis): Promise<boolean> {
	const filesChan = await this.channel('snapshot');

	const res = await filesChan.request({
		fsSnapshot: {},
	});

	if (res.error) throw new Error('CrosisError: ' + res.error);
	return res.ok ? true : false;
}
