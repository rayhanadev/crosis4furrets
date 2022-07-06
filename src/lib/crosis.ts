import WebSocket from 'ws';
import readline from 'readline';
import { Buffer } from 'buffer';

import { Client } from '@replit/crosis';
import type { Channel } from '@replit/crosis';
import type { api } from '@replit/protocol';

import { compile } from 'gitignore-parser';

import { govalMetadata, GraphQL } from './utils.js';

interface CrosisConfigOptions {
	token: string;
	replId: string;
	ignore?: string;
}

interface User {
	id: number;
	username: string;
}

interface Language {
	id: string;
	runner: boolean;
	packager3: boolean;
	terminal: boolean;
	interpreter: boolean;
	engine: string;
	mainFile: string | null;
	supportsMultiFiles: boolean;
}

interface Repl {
	id: string;
	slug: string;
	language: string;
	isPrivate: boolean;
	lang: Language;
}

interface ConfigFiles {
	'.replit': () => Promise<string | boolean>;
	'replit.nix': () => Promise<string | boolean>;
	ignore: () => Promise<string | boolean>;
	env: null;
}

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

// prettier-ignore
type PackageListContentType<T extends boolean> =
	T extends true
		? api.IPackage
		: T extends false
			? string : never;

class CrosisClient {
	private token: string;
	replId: string;
	protected client: Client;
	protected gql: GraphQL;
	user?: User;
	repl?: Repl;
	configFiles: ConfigFiles;
	protected channels: {
		[index: string]: Channel;
	};
	connected: boolean;
	persisting: boolean;

	constructor(options: CrosisConfigOptions) {
		const { token, replId, ignore } = options;
		if (!token) throw new Error('UserError: Missing token parameter.');

		this.client = new Client();
		this.gql = new GraphQL(token);

		this.token = token;
		this.replId = replId;

		const getReplConfig = async (): Promise<string | boolean> => {
			try {
				const file = <string>await this.read('.replit', 'utf8');
				return file && file.length > 0 ? file : false;
			} catch (error) {
				return false;
			}
		};

		const getReplNix = async (): Promise<string | boolean> => {
			try {
				const file = <string>await this.read('replit.nix', 'utf8');
				return file && file.length > 0 ? file : false;
			} catch (error) {
				return false;
			}
		};

		const getReplIgnore = async (): Promise<string | boolean> => {
			try {
				const file = ignore
					? ignore
					: <string>await this.read('.gitignore', 'utf8');
				return file && file.length > 0 ? file : false;
			} catch (error) {
				return false;
			}
		};

		this.configFiles = {
			'.replit': () => getReplConfig(),
			'replit.nix': () => getReplNix(),
			ignore: () => getReplIgnore(),
			env: null,
		};

		this.channels = {};
		this.connected = false;
		this.persisting = false;
	}

	private async cmdTimeout(
		channel: Channel,
		timeout: number,
	): Promise<boolean> {
		return new Promise((res, rej) => {
			let timeoutId: ReturnType<typeof setTimeout>;
			let promiseDidFinish = false;

			const listener = (cmd: api.ICommand) => {
				if (!promiseDidFinish && cmd.state === 0 && !cmd.session) {
					promiseDidFinish = true;
					clearTimeout(timeoutId);
					console.log('[RUNNER]: Exited runner.');
					res(cmd.ok ? true : false);
				}
			};

			if (timeout && timeout > 0) {
				timeoutId = setTimeout(() => {
					promiseDidFinish = true;
					console.log('[RUNNER]: Timed out.');
					rej('The runner timed out.');
				}, timeout);
			}

			channel.onCommand(listener);
		});
	}

	async connect(): Promise<void> {
		if (!this.replId)
			throw new Error(
				'UserError: No ReplID Found. Either pass a ReplID into the constructor.',
			);

		this.user = (await this.gql.request('CurrentUser')).currentUser;
		this.repl = (await this.gql.request('Repl', { id: this.replId })).repl;

		await new Promise<void>((res) => {
			const context = null;

			const fetchConnectionMetadata = async (signal: AbortSignal) => {
				return await govalMetadata(signal, {
					token: this.token,
					replId: this.replId,
				});
			};

			this.client.open(
				{
					context,
					fetchConnectionMetadata,
					WebSocketClass: WebSocket,
				},
				({ channel }) => {
					if (!channel) return;
					this.channels['chan0'] = channel;

					this.connected = true;
					res();
				},
			);

			this.client.setUnrecoverableErrorHandler((error) => {
				throw new Error(error.message);
			});
		});
	}

