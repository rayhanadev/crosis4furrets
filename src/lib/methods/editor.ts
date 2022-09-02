import type Crosis from '../crosis';

export async function lsp(this: Crosis, message: string): Promise<boolean> {
	const lspChan = await this.channel('lsp');

	const res = await lspChan.request({
		input: message,
	});

	if (res.error) throw new Error('CrosisError: ' + res.error);
	return res.ok ? true : false;
}
