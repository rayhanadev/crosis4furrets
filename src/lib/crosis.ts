import { Client } from '@replit/crosis';
import type { Channel, DebugLog } from '@replit/crosis';
import type { FetchConnectionMetadataResult } from '@replit/crosis';

import { GraphQL } from '@rayhanadev/replit-gql';
import type { TGraphQLClient } from '@rayhanadev/replit-gql';

import type { Options } from './utils';
import type { ReadStream, WriteStream } from 'node:fs';

type InputStream =
	| ReadStream
	| (NodeJS.ReadStream & {
			fd: 0;
	  });

type OutputStream =
	| WriteStream
	| (NodeJS.WriteStream & {
			fd: 1;
	  });

type ErrorStream =
	| WriteStream
	| (NodeJS.WriteStream & {
			fd: 2;
	  });

interface Streams {
	stdin: InputStream;
	stdout: OutputStream;
	stderr: ErrorStream;
}

type MetadataHandlerFunc = (
	signal: AbortSignal,
	options: Options,
) => Promise<FetchConnectionMetadataResult>;

type ErrorHandlerFunc = (e: Error) => void;

type DebugHandlerFunc = (log: DebugLog<unknown>) => void;

interface User {
	id: number;
	username: string;
}

interface Language {
	id: string;
	engine: string;
	runner: boolean;
	packager: boolean;
	git: boolean;
	debugger: boolean;
	fs: boolean;
}

interface Repl {
	id: string;
	slug: string;
	language: string;
	isPrivate: boolean;
	lang: Language;
}

interface CrosisConfigOptions {
	token: string;
	replId: string;
	ignore?: string;
	streams?: Streams;
	metadataHandler?: MetadataHandlerFunc;
	errorHandler?: ErrorHandlerFunc;
	debugHandler?: DebugHandlerFunc;
	user?: User;
	repl?: Repl;
}

import { cmdTimeout, channel } from './methods/internals';
import { connect, persist, disconnect, destroy } from './methods/connection';
import {
	dotEnv,
	updateDotEnv,
	dotReplit,
	updateDotReplit,
	gitignore,
} from './methods/config';
import {
	read,
	readdir,
	recursedir,
	write,
	mkdir,
	move,
	remove,
	removeAll,
	stat,
	snapshot,
} from './methods/fileops';
import {
	packageAdd,
	packageInfo,
	packageInstall,
	packageList,
	packageRemove,
	packageSearch,
} from './methods/packager';
import {
	nixPackageAdd,
	nixPackageRemove,
	nixPackageList,
	nixPackageSearch,
	nixChannels,
	nixChannelLatest,
} from './methods/nix';
import {
	execRun,
	execRunStream,
	execInterp,
	execInterpStream,
	execShell,
	execShellStream,
	execStop,
} from './methods/exec';
import { lspStart, lspMessage } from './methods/editor';

import { encode, govalMetadata } from './utils';

