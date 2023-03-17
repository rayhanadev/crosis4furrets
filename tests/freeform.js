import fs from 'node:fs';
import { Client } from '../dist/index.mjs';

const outputStream = fs.createWriteStream('./tests/output.txt');
const errorStream = fs.createWriteStream('./tests/error.txt');

const client = new Client({
	token: process.env.REPLIT_TOKEN,
	replId: process.env.REPLIT_ID,
	streams: {
		stdout: outputStream,
		stderr: errorStream,
	},
});

async function main() {
	await client.connect();
	await client.persist();

	console.log(client.repl)
	await client.shellExec('echo "Hello World!"');
	client.close();
}

main();