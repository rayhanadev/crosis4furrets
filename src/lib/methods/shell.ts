import { Console } from 'node:console';

import type Crosis from '../crosis';

/**
 * Execute the current Run command in a remote Repl.
 *
 * @example
 *     await client.shellRun();
 *
 * @example
 *     const replShell = await client.shellRun();
 *     replShell.log('[PROCESS]: Incoming data.');
 *
 */
export async function shellRun(this: Crosis): Promise<Console | boolean> {
	if (!this.repl.lang.runner) return false;
	const runChan = await this.channel('shellrun2');

	const shellStream = new Console(this.streams.stdout, this.streams.stderr);

	let lastLine = '';

	runChan.onCommand((cmd) => {
		if (cmd.output) {
			if (lastLine.startsWith(cmd.output)) {
				lastLine = lastLine.slice(cmd.output.length);
				return;
			}

			this.streams.stdout.write(cmd.output);
		}

		if (cmd.hint) this.streams.stdout.write('\nHint: ' + cmd.hint.text);
	});

	runChan.send({ clear: {} });
	runChan.send({ runMain: {} });
	this.streams.stdin.on('data', (input) => {
		lastLine = input.toString() + '\r\r\n';
		runChan.send({ input: input.toString() });
		runChan.send({ input: '\r\n' });
	});

	return shellStream;
}

/**
 * Execute a shell command in a remote Repl.
 *
 * @param {string} cmd
 * - the command to run.
 * @param {string[]} args
 * - arguments to pass to the command.
 * @example
 *     await client.shellExec('ls');
 *
 * @example
 *     await client.shellExec('ls', ['-a']);
 *
 * @example
 *     const replShell = await client.shellExec('ls');
 *     replShell.log('[PROCESS]: Incoming data.');
 *
 */
export async function shellExec(
	this: Crosis,
	cmd: string,
	args?: string[],
): Promise<Console | boolean> {
	if (!this.repl.lang.runner) return false;
	const runChan = await this.channel('shellrun2');

	const shellStream = new Console(this.streams.stdout, this.streams.stderr);

	let lastLine = '';

	runChan.onCommand((cmd) => {
		if (cmd.output) {
			if (lastLine.startsWith(cmd.output)) {
				lastLine = lastLine.slice(cmd.output.length);
				return;
			}

			this.streams.stdout.write(cmd.output);
		}

		if (cmd.hint) this.streams.stdout.write('\nHint: ' + cmd.hint.text);
	});

	const exec = args ? `${cmd} ${args.join(' ')}` : cmd;

	runChan.send({ clear: {} });
	runChan.send({ input: exec });
	this.streams.stdin.on('data', (input) => {
		lastLine = input.toString() + '\r\r\n';
		runChan.send({ input: input.toString() });
		runChan.send({ input: '\r\n' });
	});

	return shellStream;
}

/**
 * Stop a remote Repl's current Run command.
 *
 * @example
 *     await client.shellStop();
 *
 * @example
 *     const replShell = await client.shellStop();
 *     replShell.log('[PROCESS]: Stopped remote Repl from running.');
 *
 */
export async function shellStop(this: Crosis): Promise<Console | boolean> {
	if (!this.repl.lang.runner) return false;
	const runChan = await this.channel('shellrun2');

	const shellStream = new Console(this.streams.stdout, this.streams.stderr);

	let lastLine = '';

	runChan.onCommand((cmd) => {
		if (cmd.output) {
			if (lastLine.startsWith(cmd.output)) {
				lastLine = lastLine.slice(cmd.output.length);
				return;
			}

			this.streams.stdout.write(cmd.output);
		}

		if (cmd.hint) this.streams.stdout.write('\nHint: ' + cmd.hint.text);
	});

	runChan.send({ clear: {} });
	this.streams.stdin.on('data', (input) => {
		lastLine = input.toString() + '\r\r\n';
		runChan.send({ input: input.toString() });
		runChan.send({ input: '\r\n' });
	});

	return shellStream;
}
