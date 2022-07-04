> This project is a **Work in Progress** and currently in development. The API is
> subject to change without warning.

---

## Install

```sh
$ npm install crosis4furrets
$ yarn add crosis4furrets
```

## Usage

### Main API

```js
import { Crosis } from "crosis4furrets";

const client = new Crosis({ token: '', replId: '' });
```

which returns a [`<Client>`](#client)

### Options

-   token: A user's `connect.sid` cookie from Replit.
-   replId: An ID connected to any public Repl (or a user's private Repls).
-   ignore?: Optionally override a Repl's `.gitignore` file with your own. Used when
    created a recursed directory.

### Client

A `<Client>` opens up many operations that you can perform on a Repl. Note, several
of these operations will be limited on Repls that you do not own:

#### Connection

-   `<Client>.connect()`: Connect a client the specified Repl.
-   `<Client>.persist()`: Persist file changes in a Repl from this connection.
-   `<Client>.close()`: Close a client connection.

#### File Operations

-   `<Client>.read(path[, encoding])`: Read a file at a specific path. Specify an
    encoding to parse the file, otherwise returns a Buffer.
-   `<Client>.readdir(path)`: List files in a specific directory.
-   `<Client>.recursedir(path[, withIgnore = true])`: Recurse through files in a
    specific directory. Automatically reads .gitignore files and skips those files.
-   `<Client>.write(path, content)`: Write content to a file. Can be Buffer or string
    content.
-   `<Client>.mkdir(path)`: Make a directory at a specific path.
-   `<Client>.remove(path)`: Remove a file at a specific path.
-   `<Client>.removeAll()`: Remove all files in the Repl.
-   `<Client>.move(oldPath, newPath)`: Move a file to a specific location.
-   `<Client>.snapshot()`: Capture a filesystem snapshot of the Repl.

#### Language Server

-   `<Client>.lsp(message)`: If the Repl has an LSP, send a message to it.

#### Packager (via UPM)

-   `<Client>.packageInstall()`: Install the Repl's packages.
-   `<Client>.packageAdd(packages)`: Add packages to the Repl.
-   `<Client>.packageRemove()`: Remove packages from the Repl.
-   `<Client>.packageList()`: List the Repl's packages.
-   `<Client>.packageSearch()`: Search for packages via UPM.
-   `<Client>.packageInfo()`: Pull package information via UPM.

#### Runner (via ShellRun)

-   `<Client>.shellRun([, timeout])`: Run the current Repl's main command.
-   `<Client>.shellExec(command[, args, timeout])`: Run a command (with optional
    arguments) on the Repl's shell.
-   `<Client>.shellStop([, timeout])`: Stop the Repl's current process.

## Example

```js
// using ESM, if in CommonJS use an async context!
import { Crosis } from "crosis4furrets";

const client = new Crosis({
  process.env.REPLIT_TOKEN, // connect.sid
  "68fff490-4ce3-4123-b429-c11622fb8dd3" // id of a repl
});

await client.connect();
console.log("Read:\n", await client.read("index.js", "utf-8"));
```
