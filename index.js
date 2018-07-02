const debug = require('debug');
const nodeLogger = require('simple-node-logger');

const codeMap = new Map([
  [1, 'Uncaught Exception'],
  [2, 'Unhandled Promise Rejection'],
  [3, 'SIGINT'],
  [4, 'SIGUSR1'],
  [5, 'SIGUSR2'],
  [100, 'Error on Graceful Exit Process'],
  [101, 'Programmatically quitting'],
]);

const skipCleanup = Symbol('skipCleanup');
let errorsLog = () => {};
let debugError = () => {};

function setup({
  callbacks = () => {},
  logPath,
  debugLabel,
  logger,
  fileLogger,
  customCodeMap,
  timeoutAfter = 5000,
}) {
  const callbacksArray = Array.isArray(callbacks) ? callbacks : [callbacks];
  if (customCodeMap) customCodeMap.forEach((a, b) => codeMap.set(b, a));

  if (logPath) errorsLog = nodeLogger.createSimpleFileLogger(logPath);
  if (debugLabel) debugError = debug(debugLabel);

  if (logger) errorsLog = fileLogger;
  if (fileLogger) debugError = logger;


  const extraInfoSymbol = Symbol('extraInfoSymbol');

  // Capture Errors not caught and start cleanup
  process.on('uncaughtException', (err) => {
    const errorMsg = err;
    (errorsLog.error || errorsLog)(`Uncaught Exception -> ${errorMsg.stack}`);
    debugError(`Uncaught Exception -> ${errorMsg.stack}`);
    process.emit('cleanup', 1);
  });

  // Capture Promise rejections not handled and start cleanup
  process.on('unhandledRejection', (reason, p) => {
    const errorMsg = `Promise: ${reason}`;
    (errorsLog.error || errorsLog)(`Unhandled Rejection -> ${errorMsg}\n`, p);
    debugError(`Unhandled Rejection -> ${errorMsg}\n`, p);
    process.emit('cleanup', 2);
  });

  // catch ctrl+c event and exit normally
  process.on('SIGINT', () => process.emit('cleanup', 3));

  // catches "kill pid" (for example: nodemon restart)
  process.on('SIGUSR1', () => process.emit('cleanup', 4));
  process.on('SIGUSR2', () => process.emit('cleanup', 5));

  process.on('exit', (code) => {
    if (process[extraInfoSymbol]) {
      const extraInfo = JSON.stringify(process[extraInfoSymbol], null, 2);
      debugError(`Graceful Exit extra info: ${extraInfo}`);
      (errorsLog.info || errorsLog)(extraInfo);
    }

    const errorMsg = `(PID ${process.pid}) Exiting with code: ${code} - ${codeMap.get(code)}`;
    (errorsLog.info || errorsLog)(errorMsg);
    debugError(errorMsg);
  });

  process.on('quit', code => process.emit('cleanup', code || 101));

  process.on('cleanup', (code) => {
    if (process[skipCleanup]) return debugError('CLEANUP WAS CALLED AGAIN!!! There is some error leaking in the cleanup process.');
    process[skipCleanup] = true;
    callbacksArray.forEach(cb => cb(code, codeMap.get(code)));

    // Set cleanup timeout
    setTimeout(() => {
      process.exit(code);
      debugError('Cleanup Timeout');
      (errorsLog.info || errorsLog)('Cleanup Timeout');
    }, timeoutAfter);
  });

  return ({ symbols: { extraInfoSymbol } });
}

let cleanupsCount = 0;
let cleanupsRan = 0;

function gracefulExit(callback = () => { }) {
  cleanupsCount++;

  process.on('cleanup', async (code) => {
    if (process[skipCleanup]) return;
    debugError('CLEANUP GRACEFULLY', cleanupsCount, cleanupsRan);
    try {
      await callback();
    } catch (e) {
      debugError('Error on cleanup callback', e);
    }
    cleanupsRan++;
    if (cleanupsCount === cleanupsRan) process.exit(code);
  });
}

module.exports = {
  setup,
  gracefulExit,
};
