import { Console } from 'node:console';

import type Crosis from '../crosis';

const runPrompt = '';
const shellPrompt = /~\/[\w\d-]+\$\s$/gm
/**
 * Execute the current Run command in a remote Repl and return a Promise with
 * the contents after running the command.
 *
 * @param {number} [timeout]
 * - optionally timeout the runner and reject the promise after a certain period
 * of time.
 * @example
 *     const data = await client.shellRun();
 *     console.log(data);
 *
 * @example
 *     await client.shellRun(10000).catch((error) => console.error(error));
 *
 */
export async function shellRun(
	this: Crosis,
	timeout?: number,
): Promise<string | boolean> {
	if (!this.repl.lang.runner) return false;
	const runChan = await this.channel('shellrun2');

	return new Promise((res, rej) => {
		if (timeout) {
			setTimeout(() => rej(new Error('Runner timed out.')), timeout);
		}

		let content = '';
		let promptAppearance = 0;

		runChan.onCommand((cmd) => {
			if (cmd.output) {
				if (cmd.output.includes(runPrompt)) promptAppearance++;

				content += cmd.output;

				if (promptAppearance === 2) {
					const trimmed = content
						.trim()
						.replace(/\x1b\[\d+m/g, '')
						.split('\n')
						.slice(1, -1)
						.join('\n')
						.trim();

					if(trimmed.length === 0) res('');
						
					const cleaned = trimmed.split('\r')
						.slice(1)
						.join('\r');

					res(cleaned);

					res(cleaned);
				}
			}

			if (cmd.hint) {
				content += `\nHint:  ${cmd.hint.text}`;
			}
		});

		runChan.send({ clear: {} });
		runChan.send({ runMain: {} });
	});
}

/**
 * Execute the current Run command in a remote Repl and stream its contents
 * to/from the specified input/output/error streams.
 *
 * @param {number} [timeout]
 * - optionally timeout the runner and reject the promise after a certain period
 * of time.
 * @example
 *     await client.shellRunStream();
 *
 * @example
 *     const success = await client.shellRunStream();
 *     console.log(success);
 *
 * @example
 *     await client
 *     	.shellRunStream(10000)
 *     	.catch((error) => console.error(error));
 *
 */
export async function shellRunStream(
	this: Crosis,
	timeout?: number,
): Promise<boolean> {
	if (!this.repl.lang.runner) return false;
	const runChan = await this.channel('shellrun2');

	return new Promise((res, rej) => {
		if (timeout) {
			setTimeout(() => rej(new Error('Runner timed out.')), timeout);
		}

		let promptAppearance = 0;

		runChan.onCommand((cmd) => {
			if (cmd.output) {
				if (cmd.output.includes(runPrompt)) promptAppearance++;

				if (promptAppearance === 2) {
					res(true);
				}

				this.streams.stdout.write(cmd.output);
			}

			if (cmd.hint) this.streams.stdout.write('\nHint: ' + cmd.hint.text);
		});

		runChan.send({ clear: {} });
		runChan.send({ runMain: {} });
		this.streams.stdin.on('data', (input) => {
			runChan.send({ input: input.toString() });
			runChan.send({ input: '\r\n' });
		});
	});
}

/**
 * Execute a command in a remote Repl and return a Promise with the contents
 * after running the command.
 *
 * @param {number} [timeout]
 * - optionally timeout the runner and reject the promise after a certain period
 * of time.
 * @example
 *     const data = await client.shellExec('ls -lha');
 *     console.log(data);
 *
 * @example
 *     const data = await client
 *     	.shellExec('ls -lha', 10000)
 *     	.catch((error) => console.error(error));
 *
 */
export async function shellExec(
	this: Crosis,
	exec: string,
	timeout?: number,
): Promise<string | boolean> {
	if (!this.repl.lang.runner) return false;
	const runChan = await this.channel('shell');

	return new Promise((res, rej) => {
		if (timeout) {
			setTimeout(() => rej(new Error('Runner timed out.')), timeout);
		}

		let content = '';
		let promptAppearance = 0;

		runChan.onCommand((cmd) => {
			if (cmd.output) {
				if (cmd.output === `${exec}\r\n`) return;
				
				const safePromptTest = cmd.output.replace(
					/\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/gm,
					'',
				);

				if (shellPrompt.test(safePromptTest)) promptAppearance++;

				content += cmd.output;

				if (promptAppearance === 2) {
					const trimmed = content
						.trim()
						.replace(/\x1b\[\d+m/g, '')
						.split('\n')
						.slice(1, -1)
						.join('\n')
						.trim();

					if(trimmed.length === 0) res('');
						
					const cleaned = trimmed.split('\r')
						.slice(1)
						.join('\r');

					res(cleaned);
				}
			}

			if (cmd.hint) {
				content += `\nHint:  ${cmd.hint.text}`;
			}
		});

		runChan.send({ clear: {} });
		runChan.send({ input: `${exec}\r` });
	});
}

/**
 * Execute a command in a remote Repl and stream its contents to/from the
 * specified input/output/error streams.
 *
 * @param {number} [timeout]
 * - optionally timeout the runner and reject the promise after a certain period
 * of time.
 * @example
 *     await client.shellExecStream('ls -lha');
 *
 * @example
 *     const success = await client.shellExecStream('ls -lha');
 *     console.log(success);
 *
 * @example
 *     await client
 *     	.shellExecStream('ls -lha', 10000)
 *     	.catch((error) => console.error(error));
 *
 */
export async function shellExecStream(
	this: Crosis,
	exec: string,
	timeout?: number,
): Promise<boolean> {
	if (!this.repl.lang.runner) return false;
	const runChan = await this.channel('shell');

	return new Promise((res, rej) => {
		if (timeout) {
			setTimeout(() => rej(new Error('Runner timed out.')), timeout);
		}

		let promptAppearance = 0;

		runChan.onCommand((cmd) => {
			if (cmd.output) {
				const safePromptTest = cmd.output.replace(
					/\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/gm,
					'',
				);
		
				if (shellPrompt.test(safePromptTest)) promptAppearance++;

				if (promptAppearance === 2) {
					res(true);
				}

				this.streams.stdout.write(cmd.output);
			}

			if (cmd.hint) this.streams.stdout.write('\nHint: ' + cmd.hint.text);
		});

		runChan.send({ clear: {} });
		runChan.send({ input: `${exec}\r` });
		this.streams.stdin.on('data', (input) => {
			runChan.send({ input: input.toString() });
			runChan.send({ input: '\r\n' });
		});
	});
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

	const shellStream = new Console({
		stdout: this.streams.stdout,
		stderr: this.streams.stderr,
	});

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
