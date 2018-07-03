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
let logger = () => {};
let fileLogger = () => {};

function setup({
  callbacks = () => {},
  logPath,
  debugLabel,
  logger: loggerParam,
  fileLogger: fileLoggerParam,
  customCodeMap,
  timeoutAfter = 5000,
}) {
  const callbacksArray = Array.isArray(callbacks) ? callbacks : [callbacks];
  if (customCodeMap) customCodeMap.forEach((a, b) => codeMap.set(b, a));

  if (logPath) logger = nodeLogger.createSimpleFileLogger(logPath);
  if (debugLabel) fileLogger = debug(debugLabel);

  if (loggerParam) logger = loggerParam;
  if (fileLoggerParam) fileLogger = fileLoggerParam;


  const extraInfoSymbol = Symbol('extraInfoSymbol');
  global[extraInfoSymbol] = {};

  // Capture Errors not caught and start cleanup
  process.on('uncaughtException', (err) => {
    const errorMsg = err;
    (logger.error || logger)(`Uncaught Exception -> ${errorMsg.stack}`);
    fileLogger(`Uncaught Exception -> ${errorMsg.stack}`);
    process.emit('cleanup', 1);
  });

  // Capture Promise rejections not handled and start cleanup
  process.on('unhandledRejection', (reason, p) => {
    const errorMsg = `Promise: ${reason}`;
    (logger.error || logger)(`Unhandled Rejection -> ${errorMsg}\n`, p);
    fileLogger(`Unhandled Rejection -> ${errorMsg}\n`, p);
    process.emit('cleanup', 2);
  });

  // catch ctrl+c event and exit normally
  process.on('SIGINT', () => process.emit('cleanup', 3));

  // catches "kill pid" (for example: nodemon restart)
  process.on('SIGUSR1', () => process.emit('cleanup', 4));
  process.on('SIGUSR2', () => process.emit('cleanup', 5));

  process.on('exit', (code) => {
    if (Object.keys(global[extraInfoSymbol]).length) {
      const extraInfo = JSON.stringify(global[extraInfoSymbol], null, 2);
      fileLogger(`Graceful Exit extra info: ${extraInfo}`);
      (logger.info || logger)(extraInfo);
    }

    const errorMsg = `(PID ${process.pid}) Exiting with code: ${code} - ${codeMap.get(code)}`;
    (logger.info || logger)(errorMsg);
    fileLogger(errorMsg);
  });

  process.on('quit', code => process.emit('cleanup', code || 101));

  process.on('cleanup', (code) => {
    if (global[skipCleanup]) return fileLogger('CLEANUP WAS CALLED AGAIN!!! There is some error leaking in the cleanup process.');
    global[skipCleanup] = true;
    callbacksArray.forEach(cb => cb(code, codeMap.get(code)));

    // Set cleanup timeout
    setTimeout(() => {
      process.exit(code);
      fileLogger('Cleanup Timeout');
      (logger.info || logger)('Cleanup Timeout');
    }, timeoutAfter);
  });

  return { extraInfoSymbol };
}

let cleanupsCount = 0;
let cleanupsRan = 0;
let cleanupsFinished = 0;

function gracefulExit(callback = () => { }) {
  cleanupsCount++;

  process.on('cleanup', async (code) => {
    if (cleanupsRan >= cleanupsCount) return;
    cleanupsRan++;
    fileLogger('CLEANUP GRACEFULLY', cleanupsCount, cleanupsFinished);
    try {
      await callback();
    } catch (e) {
      fileLogger('Error on cleanup callback', e);
    }
    cleanupsFinished++;
    if (cleanupsCount === cleanupsFinished) process.exit(code);
  });
}

module.exports = {
  setup,
  gracefulExit,
};
