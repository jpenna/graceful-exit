# Graceful Exit

Finish everything up before exiting NodeJS process.

This module has only 2 dependencies, which are used for debugging purposes: `debug` and `simple-node-logger`.

## Warnings

1 - We are dealing with errors in general, some errors may prevent `graceful-exit` to work properly (unstable state, for example). On most cases it won't happen.

2 - **JUST FINISH THINGS AND EXIT THE APPLICATION, DON'T TRY TO RECOVER IT HERE**. Use it just to handle loose edges, such as finish writing to a file or logging something.

## Installation

```shell
$ npm install graceful-exit
```

## Usage

`graceful-exit` exposes only 2 methods: `setup` and `gracefulExit`.

On the entry point of your code, add the `setup` method.

```js
// src/index.js
import { setup } from 'graceful-exit';

setup({
  logPath, // String [Optional]
  debugLabel, // String [Optional]
  callbacks, // Array | Function [Optional]
  customCodeMap, // Map [Optional]
  logger, // Function [Optional]
  fileLogger, // Function [Optional]
  forceTimeout, // Number [Optional] = 5000
});

// Begin code...
```

On each module that should be cleaned up before exiting, add the `gracefulExit` method.

```js
// src/writeFile.js
import { gracefulExit } from 'graceful-exit';

// Do your cleanup...
// You can also return a Promise, the process will only exit when the Promise resolves, rejects or the forceTimeout is triggered
function onExit() {
  clearTimeout(someTimeout);

  return new Promise((function rerun(resolve) {
    const { length: wait } = pendingWritingStreams.filter(v => v);
    if (!wait) return resolve();
  
    debug(`Waiting all writes to finish. Count: ${wait}`);
    
    setTimeout(rerun.bind(this, resolve), 100);
  });
}

gracefulExit(onExit);
```

## Setup parameters (ALL parameters ARE OPTIONAL)

### logPath (String)

Where the log file should be placed. If not set, the builtin file logger won't be used.

### debugLabel (String)

What label should be used to debug. If not set, the builtin debug won't be used.

### callbacks (Array | Function)

List of callbacks to be called when running the cleanup process. Will be called when the cleanup process starts. Receives the `code` number and the `msg` mapped to the code.

Use this for log some custom message for example.

```js
// src/index.js
import { setup } from 'graceful-exit';

const callbacks = [
  (code, msg) => console.log('My custom message', code),
  (code, msg) => // whatever...,
]

setup({ callbacks });

```

Or as a function:

```js
// src/index.js
import { setup } from 'graceful-exit';

const callbacks = (code, msg) => console.log('My custom message', code);

setup({ callbacks });
```


### customCodeMap (Map)

The basic error codes have been set already. Pass this parameter with the set codes to overwrite the predefined messages (check below) or add your custom error codes/messages

### logger (Function)

Override the builtin log function by a custom logger function 

### fileLogger (Function | Object: { info, error })

Override the builtin file log function by a custom logger function. If an object is passed, the methods `info` and `error` are expected.

```js
// src/index.js
import { setup } from 'graceful-exit';

import myCustomFileLogger from 'myCustomFileLogger';

const fileLogger = myCustomFileLogger;

setup({ fileLogger });
```

Or with options:

```js
// src/index.js
import { setup } from 'graceful-exit';

import myCustomFileLogger from 'myCustomFileLogger';

const fileLogger = { 
  info: myCustomFileLogger.infoMethod,
  error: myCustomFileLogger.errorMethod,
};

setup({ fileLogger });
```

### forceTimeout (Number)

Milliseconds to wait for the cleanup to finish before forcing exit.

## Code Map

```txt
1 - Uncaught Exception  
2 - Unhandled Promise Rejection  
3 - SIGINT  
4 - SIGUSR1  
5 - SIGUSR2  
```

Graceful Exit

```txt
100 - Error on Graceful Exit Process  
101 - Programmatically quitting
```

You can add your own messages or overwrite these by passing a Map in `customCodeMap` when calling the `setup` method.

```js
// src/index.js
import { setup } from 'graceful-exit';

import myCustomFileLogger from 'myCustomFileLogger';

const fileLogger = { 
  info: myCustomFileLogger.infoMethod,
  error: myCustomFileLogger.errorMethod,
};

setup({ fileLogger });
```

## Contribute

Any pull requests with bugs, suggestions and improvements are appreciated.

### Tests

Tests are built using Mocha, Sinon and Chai.

```sh
$ npm test # Just once
$ npm run test-watch # Keep watching
```

There are still some missing tests. Feel free to write them if you want =)

## License

[MIT](./LICENSE)
