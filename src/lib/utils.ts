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
					'User-Agent': 'Mozilla/5.0',
					'Content-Type': 'application/json',
					'X-Requested-With': 'XMLHttpRequest',
					Referrer: 'https://replit.com',
					Cookie: `connect.sid=${options.token};`,
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

const CURRENT_USER = `
  query CurrentUser {
    currentUser {
      id
      username
    }
  }
`;

const REPL = `
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
	private headers: Record<string, string>;
	protected queries: Record<string, string>;

	constructor(token: string) {
		this.headers = {
			'User-Agent': 'Mozilla/5.0',
			'Content-Type': 'application/json',
			'X-Requested-With': 'XMLHttpRequest',
			Referrer: 'https://replit.com/',
			Cookie: token ? `connect.sid=${encodeURIComponent(token)};` : '',
		};

		this.queries = {
			CURRENT_USER,
			REPL,
		};
	}

	async request(query: string, variables?: Record<string, any>) {
		const res = (await fetch('https://replit.com/graphql', {
			method: 'POST',
			headers: this.headers,
			body: JSON.stringify({
				query: this.queries[query],
				variables: JSON.stringify(variables),
			}),
		}).then((res) => res.json())) as GraphQLResponse;

		const { data, errors } = res;

		if (errors) throw new Error('Replit GraphQL Error.');
		return data;
	}
}
