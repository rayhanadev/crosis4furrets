import { Client } from '@replit/crosis';
import type { Channel } from '@replit/crosis';

import { GraphQL } from '@rayhanadev/replit-gql';
import type { TGraphQLClient } from '@rayhanadev/replit-gql';

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

import { cmdTimeout, channel } from './methods/internals';
import { connect, persist, close } from './methods/connection';
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
import { shellRun, shellExec, shellStop } from './methods/shell';
import { lsp } from './methods/editor';

class CrosisClient {
	public replId: string;
	public user?: User;
	public repl?: Repl;
	public ignore: string;
	public connected: boolean;
	public persisting: boolean;
	protected channels: Record<string, Channel>;
	protected client: Client;
	protected gql: TGraphQLClient;
	protected token: string;

	constructor(options: CrosisConfigOptions) {
		const { token, replId, ignore } = options;
		if (!token) throw new Error('UserError: Missing token parameter.');
		if (!replId) throw new Error('UserError: Missing replId parameter.');

		this.client = new Client();
		this.gql = GraphQL(token);

		this.token = token;
		this.replId = replId;

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
	public close: typeof close;

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
	public shellRun: typeof shellRun;
	// ts-ignore: intellisense
	public shellExec: typeof shellExec;
	// ts-ignore: intellisense
	public shellStop: typeof shellStop;

	// ts-ignore: intellisense
	public lsp: typeof lsp;
}

CrosisClient.prototype.cmdTimeout = cmdTimeout;
CrosisClient.prototype.channel = channel;

CrosisClient.prototype.connect = connect;
CrosisClient.prototype.persist = persist;
CrosisClient.prototype.close = close;

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

CrosisClient.prototype.shellRun = shellRun;
CrosisClient.prototype.shellExec = shellExec;
CrosisClient.prototype.shellStop = shellStop;

CrosisClient.prototype.lsp = lsp;

export default CrosisClient;
