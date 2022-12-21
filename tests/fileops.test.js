import { Crosis } from '../dist/index.mjs';
import fs from 'node:fs/promises';

const client = new Crosis({
	token: process.env.REPLIT_TOKEN,
	replId: process.env.REPLIT_ID,
});

beforeAll(async () => {
	await client.connect();
	await client.persist();
});

afterAll(() => client.close());

describe('Check Read methods.', () => {
	describe('Perform action.', () => {
		test('Read a file from a remote Repl.', async () => {
			expect(await client.read('index.js', 'utf8')).toEqual(
				expect.any(String),
			);
		});

		test('Read a directory from a remote Repl.', async () => {
			expect(await client.readdir('.')).toEqual(expect.any(Array));
		});

		test('Recurse a directory in a remote Repl.', async () => {
			expect(await client.recursedir('.')).toEqual(expect.any(Array));
		});
	});
});

describe('Check Write methods.', () => {
	describe('Perform action.', () => {
		test('Write a string to a file in a remote Repl.', async () => {
			expect(await client.write('foo.txt', 'bar')).toBe(true);
		});

		test('Write a buffer to a file in a remote Repl.', async () => {
			const imageBuffer = await fs.readFile(
				process.cwd() + '/tests/assets/image.jpeg',
			);
			expect(await client.write('foo.jpeg', imageBuffer)).toBe(true);
		});
	});

	describe('Check.', () => {
		test('Check for written files in remote Repl.', async () => {
			const expected = ['foo.txt', 'foo.jpeg'];
			expect(await client.readdir('.')).toEqual(
				expect.arrayContaining(expected),
			);
		});

		test('Check for string content in files.', async () => {
			expect(await client.read('foo.txt', 'utf-8')).toBe('bar');
		});

		test('Check for buffer content in files.', async () => {
			const imageBuffer = await fs.readFile(
				process.cwd() + '/tests/assets/image.jpeg',
			);
			expect(await client.read('foo.jpeg')).toEqual(imageBuffer);
		});
	});
});

describe('Check Mkdir method.', () => {
	describe('Perform action.', () => {
		test('Make a directory in a remote Repl.', async () => {
			expect(await client.mkdir('foo')).toBe(true);
		});
	});

	describe('Check.', () => {
		test('Check for directory made in remote Repl.', async () => {
			const expected = ['foo'];
			expect(await client.readdir('.')).toEqual(
				expect.arrayContaining(expected),
			);
		});
	});
});

describe('Check Move method.', () => {
	describe('Perform action.', () => {
		test('Move files to a folder in a remote Repl.', async () => {
			expect(await client.move('foo.txt', 'foo/foo.txt')).toBe(true);
			expect(await client.move('foo.jpeg', 'foo/foo.jpeg')).toBe(true);
		});
	});

	describe('Check.', () => {
		test('Check for files in folder on the remote Repl.', async () => {
			const expected = ['foo.txt', 'foo.jpeg'];
			expect(await client.readdir('foo')).toEqual(
				expect.arrayContaining(expected),
			);
		});
	});
});

describe('Check Remove method.', () => {
	describe('Perform action.', () => {
		test('Remove folder from a remote Repl.', async () => {
			expect(await client.remove('foo')).toBe(true);
		});
	});

	describe('Check.', () => {
		test('Check for folder on the remote Repl.', async () => {
			const expected = ['foo'];
			expect(await client.readdir('.')).not.toEqual(
				expect.arrayContaining(expected),
			);
		});
	});
});

describe('Check Stat method.', () => {
	test('Get stats on a file in a remote Repl.', async () => {
		expect((await client.stat('index.js')).exists).toBe(true);
	});
});

describe('Check Snapshot method.', () => {
	test('Take a filesystem snapshot of the remote Repl.', async () => {
		expect(await client.snapshot()).toBe(true);
	});
});
