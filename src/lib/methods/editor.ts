import type Crosis from '../crosis';

/**
 * Send a message to the underlying LSP server. Messages must follow the
 * Language Server Protocol JSONRPC Specification.
 *
 * @param {string} message
 * - a LSP JSONRPC compliant message.
 * @example
 *     const success = await client.lspMessage(
 *     	JSON.stringify({
 *     		jsonrpc: '2.0',
 *     		id: 1,
 *     		method: 'textDocument/definition',
 *     		params: {
 *     			textDocument: {
 *     				uri: path.resolve(process.cwd(), 'src/index.js'),
 *     			},
 *     			position: {
 *     				line: 3,
 *     				character: 12,
 *     			},
 *     		},
 *     	}),
 *     );
 *
 *     if (success) console.log('Sent a LSP message to the remote Repl.');
 *
 */
export async function lspMessage(
	this: Crosis,
	message: string,
): Promise<boolean> {
	const lspChan = await this.channel('lsp');

	const res = await lspChan.request({
		input: message,
	});

	if (res.error) throw new Error('CrosisError: ' + res.error);
	return res.ok ? true : false;
}

/**
 * Start a language's LSP server based on keys in the .replit configuration.
 *
 * @param {string} language
 * - a language key assigned in a Repl's .replit config file.
 * @example
 *     await client.lspStart('javascript');
 *
 * @example
 *     const success = await client.lspStart('javascript');
 *     if (success)
 *     	console.log(
 *     		'Started the Javascript language server on the remote Repl.',
 *     	);
 *
 */
export async function lspStart(
	this: Crosis,
	language: string,
): Promise<boolean> {
	const lspChan = await this.channel('lsp');

	const res = await lspChan.request({
		startLSP: { language },
	});

	if (res.error) throw new Error('CrosisError: ' + res.error);
	return res.ok ? true : false;
}
