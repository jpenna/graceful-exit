function methods({
  logger, fileLogger, skipCleanup, callbacksArray, codeMap, forceExitAfter, extraInfoSymbol,
}) {
  return {
    uncaughtException(err) {
      (logger.error || logger)(`Uncaught Exception -> ${err.stack}`);
      fileLogger(`Uncaught Exception -> ${err.stack}`);
      process.emit('cleanup', 1);
    },

    unhandledRejection(reason, p) {
      const errorMsg = `Promise: ${reason}`;
      (logger.error || logger)(`Unhandled Rejection -> ${errorMsg}\n`, p);
      fileLogger(`Unhandled Rejection -> ${errorMsg}\n`, p);
      process.emit('cleanup', 2);
    },

    SIGINT() { process.emit('cleanup', 3); },
    SIGUSR1() { process.emit('cleanup', 4); },
    SIGUSR2() { process.emit('cleanup', 4); },

    exit(code) {
      if (Object.keys(global[extraInfoSymbol]).length) {
        const extraInfo = JSON.stringify(global[extraInfoSymbol], null, 2);
        fileLogger(`Graceful Exit extra info: ${extraInfo}`);
        (logger.info || logger)(extraInfo);
      }

      const errorMsg = `(PID ${process.pid}) Exiting with code: ${code} - ${codeMap.get(code)}`;
      (logger.info || logger)(errorMsg);
      fileLogger(errorMsg);
    },

    quit(code) { process.emit('cleanup', code || 101); },

    cleanup(code) {
      if (global[skipCleanup]) {
        // if SIGINT for second time
        if (code === 3) {
          fileLogger('Force Exit (2x SIGINT)');
          (logger.info || logger)('Force Exit (2x SIGINT)');
          process.exit(code);
        }
        return fileLogger('CLEANUP WAS CALLED AGAIN!!! There is some error leaking in the cleanup process.');
      }
      global[skipCleanup] = true;
      callbacksArray.forEach(cb => cb(code, codeMap.get(code)));

      // Set cleanup timeout
      setTimeout(() => {
        process.exit(code);
        fileLogger('Cleanup Timeout');
        (logger.info || logger)('Cleanup Timeout');
      }, forceExitAfter);
    },
  };
}

module.exports = methods;