/**
 * Creates a new Client that can be used to interact with a Remote Repl.
 *
 * @class
 * @param {CrosisConfigOptions} options
 * - the configuration options for the client.
 * @param {string} options.token
 * - the token to use for authentication.
 * @param {string} options.replId
 * - the replId to use for the client.
 * @param {string} [options.ignore]
 * - a gitignore file to enfore when recursing a Repl's directory.
 * @param {Streams} [options.streams]
 * - the streams to use for the client.
 * @param {ReadStream} [options.streams.stdin]
 * - the stdin stream for the client.
 * @param {WriteStream} [options.streams.stdout]
 * - the stdout stream for the client.
 * @param {WriteStream} [options.streams.stderr]
 * - the stderr stream for the client.
 * @param {MetadataHandlerFunc} [metadataHandler]
 * - a function to handle fetching goval metadata when connecting to a Repl.
 * @param {ErrorHandlerFunc} [errorHandler]
 * - a function to handle fetching goval metadata when connecting to a Repl.
 * @param {DebugHandlerFunc} [debugHandler]
 * - a function to handle fetching goval metadata when connecting to a Repl.
 * @param {Repl} [repl]
 * - custom Repl metadata to use instead of making a GraphQL request.
 * @param {User} [user]
 * - custom User metadata to use instead of making a GraphQL request.
 * @example
 *     import Client from 'crosis4furrets';
 *     const client = new Client({
 *     	token: process.env.REPLIT_TOKEN,
 *     	replId: process.env.REPLIT_REPL_ID,
 *     });
 *
 * @example
 *     import Client from 'crosis4furrets';
 *
 *     const client = new Client({
 *     	token: process.env.REPLIT_TOKEN,
 *     	replId: process.env.REPLIT_REPL_ID,
 *     	ignore: fs.readFileSync('default.gitignore'),
 *     });
 *
 * @example
 *     import fs from 'node:fs';
 *     import Client from 'crosis4furrets';
 *
 *     const client = new Client({
 *     	token: process.env.REPLIT_TOKEN,
 *     	replId: process.env.REPLIT_REPL_ID,
 *     	ignore: fs.readFileSync('default.gitignore'),
 *     });
 *
 * @example
 *     import fs from 'node:fs';
 *     import Client from 'crosis4furrets';
 *
 *     const client = new Client({
 *     	token: process.env.REPLIT_TOKEN,
 *     	replId: process.env.REPLIT_REPL_ID,
 *     	streams: {
 *     		stdin: process.stdin,
 *     		stdout: process.stdout,
 *     		stderr: fs.createWriteStream('error.txt'),
 *     	},
 *     });
 *
 * @example
 *     import fs from 'node:fs';
 *     import Client from 'crosis4furrets';
 *
 *     const client = new Client({
 *     	token: process.env.REPLIT_TOKEN,
 *     	replId: process.env.REPLIT_REPL_ID,
 *     	metadataHandler: (signal, { replId }) => {
 *     		// Mint a Repl's Goval Metadata Token
 *     		// somehow and return it.
 *     		return process.env.REPL_GOVAL_METADATA;
 *     	},
 *     });
 *
 * @example
 * import fs from 'node:fs';
 *     import Client from 'crosis4furrets';
 *
 *     const client = new Client({
 *     	token: process.env.REPLIT_TOKEN,
 *     	replId: process.env.REPLIT_REPL_ID,
 *     	user: { ... },
 *      repl: { ... },
 *     });
 *
 */
class CrosisClient {
	public replId: string;
	public user?: User;
	public repl?: Repl;
	public ignore: string;
	public connected: boolean;
	public persisting: boolean;
	public streams: Streams;
	public metadataHandler: MetadataHandlerFunc;
	public errorHandler: ErrorHandlerFunc;
	public debugHandler: DebugHandlerFunc;
	protected channels: Record<string, Channel>;
	protected client: Client;
	protected gql: TGraphQLClient;
	protected token: string;

	constructor(options: CrosisConfigOptions) {
		const {
			token,
			replId,
			ignore,
			streams,
			metadataHandler,
			errorHandler,
			debugHandler,
			repl,
			user,
		} = options;
		if (!token) throw new Error('UserError: Missing token parameter.');
		if (!replId) throw new Error('UserError: Missing replId parameter.');

		if (streams) {
			this.streams = {
				stdin: process.stdin,
				stdout: process.stdout,
				stderr: process.stderr,
				...streams,
			};
		} else {
			this.streams = {
				stdin: process.stdin,
				stdout: process.stdout,
				stderr: process.stderr,
			};
		}

		if (repl) this.repl = repl;
		if (user) this.user = user;

		this.metadataHandler = metadataHandler || govalMetadata;
		this.errorHandler = errorHandler || ((error) => { throw new Error(error.message) });
		this.debugHandler = debugHandler || null;

		this.token = encode(token);
		this.replId = replId;

		this.client = new Client();
		this.gql = GraphQL(token);

		this.ignore = ignore;

		this.channels = {};
		this.connected = false;
		this.persisting = false;
	}

	// ts-ignore: intellisense
	public cmdTimeout: typeof cmdTimeout;
	// ts-ignore: intellisense
	public channel: typeof channel;

	// ts-ignore: intellisense
	public connect: typeof connect;
	// ts-ignore: intellisense
	public persist: typeof persist;
	// ts-ignore: intellisense
	public disconnect: typeof disconnect;
	// ts-ignore: intellisense
	public destroy: typeof destroy;

	// ts-ignore: intellisense
	public dotEnv: typeof dotEnv;
	// ts-ignore: intellisense
	public updateDotEnv: typeof updateDotEnv;
	// ts-ignore: intellisense
	public dotReplit: typeof dotReplit;
	// ts-ignore: intellisense
	public updateDotReplit: typeof updateDotReplit;
	// ts-ignore: intellisense
	public gitignore: typeof gitignore;

