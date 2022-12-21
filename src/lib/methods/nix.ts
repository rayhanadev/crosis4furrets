import type Crosis from '../crosis';

import type { api } from '@replit/protocol';

/**
 * Add a Nix package to a remote Repl.
 *
 * @param {string[]} packages
 * - names of the packages to install.
 * @param {boolean} [verbose=false]
 * - if true, streams messages to input/output/error streams.
 * @example
 *     await client.nixPackageAdd(['nodejs-16_x']);
 *
 * @example
 *     await client.nixPackageAdd(['nodejs-16_x'], true);
 *
 * @example
 *     const success = await client.nixPackageAdd(['nodejs-16_x']);
 *     if (success) console.log('Added a package to a remote Repl.');
 *
 */
export async function nixPackageAdd(
	this: Crosis,
	packages: string[],
	verbose = false,
): Promise<boolean> {
	const nixChan = await this.channel('nix');

	if (verbose) {
		nixChan.onCommand((cmd) => {
			if (cmd.output) this.streams.stdout.write(cmd.output);
			if (cmd.ok) {
				this.streams.stdout.write(
					`\nNix Packager: Added ${packages.length} packages.`,
				);
			}
		});
	}

	const res = await nixChan.request({
		nixPackageAddRequest: { packages },
	});

	if (res.error) throw new Error('CrosisError: ' + res.error);
	return res.ok ? true : false;
}

/**
 * Remove a Nix package from a remote Repl.
 *
 * @param {string[]} packages
 * - names of the packages to remove.
 * @param {boolean} [verbose=false]
 * - if true, streams messages to input/output/error streams.
 * @example
 *     await client.nixPackageRemove(['nodejs-16_x']);
 *
 * @example
 *     await client.nixPackageRemove(['nodejs-16_x'], true);
 *
 * @example
 *     const success = await client.nixPackageRemove(['nodejs-16_x']);
 *     if (success) console.log('Removed a package from a remote Repl.');
 *
 */
export async function nixPackageRemove(
	this: Crosis,
	packages: string[],
	verbose = false,
): Promise<boolean> {
	const nixChan = await this.channel('nix');

	if (verbose) {
		nixChan.onCommand((cmd) => {
			if (cmd.output) this.streams.stdout.write(cmd.output);
			if (cmd.ok) {
				this.streams.stdout.write(
					`\nNix Packager: Removed ${packages.length} packages.`,
				);
			}
		});
	}

	const res = await nixChan.request({
		nixPackageRemoveRequest: { packages },
	});

	if (res.error) throw new Error('CrosisError: ' + res.error);
	return res.ok ? true : false;
}

/**
 * List all installed Nix packages in a remote Repl.
 *
 * @param {boolean} [raw=false]
 * - whether to list protocol NixPackage types or a string array.
 * @example
 *     const nixPackages = await client.nixPackageList();
 *     console.log(nixPackages);
 *
 * @example
 *     const nixPackages = await client.nixPackageList(true);
 *     console.log(nixPackages);
 *
 */
export async function nixPackageList(
	this: Crosis,
	raw = false,
): Promise<api.INixPackage[] | string[]> {
	const nixChan = await this.channel('nix');

	const res = await nixChan.request({ nixPackageListRequest: {} });

	if (res.error) throw new Error('CrosisError: ' + res.error);
	return raw
		? res.nixPackageListResponse.packages
		: res.nixPackageListResponse.packages.map(({ name }) => name);
}

/**
 * Search for new Nix packages to add.
 *
 * @param {string} query
 * - query to search for Nix Packages.
 * @param {boolean} [raw=false]
 * - whether to list protocol NixPackage types or a string array.
 * @example
 *     const nixPackages = await client.nixPackageSearch('nodejs');
 *     console.log(nixPackages);
 *
 * @example
 *     const nixPackages = await client.nixPackageSearch('nodejs', true);
 *     console.log(nixPackages);
 *
 */
export async function nixPackageSearch(
	this: Crosis,
	query: string,
	raw = false,
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

/**
 * Get available Nix Channels that a Repl can use.
 *
 * @example
 *     const nixChannels = await client.nixChannels();
 *     console.log(nixChannels);
 *
 */
export async function nixChannels(this: Crosis): Promise<string[] | boolean> {
	const nixChan = await this.channel('nix');

	const res = await nixChan.request({ nixChannelsRequest: {} });

	if (res.error) throw new Error('CrosisError: ' + res.error);
	return res.nixChannelsResponse.channels;
}

/**
 * Get the latest available Nix Channel that a Repl can use.
 *
 * @example
 *     const latestNixChannel = await client.nixChannelsLatest();
 *     console.log(latestNixChannels);
 *
 */
export async function nixChannelLatest(
	this: Crosis,
): Promise<string | boolean> {
	const nixChan = await this.channel('nix');

	const res = await nixChan.request({ nixChannelLatestStableRequest: {} });

	if (res.error) throw new Error('CrosisError: ' + res.error);
	return res.nixChannelLatestStableResponse.channel;
}
