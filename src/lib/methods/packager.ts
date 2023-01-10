import type Crosis from '../crosis';

import type { api } from '@replit/protocol';

// prettier-ignore
type PackageListContentType<T extends boolean> =
	T extends true
	? api.IPackage
	: T extends false
	? string : never;

/**
 * Install all Packages in a remote Repl.
 *
 * @param {boolean} [verbose=false]
 * - if true, streams messages to input/output/error streams.
 * @example
 *     await client.packageInstall();
 *
 * @example
 *     await client.packageInstall(true);
 *
 * @example
 *     const success = await client.packageInstall();
 *     if (success) console.log('Installed all packages in a remote Repl.');
 *
 */
export async function packageInstall(
	this: Crosis,
	verbose = false,
): Promise<boolean> {
	if (!this.repl.lang.packager3) return false;
	const packager = await this.channel('packager3');

	if (verbose) {
		packager.onCommand((cmd) => {
			if (cmd.output) this.streams.stdout.write(cmd.output);
			if (cmd.ok) {
				this.streams.stdout.write('\nPackager: Packages installed.');
			}
		});
	}

	const res = await packager.request({ packageInstall: {} });

	if (res.error) throw new Error('CrosisError: ' + res.error);
	return res.ok ? true : false;
}

/**
 * Add a Package to a remote Repl.
 *
 * @param {string[]} packages
 * - names of the packages to install.
 * @param {boolean} [verbose=false]
 * - if true, streams messages to input/output/error streams.
 * @example
 *     await client.packageAdd(['chalk']);
 *
 * @example
 *     await client.packageAdd(['chalk'], true);
 *
 * @example
 *     const success = await client.packageAdd(['chalk']);
 *     if (success) console.log('Added a package to a remote Repl.');
 *
 */
export async function packageAdd(
	this: Crosis,
	packages: string[],
	verbose = false,
): Promise<boolean> {
	if (!this.repl.lang.packager3) return false;
	const packager = await this.channel('packager3');

	if (verbose) {
		packager.onCommand((cmd) => {
			if (cmd.output) this.streams.stdout.write(cmd.output);
			if (cmd.ok) {
				this.streams.stdout.write(
					`\nPackager: Added ${packages.length} packages.`,
				);
			}
		});
	}

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

/**
 * Remove a Package from a remote Repl.
 *
 * @param {string[]} packages
 * - names of the packages to remove.
 * @param {boolean} [verbose=false]
 * - if true, streams messages to input/output/error streams.
 * @example
 *     await client.packageRemove(['chalk']);
 *
 * @example
 *     await client.packageRemove(['chalk'], true);
 *
 * @example
 *     const success = await client.packageRemove(['chalk']);
 *     if (success) console.log('Removed a package from a remote Repl.');
 *
 */
export async function packageRemove(
	this: Crosis,
	packages: string[],
	verbose = false,
): Promise<boolean> {
	if (!this.repl.lang.packager3) return false;

	const packager = await this.channel('packager3');

	if (verbose) {
		packager.onCommand((cmd) => {
			if (cmd.output) this.streams.stdout.write(cmd.output);
			if (cmd.ok) {
				this.streams.stdout.write(
					`\nPackager: Removed ${packages.length} packages.`,
				);
			}
		});
	}

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

/**
 * List all installed Packages in a remote Repl.
 *
 * @param {boolean} [raw=false]
 * - whether to list protocol Package types or a string array.
 * @example
 *     const packages = await client.packageList();
 *     console.log(packages);
 *
 * @example
 *     const packages = await client.packageList(true);
 *     console.log(packages);
 *
 */
export async function packageList(
	this: Crosis,
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

/**
 * Search for new Packages to add.
 *
 * @param {string} query
 * - query to search for Packages.
 * @param {boolean} [raw=false]
 * - whether to list protocol Package types or a string array.
 * @example
 *     const packages = await client.packageSearch('react');
 *     console.log(packages);
 *
 * @example
 *     const packages = await client.packageSearch('react', true);
 *     console.log(packages);
 *
 */
export async function packageSearch(
	this: Crosis,
	query: string,
	raw = false,
): Promise<api.IPackage[] | string[] | boolean> {
	if (!this.repl.lang.packager3) return false;

	const packager = await this.channel('packager3');

	const res = await packager.request({
		packageSearch: { query },
	});

	if (res.error) throw new Error('CrosisError: ' + res.error);
	return raw
		? res.packageSearchResp.results
		: res.packageSearchResp.results.map(({ name }) => name);
}

/**
 * Get information on a Package.
 *
 * @param {string} name
 * - name of the Package.
 * @example
 *     const package = await client.packageInfo('chalk');
 *     console.log(package);
 *
 */
export async function packageInfo(
	this: Crosis,
	name: string,
): Promise<api.IPackage | boolean> {
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