	// ts-ignore: intellisense
	public read: typeof read;
	// ts-ignore: intellisense
	public readdir: typeof readdir;
	// ts-ignore: intellisense
	public recursedir: typeof recursedir;
	// ts-ignore: intellisense
	public write: typeof write;
	// ts-ignore: intellisense
	public mkdir: typeof mkdir;
	// ts-ignore: intellisense
	public move: typeof move;
	// ts-ignore: intellisense
	public remove: typeof remove;
	// ts-ignore: intellisense
	public removeAll: typeof removeAll;
	// ts-ignore: intellisense
	public stat: typeof stat;
	// ts-ignore: intellisense
	public snapshot: typeof snapshot;

	// ts-ignore: intellisense
	public packageAdd: typeof packageAdd;
	// ts-ignore: intellisense
	public packageInfo: typeof packageInfo;
	// ts-ignore: intellisense
	public packageInstall: typeof packageInstall;
	// ts-ignore: intellisense
	public packageList: typeof packageList;
	// ts-ignore: intellisense
	public packageRemove: typeof packageRemove;
	// ts-ignore: intellisense
	public packageSearch: typeof packageSearch;

	// ts-ignore: intellisense
	public nixPackageAdd: typeof nixPackageAdd;
	// ts-ignore: intellisense
	public nixPackageRemove: typeof nixPackageRemove;
	// ts-ignore: intellisense
	public nixPackageList: typeof nixPackageList;
	// ts-ignore: intellisense
	public nixPackageSearch: typeof nixPackageSearch;
	// ts-ignore: intellisense
	public nixChannels: typeof nixChannels;
	// ts-ignore: intellisense
	public nixChannelLatest: typeof nixChannelLatest;

	// ts-ignore: intellisense
	public execRun: typeof execRun;
	// ts-ignore: intellisense
	public execRunStream: typeof execRunStream;
	// ts-ignore: intellisense
	public execInterp: typeof execInterp;
	// ts-ignore: intellisense
	public execInterpStream: typeof execInterpStream;
	// ts-ignore: intellisense
	public execShell: typeof execShell;
	// ts-ignore: intellisense
	public execShellStream: typeof execShellStream;
	// ts-ignore: intellisense
	public execStop: typeof execStop;

	// ts-ignore: intellisense
	public lspStart: typeof lspStart;
	// ts-ignore: intellisense
	public lspMessage: typeof lspMessage;
}

CrosisClient.prototype.cmdTimeout = cmdTimeout;
CrosisClient.prototype.channel = channel;

CrosisClient.prototype.connect = connect;
CrosisClient.prototype.persist = persist;
CrosisClient.prototype.disconnect = disconnect;
CrosisClient.prototype.destroy = destroy;

CrosisClient.prototype.dotEnv = dotEnv;
CrosisClient.prototype.updateDotEnv = updateDotEnv;
CrosisClient.prototype.dotReplit = dotReplit;
CrosisClient.prototype.updateDotReplit = updateDotReplit;
CrosisClient.prototype.gitignore = gitignore;

CrosisClient.prototype.read = read;
CrosisClient.prototype.readdir = readdir;
CrosisClient.prototype.recursedir = recursedir;
CrosisClient.prototype.write = write;
CrosisClient.prototype.mkdir = mkdir;
CrosisClient.prototype.move = move;
CrosisClient.prototype.remove = remove;
CrosisClient.prototype.removeAll = removeAll;
CrosisClient.prototype.stat = stat;
CrosisClient.prototype.snapshot = snapshot;

CrosisClient.prototype.packageAdd = packageAdd;
CrosisClient.prototype.packageInfo = packageInfo;
CrosisClient.prototype.packageInstall = packageInstall;
CrosisClient.prototype.packageList = packageList;
CrosisClient.prototype.packageRemove = packageRemove;
CrosisClient.prototype.packageSearch = packageSearch;

CrosisClient.prototype.nixPackageAdd = nixPackageAdd;
CrosisClient.prototype.nixPackageRemove = nixPackageRemove;
CrosisClient.prototype.nixPackageList = nixPackageList;
CrosisClient.prototype.nixPackageSearch = nixPackageSearch;
CrosisClient.prototype.nixChannels = nixChannels;
CrosisClient.prototype.nixChannelLatest = nixChannelLatest;

CrosisClient.prototype.execRun = execRun;
CrosisClient.prototype.execRunStream = execRunStream;
CrosisClient.prototype.execInterp = execInterp;
CrosisClient.prototype.execInterpStream = execInterpStream;
CrosisClient.prototype.execShell = execShell;
CrosisClient.prototype.execShellStream = execShellStream;
CrosisClient.prototype.execStop = execStop;

CrosisClient.prototype.lspStart = lspStart;
CrosisClient.prototype.lspMessage = lspMessage;

export default CrosisClient;
