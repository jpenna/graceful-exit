# Graceful Exit

Finish everything up before exiting NodeJS process.

This module has only 2 dependencies, which are used for debugging purposes: `debug` and `simple-node-logger`.

## Warnings

1 - We are dealing with errors in general, some errors may prevent `graceful-exit` to work properly (unstable state, for example). On most cases it won't happen.

2 - DON'T USE THIS MODULE TO CONTINUE YOUR PROCESS. Use it just to handle loose edges, such as finish writing to a file or logging something.

## Installation

```
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
  timeoutAfter, // Number [Optional] = 5000
});

// Begin code...
```

On each module that should be cleaned up before exiting, add the `gracefulExit` method.

```js
// src/index.js
import { gracefulExit } from 'graceful-exit';

function onExit() {
  // Do your cleanup...
  // You can also return a Promise, the process will only exit when the Promise resolves, rejects or the timeout is fired
}

gracefulExit(onExit);

// Begin code...
```

## Setup parameters (ALL parameters ARE OPTIONAL)

### logPath (String)

Where the log file should be placed. If not set, the builtin file 
logger won't be used

### debugLabel (String)

What label should be used to debug. If not set, the builtin debug won't be used

### callbacks (Array | Function)

List of callbacks to be called when running the cleanup process

### customCodeMap (Map)

The basic error codes have been set already. Pass this parameter overwrite the predefined messages (check below) or add your custom error codes/messages

### logger (Function)

Override the builtin log function by a custom logger function 

### fileLogger (Function | Object: { info, error })

Override the builtin file log function by a custom logger function. If an object is passed, the methods `info` and `error` are expected.

### timeoutAfter (Number)

Milliseconds to wait for the cleanup to finish before forcing exit.

## Code Map

1 - Uncaught Exception  
2 - Unhandled Promise Rejection  
3 - SIGINT  
4 - SIGUSR1  
5 - SIGUSR2  

Graceful Exit

100 - Error on Graceful Exit Process  
101 - Programmatically quitting

You can add your own messages or overwrite these by passing a Map in `customCodeMap` when calling the `setup` method.

## Contribute

Any pull requests with bugs, suggestions and improvements are appreciated.

## License

[MIT](./LICENSE)
