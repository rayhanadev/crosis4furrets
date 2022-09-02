import readline from 'node:readline';

import type Crosis from '../crosis';

export async function shellRun(
	this: Crosis,
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

	runChan.send({ clear: {} });
	runChan.send({ runMain: {} });
	rl.on('line', (input) => {
		lastLine = input + '\r\r\n';
		runChan.send({ input });
		runChan.send({ input: '\r\n' });
	});

	return await this.cmdTimeout(runChan, timeout);
}

export async function shellExec(
	this: Crosis,
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

export async function shellStop(
	this: Crosis,
	timeout?: number,
): Promise<boolean> {
	if (!this.repl.lang.interpreter) return false;

	const runChan = await this.channel('interp2');
	runChan.send({ clear: {} });

	return await this.cmdTimeout(runChan, timeout);
}
