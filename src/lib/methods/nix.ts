import type Crosis from '../crosis';

import type { api } from '@replit/protocol';

export async function nixPackageAdd(
	this: Crosis,
	packages: string[],
): Promise<boolean> {
	const nixChan = await this.channel('nix');
	nixChan.onCommand((cmd) => {
		if (cmd.output) process.stdout.write(cmd.output);
		if (cmd.ok) {
			console.log(`[NIX]: Added ${packages.length} packages.`);
		}
	});

	const res = await nixChan.request({
		nixPackageAddRequest: { packages },
	});

	if (res.error) throw new Error('CrosisError: ' + res.error);
	return res.ok ? true : false;
}

export async function nixPackageRemove(
	this: Crosis,
	packages: string[],
): Promise<boolean> {
	const nixChan = await this.channel('nix');
	nixChan.onCommand((cmd) => {
		if (cmd.output) process.stdout.write(cmd.output);
		if (cmd.ok) {
			console.log(`[NIX]: Removed ${packages.length} packages.`);
		}
	});

	const res = await nixChan.request({
		nixPackageRemoveRequest: { packages },
	});

	if (res.error) throw new Error('CrosisError: ' + res.error);
	return res.ok ? true : false;
}

export async function nixPackageList(
	this: Crosis,
	raw: boolean = false,
): Promise<api.INixPackage[] | string[]> {
	const nixChan = await this.channel('nix');

	const res = await nixChan.request({ nixPackageListRequest: {} });

	if (res.error) throw new Error('CrosisError: ' + res.error);
	return raw
		? res.nixPackageListResponse.packages
		: res.nixPackageListResponse.packages.map(({ name }) => name);
}

export async function nixPackageSearch(
	this: Crosis,
	query: string,
	raw: boolean = false,
): Promise<api.INixPackage[] | string[]> {
	const nixChan = await this.channel('nix');

	const res = await nixChan.request({
		nixPackageSearchRequest: { query },
	});

	if (res.error) throw new Error('CrosisError: ' + res.error);
	return raw
		? res.nixPackageSearchResponse.packages
		: res.nixPackageSearchResponse.packages.map(({ name }) => name);
}

export async function nixChannels(this: Crosis): Promise<any[] | boolean> {
	const nixChan = await this.channel('nix');

	const res = await nixChan.request({ nixChannelsRequest: {} });

	if (res.error) throw new Error('CrosisError: ' + res.error);
	return res.nixChannelsResponse.channels;
}

export async function nixChannelLatest(this: Crosis): Promise<any | boolean> {
	const nixChan = await this.channel('nix');

	const res = await nixChan.request({ nixChannelLatestStableRequest: {} });

	if (res.error) throw new Error('CrosisError: ' + res.error);
	return res.nixChannelLatestStableResponse.channel;
}
