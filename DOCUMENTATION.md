![](./.docs/banner.png)

# Documentation

# Client

## Constructor

```js
new Client(options)
```

**Parameters**:

-   `options`: the configuration options for the client.
    -   `token: string`: the token to use for authentication.
    -   `replId: string`: the replId to use for the client.
    -   `[ignore]: string`: a gitignore file to enfore when recursing a Repl's directory.
    -   `[fetchGovalMetadata]: (signal, { replId, token, firewalled }) => Promise<`: a low-level handler to replace crosis4furrets method of fetching Goval Metadata Tokens
    -   `[streams]`: the streams to use for the client.
        -   `[stdin]: fs.ReadStream`: the stdin stream for the client.
        -   `[stdout]: fs.WriteStream`: the stdout stream for the client.
        -   `[stderr]: fs.WriteStream`: the stderr stream for the client.

**Example:**

```js
import fs from 'node:fs';
import { Client } from 'crosis4furrets';

const ignorefile = await fs.readFile('local.gitignore');

const streams = {
  stdin: process.stdin,
  stdout: fs.createWriteStream('output.txt'),
  stderr: fs.createWriteStream('error.txt'),
};

const fetchGovalMetadata = (signal, { token, replId, firewalled }) => {
  // Mint a Goval Metadata Token and return it.
  // You likely will not need to specify this
  // function and crosis4furrets built-in
  // handler will suffice.

  // Presuming you have a Goval Metadata Token
  // stored in your Secrets.
  return JSON.parse(process.env.GOVAL_METADATA);
};

const client = new Client({
  streams,
  fetchGovalMetadata,
  ignore: ignorefile,
  token: process.env.REPLIT_TOKEN,
  replId: process.env.REPLIT_REPL_ID,
});
```

## Methods

### Connection

#### .connect()

Open a connection to a remote Repl instance. You must perform this before any
actions are taken via the Client.

```js
await client.connect();
```

If you want to connect to a repl in firewalled mode, you can pass `true` to the
function.

```js
await client.connect(true);
```

#### .persist()

Persist any file-changes on the remote Repl. Useful if you are interacting
with a Repl with the intentional of keeping changes.

```js
await client.persist();
```

```js
const success = await client.persist();
if (success) console.log('Persisting files on the remote Repl.');
```

#### .close()

Close a connection to a remote Repl. This must be done to exit the process
and perform cleanups.

```js
client.close();
```

### Configuration

#### .dotEnv()

Read a Repl's Secrets via the .env file.

```js
const dotenv = await client.dotEnv();
console.log(dotenv);
```

#### .updateDotEnv()

Update a Repl's Secrets via an object of secrets.

```js
const dotenv = await client.updateDotEnv({ MY_API_KEY: 'SECRET_VALUE' });
console.log(dotenv);
```

#### .dotReplit()

Read a Repl's DotReplit configuration via the .replit file.

```js
const dotreplit = await client.dotReplit();
console.log(dotreplit);
```

#### .updateDotReplit()

Update a Repl's DotReplit configuration via an array of DotReplitOps.

```js
const dotreplit = await client.updateDotReplit([
	{ op: 'add', path: 'run', value: 'node index.js' },
	{ op: 'add', path: 'entrypoint', value: 'index.js' },
	{ op: 'remove', path: 'interpreter' },
]);
console.log(dotreplit);
```

#### .gitignore()

Read a Repl's Gitignore configuration via the .gitignore file.

```js
const gitignore = await client.gitignore();
console.log(gitignore);
```

### File Operations

#### .read()

Read a file from a remote Repl based on path. Specify an encoding for the
file or recieve a buffer of the file.

```js
const file = await client.read('index.js');
console.log(file);
```

```js
const file = await client.read('index.js', 'utf8');
console.log(file);
```

#### .readdir()

