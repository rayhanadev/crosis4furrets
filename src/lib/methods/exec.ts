import type Crosis from '../crosis';

const runPrompt = '';
const shellPrompt = /~\/[\w\d-]+\$\s$/gm

class Timer {
	public handle: NodeJS.Timeout;
	public ms: number;
	public callback: () => any;

	constructor(callback: () => any, ms: number) {
		this.handle = null;
		this.callback = callback;
		this.ms = ms;
	}

	start() {
		this.handle = setTimeout(this.callback, this.ms);
	}

	stop() {
		clearTimeout(this.handle);
	}
	
	restart() {
		this.stop();
		this.start();
	}
}

const cleanTerminalOutput = (output: string): string => {
	const trimmed = output
		.trim()
		.replace(/\x1b\[\d+m/g, '')
		.split('\n')
		.slice(1, -1)
		.join('\n')
		.trim();

	if(trimmed.length === 0) return '';
		
	const cleaned = trimmed.split('\r')
		.slice(1)
		.join('\r');

	return cleaned;
}
/**
 * Execute the current Run command in a remote Repl and return a Promise with
 * the contents after running the command.
 *
 * @param {number} [timeout]
 * - optionally timeout after some specified milliseconds of inactivity and
 * return the current contents after running the command.
 * @example
 *     const data = await client.execRun();
 *     console.log(data);
 *
 * @example
 *     await client.execRun(10000).catch((error) => console.error(error));
 *
 */
export async function execRun(
	this: Crosis,
	timeout?: number,
): Promise<string | boolean> {
	if (!this.repl.lang.runner) return false;
	const runChan = await this.channel('shellrun2');

	return new Promise((res, rej) => {
		let content = '';
		let promptAppearance = 0;

		let timer: Timer;
		if(timeout) timer = new Timer(() => {
			const output = cleanTerminalOutput(content);
			res(output);
		}, timeout)
		
		runChan.onCommand((cmd) => {
			if (cmd.output) {
				if (cmd.output.includes(runPrompt)) promptAppearance++;

				content += cmd.output;
				timer.restart();

				if (promptAppearance === 2) {
					const output = cleanTerminalOutput(content);
					res(output);
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
 * - optionally timeout after some specified milliseconds of inactivity.
 * @example
 *     await client.execRunStream();
 *
 * @example
 *     const success = await client.execRunStream();
 *     console.log(success);
 *
 * @example
 *     await client
 *     	.execRunStream(10000)
 *     	.catch((error) => console.error(error));
 *
 */
export async function execRunStream(
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
 * Execute a command in a remote Repl's interpreter and return a Promise with
 * the contents after running the command.
 *
 * @param {number} [timeout]
 * - optionally timeout after some specified milliseconds of inactivity and
 * return the current contents after running the command.
 * @example
 *     const data = await client.execInterp("console.log('Hello World');");
 *     console.log(data);
 *
 * @example
 *     const data = await client
 *     	.execInterp("console.log('Hello World');", 10000)
 *     	.catch((error) => console.error(error));
 *
 */
export async function execInterp(
	this: Crosis,
	exec: string,
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
				if (cmd.output === `${exec}\r\n`) return;
				
				const safePromptTest = cmd.output.replace(
					/\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/gm,
					'',
				);

				if (shellPrompt.test(safePromptTest)) promptAppearance++;

				content += cmd.output;

				if (promptAppearance === 2) {
					const output = cleanTerminalOutput(content);
					res(output);
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
 * - optionally timeout after some specified milliseconds of inactivity.
 * @example
 *     await client.execInterpStream("console.log('Hello World');");
 *
 * @example
 *     const success = await client.execInterpStream("console.log('Hello World');");
 *     console.log(success);
 *
 * @example
 *     await client
 *     	.execInterpStream("console.log('Hello World');", 10000)
 *     	.catch((error) => console.error(error));
 *
 */
export async function execInterpStream(
	this: Crosis,
	exec: string,
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
 * Execute a command in a remote Repl's shell and return a Promise with the
 * contents after running the command.
 *
 * @param {number} [timeout]
 * - optionally timeout after some specified milliseconds of inactivity and
 * return the current contents after running the command.
 * @example
 *     const data = await client.execShell('ls -lha');
 *     console.log(data);
 *
 * @example
 *     const data = await client
 *     	.execShell('ls -lha', 10000)
 *     	.catch((error) => console.error(error));
 *
 */
export async function execShell(
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
					const output = cleanTerminalOutput(content);
					res(output);
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
 * Execute a command in a remote Repl's shell and stream its contents to/from
 * the specified input/output/error streams.
 *
 * @param {number} [timeout]
 * - optionally timeout after some specified milliseconds of inactivity.
 * @example
 *     await client.execShellStream('ls -lha');
 *
 * @example
 *     const success = await client.execShellStream('ls -lha');
 *     console.log(success);
 *
 * @example
 *     await client
 *     	.execShellStream('ls -lha', 10000)
 *     	.catch((error) => console.error(error));
 *
 */
export async function execShellStream(
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
 *     await client.execStop();
 *
 * @example
 *     const success = await client.execStop();
 *     console.log(success);
 *
 */
export async function execStop(this: Crosis): Promise<boolean> {
	if (!this.repl.lang.runner) return false;
	const runChan = await this.channel('shellrun2');
	
	runChan.send({ clear: {} });
	
	return true;
}
