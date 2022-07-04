import fetch from 'node-fetch';
import type { Response } from 'node-fetch';

import { FetchConnectionMetadataError } from '@replit/crosis';
import type { FetchConnectionMetadataResult } from '@replit/crosis';

interface Options {
	token: string;
	replId: string;
}

export const govalMetadata = async (
	signal: AbortSignal,
	options: Options,
): Promise<FetchConnectionMetadataResult> => {
	let res: Response;

	try {
		res = await fetch(
			`https://replit.com/data/repls/${options.replId}/get_connection_metadata`,
			{
				signal,
				method: 'POST',
				headers: {
					Host: 'replit.com',
					Origin: 'https://replit.com',
					Referrer: 'https://replit.com',
					'Content-Type': 'application/json',
					Accept: 'application/json',
					Connection: 'keep-alive',
					'User-Agent': 'crosis4furrets',
					'X-Requested-With': 'crosis4furrets',
					Cookie: `connect.sid=${options.token}`,
				},
				body: JSON.stringify({}),
			},
		);
	} catch (error) {
		if (error.name === 'AbortError') {
			return {
				error: new Error(FetchConnectionMetadataError.Aborted),
			};
		}

		throw error;
	}

	if (res.status !== 200) {
		if (res.status > 500) {
			return {
				error: new Error(FetchConnectionMetadataError.Retriable),
			};
		}

		const errorText = await res.text();
		throw new Error(errorText);
	}

	const connectionMetadata = await res.json();

	return {
		token: connectionMetadata.token,
		gurl: connectionMetadata.gurl,
		conmanURL: connectionMetadata.conmanURL,
		error: null,
	};
};

const CurrentUser = `
  query CurrentUser {
    currentUser {
      id
      username
    }
  }
`;

const Repl = `
  query Repl($id: String!) {
    repl(id: $id) {
      ... on Repl {
        id
        slug
        language
        isPrivate
        lang {
          id
          runner: canUseShellRunner
          packager3: supportsPackager3
          terminal: usesTerminal2
          interpreter: usesInterpreter
          engine
          mainFile
          supportsMultiFiles
        }
      }
    }
  }
`;

interface GraphQLResponse {
	data?: any;
	errors?: any;
}

export class GraphQL {
	private headers: {
		[index: string]: string;
	};

	protected queries: {
		[index: string]: string;
	};

	constructor(token: string) {
		this.headers = {
			Host: 'replit.com',
			Origin: 'https://replit.com',
			Referrer: 'https://replit.com',
			'Content-Type': 'application/json',
			Accept: 'application/json',
			Connection: 'keep-alive',
			'User-Agent': 'crosis4furrets',
			'X-Requested-With': 'crosis4furrets',
			Cookie: token ? 'connect.sid=' + token : '',
		};

		this.queries = {
			CurrentUser,
			Repl,
		};
	}

	async request(
		query: string,
		variables?: {
			[index: string]: any;
		},
	) {
		const res = await fetch(
			`http://replit.com/graphql?query=${this.queries[query]}${
				variables ? `&variables=${JSON.stringify(variables)}` : ''
			}`,
			{
				method: 'GET',
				headers: this.headers,
			},
		);

		const { data, errors } = (await res.json()) as GraphQLResponse;

		if (errors) throw new Error('Replit GraphQL Error.');
		return data;
	}
}
