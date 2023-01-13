import WebSocket from 'ws';

import type Crosis from '../crosis';

import { test } from 'replit-login';

// @ts-ignore: ignore .graphql imports
import CurrentUser from '../../queries/CurrentUser.graphql';
// @ts-ignore: ignore .graphql imports
import ReplById from '../../queries/ReplById.graphql';

/**
 * Open a connection to a remote Repl instance. You must perform this before any
 * actions are taken via the Client.
 *
 * @param {boolean} [firewalled]
 * - open a firewalled connection to a Repl.
 * @example
 *     await client.connect();
 *
 * @example
 *     await client.connect(true);
 *
 */
export async function connect(this: Crosis, firewalled = false): Promise<void> {
	const { success } = await test(decodeURIComponent(this.token));
	if (!success) throw new Error('UserError: Invalid token');

	if (!this.user) {
		const { data } = await this.gql.query({
			query: CurrentUser,
		});

		if (data.currentUser === null)
			throw new Error('UserError: Invalid token.');
		this.user = data.currentUser;
	}

	if (!this.repl) {
		const {
			data: { repl },
		} = await this.gql.query({
			query: ReplById,
			variables: {
				id: this.replId,
			},
		});

		if (repl === null) throw new Error('UserError: Invalid repl.');
		this.repl = repl;
	}

	await new Promise<void>((res) => {
		const context = null;

		const fetchConnectionMetadata = async (signal: AbortSignal) => {
			return await this.fetchGovalMetadata(signal, {
				token: this.token,
				replId: this.replId,
				firewalled,
			});
		};

		this.client.open(
			{
				context,
				fetchConnectionMetadata,
				// @ts-ignore: ws has enough compatibility
				WebSocketClass: WebSocket,
			},
			({ channel }) => {
				if (!channel) return;
				this.channels['chan0'] = channel;

				this.connected = true;
				res();
			},
		);

		this.client.setUnrecoverableErrorHandler((error) => {
			throw new Error(error.message);
		});
	});
}

/**
 * Persist any file-changes on the remote Replit. Useful if you are interacting
 * with a Replit with the intentional of keeping changes.
 *
 * @example
 *     await client.persist();
 *
 * @example
 *     const success = await client.persist();
 *     if (success) console.log('Persisting files on the remote Repl.');
 *
 */
export async function persist(): Promise<boolean> {
	const gcsfilesChan = await this.channel('gcsfiles');

	const res = await gcsfilesChan.request({
		persist: { path: '' },
	});

	if (res.error) throw new Error('CrosisError: ' + res.error);
	if (res.ok) this.persisting = true;
	return res.ok ? true : false;
}

/**
 * Close a connection to a remote Repl. This must be done to exit the process
 * and perform cleanups.
 *
 * @example
 *     client.close();
 *
 */
export function close(): void {
	if (this.connected === false) {
		throw new Error(
			'UserError: Cannot close connection because the client is not connected.',
		);
	}
	this.client.close();
	this.connected = false;
}
