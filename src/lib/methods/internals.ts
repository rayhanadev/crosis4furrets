import type Crosis from '../crosis';

import type { Channel } from '@replit/crosis';
import type { api } from '@replit/protocol';

/**
 * @deprecated
 * Since v1.3. Previously used to timeout shell functions.
 */
export async function cmdTimeout(
	this: Crosis,
	channel: Channel,
	timeout: number,
): Promise<boolean> {
	return new Promise((res, rej) => {
		let timeoutId: ReturnType<typeof setTimeout>;
		let promiseDidFinish = false;

		const listener = (cmd: api.ICommand) => {
			if (!promiseDidFinish && cmd.state === 0 && !cmd.session) {
				promiseDidFinish = true;
				clearTimeout(timeoutId);
				console.log('[RUNNER]: Exited runner.');
				res(cmd.ok ? true : false);
			}
		};

		if (timeout && timeout > 0) {
			timeoutId = setTimeout(() => {
				promiseDidFinish = true;
				console.log('[RUNNER]: Timed out.');
				rej('The runner timed out.');
			}, timeout);
		}

		channel.onCommand(listener);
	});
}

/**
 * Helper method to manage the channels a Client opens. For an old list of
 * services reference: https://crosis.turbio.repl.co/services
 *
 * @param {string} name
 * - name of the service for the Client to open a channel for.
 * @access package
 * @example
 *     const fileChan = await client.channel('files');
 *     // See https://crosisdoc.util.repl.co/classes/Channel.html
 *     // for more information on channels.
 *
 */
export async function channel(name: string): Promise<Channel> {
	const stored = this.channels[name];
	if (stored) {
		return stored;
	} else {
		const chan = await new Promise<Channel>((res, rej) => {
			this.client.openChannel({ service: name }, ({ channel, error }) => {
				if (error) rej(error);
				if (channel) res(channel);
			});
		});

		this.channels[name] = chan;
		return chan;
	}
}
