const debug = require('debug');
const nodeLogger = require('simple-node-logger');

const methods = require('./methods');

const codeMap = new Map([
  [1, 'Uncaught Exception'],
  [2, 'Unhandled Promise Rejection'],
  [3, 'SIGINT'],
  [4, 'SIGUSR1'],
  [5, 'SIGUSR2'],
  [100, 'Error on Graceful Exit Process'],
  [101, 'Programmatically quitting'],
]);

let logger = () => {};
let fileLogger = () => {};

let cleanupsCount = 0;
let cleanupsRan = 0;
let cleanupsFinished = 0;

function setup({
  callbacks = () => {},
  logPath,
  debugLabel,
  logger: loggerParam,
  fileLogger: fileLoggerParam,
  customCodeMap,
  timeoutAfter = 5000,
}) {
  const skipCleanup = Symbol('skipCleanup');

  // Add custom code map
  const callbacksArray = Array.isArray(callbacks) ? callbacks : [callbacks];
  if (customCodeMap) customCodeMap.forEach((a, b) => codeMap.set(b, a));

  // Use builtin loggers
  if (logPath) logger = nodeLogger.createSimpleFileLogger(logPath);
  if (debugLabel) fileLogger = debug(debugLabel);

  // Use custom logger functions
  if (loggerParam) logger = loggerParam;
  if (fileLoggerParam) fileLogger = fileLoggerParam;

  const extraInfoSymbol = Symbol('extraInfoSymbol');
  global[extraInfoSymbol] = {};

  const {
    uncaughtException, unhandledRejection, SIGINT, SIGUSR1, SIGUSR2, exit, quit, cleanup,
  } = methods({
    logger,
    fileLogger,
    skipCleanup,
    callbacksArray,
    codeMap,
    timeoutAfter,
    extraInfoSymbol,
  });

  // Capture Errors not caught and start cleanup
  process.on('uncaughtException', uncaughtException);

  // Capture Promise rejections not handled and start cleanup
  process.on('unhandledRejection', unhandledRejection);

  // catch ctrl+c event and exit normally
  process.on('SIGINT', SIGINT);

  // catches "kill pid" (for example: nodemon restart)
  process.on('SIGUSR1', SIGUSR1);
  process.on('SIGUSR2', SIGUSR2);
  process.on('exit', exit);

  // call to exit
  process.on('quit', quit);

  process.on('cleanup', cleanup);

  return { extraInfoSymbol };
}

function gracefulExit(callback = () => { }) {
  cleanupsCount++;

  process.on('cleanup', async (code) => {
    // If 'cleanup' is called a second time, don't trigger the callbacks
    if (cleanupsRan >= cleanupsCount) return;
    cleanupsRan++;
    fileLogger('CLEANUP GRACEFULLY', cleanupsCount, cleanupsFinished);

    try {
      await callback();
    } catch (e) { fileLogger('Error on cleanup callback', e); }

    cleanupsFinished++;

    if (cleanupsCount === cleanupsFinished) process.exit(code);
  });
}

module.exports = {
  setup,
  gracefulExit,
};
