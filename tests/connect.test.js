import { Crosis } from '../dist/index.mjs';

const client = new Crosis({
	token: process.env.REPLIT_TOKEN,
	replId: process.env.REPLIT_ID,
});

describe('Check Connect method.', () => {
	describe('Perform action.', () => {
		test('Connect to a remote Repl.', async () => {
			expect(await client.connect()).toBe(void 0);
		});
	});

	describe('Check.', () => {
		test('Check for connected property on <Client>.', async () => {
			expect(client.connected).toBe(true);
		});
	});
});

describe('Check GraphQL information.', () => {
	describe('Check.', () => {
		test('Check for user property on <Client>.', async () => {
			expect(Object.keys(client.user)).toMatchObject(['id', 'username']);
		});

		test('Check for repl property on <Client>.', async () => {
			expect(Object.keys(client.repl)).toMatchObject([
				'id',
				'slug',
				'language',
				'isPrivate',
				'lang',
			]);
		});
	});
});

describe('Check Persist method.', () => {
	describe('Perform action.', () => {
		test('Persist file changes on a remote Repl.', async () => {
			expect(await client.persist()).toBe(true);
		});
	});

	describe('Check.', () => {
		test('Check for connected property on <Client>.', async () => {
			expect(client.persisting).toBe(true);
		});
	});
});

describe('Check Close method.', () => {
	describe('Perform action.', () => {
		test('Close connection to a remote Repl.', () => {
			expect(client.close()).toBe(void 0);
		});
	});

	describe('Check.', () => {
		test('Check for connected property on <Client>.', async () => {
			expect(client.connected).not.toBe(true);
		});
	});
});
