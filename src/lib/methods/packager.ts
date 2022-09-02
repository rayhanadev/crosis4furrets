import type Crosis from '../crosis';

import type { api } from '@replit/protocol';

// prettier-ignore
type PackageListContentType<T extends boolean> =
	T extends true
	? api.IPackage
	: T extends false
	? string : never;

export async function packageInstall(this: Crosis): Promise<boolean> {
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

export async function packageAdd(
	this: Crosis,
	packages: string[],
): Promise<boolean> {
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

export async function packageRemove(
	this: Crosis,
	packages: string[],
): Promise<boolean> {
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

export async function packageSearch(
	this: Crosis,
	query: string,
): Promise<api.IPackage[] | boolean> {
	if (!this.repl.lang.packager3) return false;

	const packager = await this.channel('packager3');

	const res = await packager.request({
		packageSearch: { query },
	});

	if (res.error) throw new Error('CrosisError: ' + res.error);
	return res.packageSearchResp.results;
}

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