Read a directory (flat) from a remote Repl and return filepaths based on
entrypoint. Specify raw to get protocol File types (used for
{@link Client#recursedir})
otherwise get a string array.

```js
const paths = await client.readdir('.');
console.log(paths);
```

```js
const files = await client.readdir('.', true);
console.log(files);
```

#### .recursedir()

Read a directory (recursive) from a remote Repl and return filepaths based on
entrypoint. Specify withIgnore to respect .gitignore rules.

```js
const paths = await client.recursedir('.');
console.log(paths);
```

```js
const paths = await client.recursedir('.', false);
console.log(paths);
```

#### .write()

Write to a file on a remote Repl.

```js
await client.write('foo.txt', 'bar');
```

```js
const buffer = await fs.readFile('image.png');
await client.write('foo.png', buffer);
```

```js
const success = await client.write('foo.txt', 'bar');
if (success) console.log('Wrote to a file in a remote Repl.');
```

#### .mkdir()

Make a directory on a remote Repl.

```js
await client.mkdir('foo');
```

```js
const success = await client.mkdir('foo');
if (success) console.log('Made a directory in a remote Repl.');
```

#### .remove()

Remove a file or directory on a remote Repl.

```js
await client.remove('foo');
```

```js
const success = await client.remove('foo');
if (success) console.log('Removed a resource from a remote Repl.');
```

#### .removeAll()

Remove all files in a remote Repl.

```js
await client.removeAll();
```

```js
const success = await client.removeAll('foo');
if (success) console.log('Emptied a remote Repl.');
```

#### .move()

Move a resources from one location to another in a remote Repl.

```js
await client.move('foo.txt', 'foo/foo.txt');
```

```js
const success = client.move('foo.txt', 'foo/foo.txt');
if (success) console.log('Moved a file in a remote Repl.');
```

#### .stat()

Get information on a file in a remote Repl.

```js
const stat = await client.stat('foo.txt');
console.log(stat);
```

#### .snapshot()

Take a filesystem snapshot. Used to persist files in a Repl that doesn't use
`Client#persist()` after opening a connection.

```js
await client.snapshot();
```

```js
const success = await client.snapshot();
if (success) console.log('Took a FS Snapshot in a remote Repl.');
```

### Packager (via UPM)

#### .packageInstall()

Install all Packages in a remote Repl.

```js
await client.packageInstall();
```

```js
await client.packageInstall(true);
```

```js
const success = await client.packageInstall();
if (success) console.log('Installed all packages in a remote Repl.');
```

#### .packageAdd()

Add a Package to a remote Repl.

```js
await client.packageAdd(['chalk']);
```

```js
await client.packageAdd(['chalk'], true);
```

```js
const success = await client.packageAdd(['chalk']);
if (success) console.log('Added a package to a remote Repl.');
```

#### .packageRemove()

Remove a Package from a remote Repl.

```js
await client.packageRemove(['chalk']);
```

```js
await client.packageRemove(['chalk'], true);
```

```js
const success = await client.packageRemove(['chalk']);
if (success) console.log('Removed a package from a remote Repl.');
```

#### .packageList()

List all installed Nix packages in a remote Repl.

```js
const packages = await client.packageList();
console.log(packages);
```

```js
const packages = await client.packageList(true);
console.log(packages);
```

#### .packageSearch()

Search for new Packages to add.

```js
const packages = await client.packageSearch('react');
console.log(packages);
```

```js
const packages = await client.packageSearch('react', true);
console.log(packages);
```

#### .packageInfo()

Get information on a Package.

```js
const package = await client.packageInfo('chalk');
console.log(package);
```

### Nix Packager

#### .nixPackageAdd()

Add a Nix package to a remote Repl.

```js
await client.nixPackageAdd(['nodejs-16_x']);
```

```js
await client.nixPackageAdd(['nodejs-16_x'], true);
```

```js
const success = await client.nixPackageAdd(['nodejs-16_x']);
if (success) console.log('Added a package to a remote Repl.');
```

#### .nixPackageRemove()

Remove a Nix package from a remote Repl.

```js
await client.nixPackageRemove(['nodejs-16_x']);
```

```js
await client.nixPackageRemove(['nodejs-16_x'], true);
```

```js
const success = await client.nixPackageRemove(['nodejs-16_x']);
if (success) console.log('Removed a package from a remote Repl.');
```

#### .nixPackageList()

List all installed Nix packages in a remote Repl.

```js
const nixPackages = await client.nixPackageList();
console.log(nixPackages);
```

```js
const nixPackages = await client.nixPackageList(true);
console.log(nixPackages);
```

#### .nixPackageSearch()

Search for new Nix packages to add.

```js
const nixPackages = await client.nixPackageSearch('nodejs');
console.log(nixPackages);
```

```js
const nixPackages = await client.nixPackageSearch('nodejs', true);
console.log(nixPackages);
```

#### .nixChannels()

Get available Nix Channels that a Repl can use.

```js
const nixChannels = await client.nixChannels();
console.log(nixChannels);
```

#### .nixChannelLatest()

Get the latest available Nix Channel that a Repl can use.

```js
const latestNixChannel = await client.nixChannelsLatest();
console.log(latestNixChannels);
```

### Runner (via ShellRun)

#### .shellRun()

Execute the current Run command in a remote Repl.

```js
await client.shellRun();
```

```js
const replShell = await client.shellRun();
replShell.log('[PROCESS]: Incoming data.');
```

#### .shellExec()

Execute a shell command in a remote Repl.

```js
await client.shellExec('ls');
```

```js
await client.shellExec('ls', ['-a']);
```

```js
const replShell = await client.shellExec('ls');
replShell.log('[PROCESS]: Incoming data.');
```

#### .shellStop()

Stop a remote Repl's current Run command.

```js
await client.shellStop();
```

```js
const replShell = await client.shellStop();
replShell.log('[PROCESS]: Stopped remote Repl from running.');
```

### Editor

#### .lspMessage()

Send a message to the underlying LSP server. Messages must follow the
Language Server Protocol JSONRPC Specification.

```js
const success = await client.lspMessage(
	JSON.stringify({
		jsonrpc: '2.0',
		id: 1,
		method: 'textDocument/definition',
		params: {
			textDocument: {
				uri: path.resolve(process.cwd(), 'src/index.js'),
			},
			position: {
				line: 3,
				character: 12,
			},
		},
	}),
);

if (success) console.log('Sent a LSP message to the remote Repl.');
```

#### .lspStart()

Start a language's LSP server based on keys in the .replit configuration.

```js
await client.lspStart('javascript');
```

```js
const success = await client.lspStart('javascript');
if (success)
	console.log(
		'Started the Javascript language server on the remote Repl.',
	);
```
