import { Client } from '../dist/index.mjs';

const client = new Client({
	token: process.env.REPLIT_TOKEN,
	replId: process.env.REPLIT_ID,
});

async function main() {
	await client.connect().then(() => console.log('connected'));

	const data = await client.shellExec('ls -lha');
	console.log(data);

	client.close();
}

main();