	async persist(): Promise<boolean> {
		const gcsfilesChan = <Channel>await this.channel('gcsfiles');

		const res = await gcsfilesChan.request({
			persist: { path: '' },
		});

		if (res.error) throw new Error('CrosisError: ' + res.error);
		if (res.ok) this.persisting = true;
		return res.ok ? true : false;
	}

	close(): void {
		if (this.connected === false) {
			throw new Error(
				'UserError: Cannot close connection because the client is not connected.',
			);
		}
		this.client.close();
		this.connected = false;
	}

	async channel(name: string): Promise<Channel> {
		const stored = this.channels[name];
		if (stored) {
			return stored;
		} else {
			const chan = await new Promise<Channel>((res, rej) => {
				this.client.openChannel(
					{ service: name },
					({ channel, error }) => {
						if (error) rej(error);
						if (channel) res(channel);
					},
				);
			});

			this.channels[name] = chan;
			return chan;
		}
	}

	async read<T extends ReadEncodingValues>(
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

	async readdir(
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

	async recursedir(path: string, withIgnore = true): Promise<string[]> {
		const ignoreFile = await this.configFiles.ignore();
		const ignore =
			withIgnore && ignoreFile ? compile(<string>ignoreFile) : false;

		const isDir = (file: api.File) => file.type && file.type === 1;

		const recurse = async (dirPath: string, filesArray = []) => {
			const files = await this.readdir(dirPath, true);
			let arrayOfFiles = filesArray;

			await Promise.all(
				files.map(async (file: api.File) => {
					if (ignore ? ignore.accepts(file.path) : true) {
						if (isDir(file)) {
							arrayOfFiles = await recurse(
								dirPath + '/' + file.path,
								arrayOfFiles,
							);
						} else {
							arrayOfFiles.push(dirPath + '/' + file.path);
						}
					}
				}),
			);

			return Promise.all(arrayOfFiles);
		};

		return await recurse(path);
	}

	async write(path: string, file: string | Buffer): Promise<boolean> {
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

	async mkdir(path: string): Promise<boolean> {
		const filesChan = await this.channel('files');

		const res = await filesChan.request({
			mkdir: { path },
		});

		if (res.error) throw new Error('CrosisError: ' + res.error);
		return res.ok ? true : false;
	}

	async remove(path: string): Promise<boolean> {
		const filesChan = await this.channel('files');

		const res = await filesChan.request({
			remove: { path },
		});

		if (res.error) throw new Error('CrosisError: ' + res.error);
		return res.ok ? true : false;
	}

	async removeAll(): Promise<boolean> {
		const files = <string[]>await this.readdir('.');
		for (const file of files) await this.remove(file);
		return true;
	}

	async move(oldPath: string, newPath: string): Promise<boolean> {
		const filesChan = await this.channel('files');

		const res = await filesChan.request({
			move: { oldPath, newPath },
		});

		if (res.error) throw new Error('CrosisError: ' + res.error);
		return res.ok ? true : false;
	}

	async packageInstall(): Promise<boolean> {
		if (!this.repl.lang.packager3) return false;

		const packager = await this.channel('packager3');
		packager.onCommand((cmd) => {
			if (cmd.output) process.stdout.write(cmd.output);
			if (cmd.ok) {
				console.log('[PACKAGER]: Packages installed.');
			}
		});

		const res = await packager.request({ packageInstall: {} });

		if (res.error) throw new Error('CrosisError: ' + res.error);
		return res.ok ? true : false;
	}

	async packageAdd(packages: string[]): Promise<boolean> {
		if (!this.repl.lang.packager3) return false;

		const packager = await this.channel('packager3');
		packager.onCommand((cmd) => {
			if (cmd.output) process.stdout.write(cmd.output);
			if (cmd.ok) {
				console.log(`PACKAGER]: Added ${packages.length} packages.`);
			}
		});

		const pkgs = [];

		for (let i = packages.length; i >= 0; i--) {
			pkgs.push(this.packageInfo(pkgs[i]));
		}

		await Promise.all(pkgs);

		const res = await packager.request({
			packageAdd: { pkgs },
		});

		if (res.error) throw new Error('CrosisError: ' + res.error);
		return res.ok ? true : false;
	}

	async packageRemove(packages: string[]): Promise<boolean> {
		if (!this.repl.lang.packager3) return false;

		const packager = await this.channel('packager3');
		packager.onCommand((cmd) => {
			if (cmd.output) process.stdout.write(cmd.output);
			if (cmd.ok) {
				console.log(`PACKAGER]: Removed ${packages.length} packages.`);
			}
		});

		const pkgs = [];

		for (let i = packages.length; i >= 0; i--) {
			pkgs.push(this.packageInfo(pkgs[i]));
		}

		await Promise.all(pkgs);

		const res = await packager.request({
			packageRemove: { pkgs },
		});

		if (res.error) throw new Error('CrosisError: ' + res.error);
		return res.ok ? true : false;
	}

	async packageList(
		raw = false,
	): Promise<PackageListContentType<typeof raw>[] | boolean> {
		if (!this.repl.lang.packager3) return false;

		const packager = await this.channel('packager3');

		const res = await packager.request({ packageListSpecfile: {} });

		if (res.error) throw new Error('CrosisError: ' + res.error);
		return raw
			? res.packageListSpecfileResp.pkgs
			: res.packageListSpecfileResp.pkgs.map(({ name }) => name);
	}

	async packageSearch(query: string): Promise<api.IPackage[] | boolean> {
		if (!this.repl.lang.packager3) return false;

		const packager = await this.channel('packager3');

		const res = await packager.request({
			packageSearch: { query },
		});

		if (res.error) throw new Error('CrosisError: ' + res.error);
		return res.packageSearchResp.results;
	}

	async packageInfo(name: string): Promise<api.IPackage | boolean> {
		if (!this.repl.lang.packager3) return false;

		const packager = await this.channel('packager3');

		const res = await packager.request({
			packageInfo: {
				pkg: { name },
			},
		});

		if (res.error) throw new Error('CrosisError: ' + res.error);
		return res.packageInfoResp.pkg;
	}

	async shellRun(timeout?: number): Promise<boolean> {
		if (!this.repl.lang.runner) return false;

		await this.packageInstall();

		const runChan = await this.channel('shellrun2');

		const rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout,
			terminal: true,
		});

		let lastLine = '';

		runChan.onCommand((cmd) => {
			if (cmd.output) {
				if (lastLine.startsWith(cmd.output)) {
					lastLine = lastLine.slice(cmd.output.length);
					return;
				}
				process.stdout.write(cmd.output);
			}
			if (cmd.hint) process.stdout.write('Hint: ' + cmd.hint.text);
		});

		runChan.send({ clear: {} });
		runChan.send({ runMain: {} });
		rl.on('line', (input) => {
			lastLine = input + '\r\r\n';
			runChan.send({ input });
			runChan.send({ input: '\r\n' });
		});

		return await this.cmdTimeout(runChan, timeout);
	}

	async shellExec(
		cmd: string,
		args?: string[],
		timeout?: number,
	): Promise<boolean> {
		if (!this.repl.lang.runner) return false;

		await this.packageInstall();

		const runChan = await this.channel('shellrun2');

		const rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout,
			terminal: true,
		});

