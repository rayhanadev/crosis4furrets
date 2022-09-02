import WebSocket from 'ws';

import type Crosis from '../crosis';

// @ts-ignore: ignore .graphql imports
import CurrentUser from '../../queries/CurrentUser.graphql';
// @ts-ignore: ignore .graphql imports
import ReplById from '../../queries/ReplById.graphql';

import { govalMetadata } from '../utils';

export async function connect(this: Crosis): Promise<void> {
	if (!this.replId)
		throw new Error(
			'UserError: No ReplID Found. Pass a ReplID into the constructor.',
		);

	const {
		data: { currentUser },
	} = await this.gql.query({
		query: CurrentUser,
	});

	if (currentUser === null) throw new Error('UserError: Invalid token.');
	this.user = currentUser;

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

	await new Promise<void>((res) => {
		const context = null;

		const fetchConnectionMetadata = async (signal: AbortSignal) => {
			return await govalMetadata(signal, {
				token: this.token,
				replId: this.replId,
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

export async function persist(): Promise<boolean> {
	const gcsfilesChan = await this.channel('gcsfiles');

	const res = await gcsfilesChan.request({
		persist: { path: '' },
	});

	if (res.error) throw new Error('CrosisError: ' + res.error);
	if (res.ok) this.persisting = true;
	return res.ok ? true : false;
}

export function close(): void {
	if (this.connected === false) {
		throw new Error(
			'UserError: Cannot close connection because the client is not connected.',
		);
	}
	this.client.close();
	this.connected = false;
}
