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

/**
 * Read a file from a remote Repl based on path. Specify an encoding for the
 * file or recieve a buffer of the file.
 *
 * @param {string} path
 * - the path to the file to read.
 * @param {ReadEncodingValues} [encoding]
 * - the encoding to use for the file.
 * @example
 *     const file = await client.read('index.js');
 *     console.log(file);
 *
 * @example
 *     const file = await client.read('index.js', 'utf8');
 *     console.log(file);
 *
 */
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

/**
 * Read a directory (flat) from a remote Repl and return filepaths based on
 * entrypoint. Specify raw to get protocol File types (used for
 * {@link Client#recursedir})
 * otherwise get a string array.
 *
 * @param {string} path
 * - the path to the file to read.
 * @param {boolean} [raw=false]
 * - whether to get protocol File types or a string array.
 * @example
 *     const paths = await client.readdir('.');
 *     console.log(paths);
 *
 * @example
 *     const files = await client.readdir('.', true);
 *     console.log(files);
 *
 */
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

/**
 * Read a directory (recursive) from a remote Repl and return filepaths based on
 * entrypoint. Specify withIgnore to respect .gitignore rules.
 *
 * @param {string} path
 * - the path to the file to read.
 * @param {boolean} [withIgnore=true]
 * - whether to use .gitignore rules.
 * @example
 *     const paths = await client.recursedir('.');
 *     console.log(paths);
 *
 * @example
 *     const paths = await client.recursedir('.', false);
 *     console.log(paths);
 *
 */
export async function recursedir(
	this: Crosis,
	path: string,
	withIgnore = true,
): Promise<string[]> {
	let ignoreFile = '';
	if (this.ignore && this.ignore.length > 0) {
		ignoreFile = this.ignore;
	} else {
		const replIgnoreFile = await this.gitignore();
		if (replIgnoreFile) {
			ignoreFile = replIgnoreFile as string;
		} else {
			ignoreFile = '';
		}
	}

	const ig =
		withIgnore && ignoreFile.length > 0
			? ignore().add(<string>ignoreFile)
			: false;

	const isDir = (file: api.File) => file.type && file.type === 1;

	const recurse = async (dirPath: string, filesArray = []) => {
		const files = await this.readdir(dirPath, true);
		let arrayOfFiles = filesArray;

		await Promise.all(
			files.map(async (file: api.File) => {
				const leadingPath = dirPath + '/' === './' ? '' : dirPath + '/';
				const filePath = leadingPath + file.path;

				if(!ig) {
					if (isDir(file)) {
						arrayOfFiles = await recurse(filePath, arrayOfFiles);
					} else {
						arrayOfFiles.push(filePath);
					}
					
					return;
				}

				if (ig && !ig.ignores(filePath)) {
					if (isDir(file)) {
						arrayOfFiles = await recurse(filePath, arrayOfFiles);
					} else {
						arrayOfFiles.push(filePath);
					}

					return;
				}
			}),
		);

		return Promise.all(arrayOfFiles);
	};

	return await recurse(path);
}

/**
 * Write to a file on a remote Repl.
 *
 * @param {string} path
 * - the path to the file to write to.
 * @param {file | Buffer} file
 * - a string or Buffer containing data to write.
 * @example
 *     await client.write('foo.txt', 'bar');
 *
 * @example
 *     const buffer = await fs.readFile('image.png');
 *     await client.write('foo.png', buffer);
 *
 * @example
 *     const success = await client.write('foo.txt', 'bar');
 *     if (success) console.log('Wrote to a file in a remote Repl.');
 *
 */
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

/**
 * Make a directory on a remote Repl.
 *
 * @param {string} path
 * - the path where a folder will be created.
 * @example
 *     await client.mkdir('foo');
 *
 * @example
 *     const success = await client.mkdir('foo');
 *     if (success) console.log('Made a directory in a remote Repl.');
 *
 */
export async function mkdir(this: Crosis, path: string): Promise<boolean> {
	const filesChan = await this.channel('files');

	const res = await filesChan.request({
		mkdir: { path },
	});

	if (res.error) throw new Error('CrosisError: ' + res.error);
	return res.ok ? true : false;
}

/**
 * Remove a file or directory on a remote Repl.
 *
 * @param {string} path
 * - the path to the resource which will be removed.
 * @example
 *     await client.remove('foo');
 *
 * @example
 *     const success = await client.remove('foo');
 *     if (success) console.log('Removed a resource from a remote Repl.');
 *
 */
export async function remove(this: Crosis, path: string): Promise<boolean> {
	const filesChan = await this.channel('files');

	const res = await filesChan.request({
		remove: { path },
	});

	if (res.error) throw new Error('CrosisError: ' + res.error);
	return res.ok ? true : false;
}

/**
 * Remove all files in a remote Repl.
 *
 * @example
 *     await client.removeAll();
 *
 * @example
 *     const success = await client.removeAll('foo');
 *     if (success) console.log('Emptied a remote Repl.');
 *
 */
export async function removeAll(this: Crosis): Promise<boolean> {
	const files = <string[]>await this.readdir('.');
	for (const file of files) await this.remove(file);
	return true;
}

/**
 * Move a resources from one location to another in a remote Repl.
 *
 * @param {string} oldPath
 * - the path to the resource which will be moved.
 * @param {string} newPath
 * - the path to where the resource will be moved.
 * @example
 *     await client.move('foo.txt', 'foo/foo.txt');
 *
 * @example
 *     const success = client.move('foo.txt', 'foo/foo.txt');
 *     if (success) console.log('Moved a file in a remote Repl.');
 *
 */
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

/**
 * Get information on a file in a remote Repl.
 *
 * @param {string} path
 * - the path to the resource which will be stat.
 * @example
 *     const stat = await client.stat('foo.txt');
 *     console.log(stat);
 *
 */
export async function stat(
	this: Crosis,
	path: string,
): Promise<api.IStatResult | boolean> {
	const filesChan = await this.channel('files');

	const res = await filesChan.request({
		stat: { path },
	});

	if (res.error) throw new Error('CrosisError: ' + res.error);
	return res.statRes ? res.statRes : false;
}

/**
 * Take a filesystem snapshot. Used to persist files in a Repl that doesn't use
 * `Client#persist()` after opening a connection.
 *
 * @example
 *     await client.snapshot();
 *
 * @example
 *     const success = await client.snapshot();
 *     if (success) console.log('Took a FS Snapshot in a remote Repl.');
 *
 */
export async function snapshot(this: Crosis): Promise<boolean> {
	const filesChan = await this.channel('snapshot');

	const res = await filesChan.request({
		fsSnapshot: {},
	});

	if (res.error) throw new Error('CrosisError: ' + res.error);
	return res.ok ? true : false;
}