		let lastLine = '';

		runChan.onCommand((cmd) => {
			if (cmd.output) {
				if (lastLine.startsWith(cmd.output)) {
					lastLine = lastLine.slice(cmd.output.length);
					return;
				}
				process.stdout.write(cmd.output);
			}
			if (cmd.hint) process.stdout.write('Hint: ' + cmd.hint.text);
		});

		const exec = args ? `${cmd} ${args.join(' ')}` : cmd;

		runChan.send({ clear: {} });
		runChan.send({ input: exec });
		rl.on('line', (input) => {
			lastLine = input + '\r\r\n';
			runChan.send({ input });
			runChan.send({ input: '\r\n' });
		});

		return await this.cmdTimeout(runChan, timeout);
	}

	async shellStop(timeout?: number): Promise<boolean> {
		if (!this.repl.lang.interpreter) return false;

		const runChan = await this.channel('interp2');
		runChan.send({ clear: {} });

		return await this.cmdTimeout(runChan, timeout);
	}

	async snapshot(): Promise<boolean> {
		const filesChan = await this.channel('snapshot');

		const res = await filesChan.request({
			fsSnapshot: {},
		});

		if (res.error) throw new Error('CrosisError: ' + res.error);
		return res.ok ? true : false;
	}

	async lsp(message: string): Promise<boolean> {
		const lspChan = await this.channel('lsp');

		const res = await lspChan.request({
			input: message,
		});

		if (res.error) throw new Error('CrosisError: ' + res.error);
		return res.ok ? true : false;
	}
}

export default CrosisClient;
