/* eslint-disable prefer-arrow-callback, func-names */
const { assert } = require('chai');
const sinon = require('sinon');

const methodsWrap = require('../methods');

describe('Methods', () => {
  const errorMsg = 'test error';
  const error = new Error(errorMsg);

  let logger;
  let fileLogger;
  let callbacksArray;
  let codeMap;
  let timeoutAfter;
  let extraInfoSymbol;
  let skipCleanup;

  let cleanup;
  let methods;

  sinon.spy(process, 'emit');


  beforeEach(function () {
    logger = sinon.fake();
    fileLogger = sinon.fake();
    callbacksArray = [sinon.fake()];
    codeMap = new Map([[666, 'The number of the beast']]);
    timeoutAfter = 10;
    extraInfoSymbol = Symbol('symbol');
    skipCleanup = false;
    cleanup = sinon.fake();

    process.on('cleanup', cleanup);
    process.emit.resetHistory();

    methods = methodsWrap({
      logger, fileLogger, skipCleanup, callbacksArray, codeMap, timeoutAfter, extraInfoSymbol,
    });
  });

  afterEach(() => {
    process.removeListener('cleanup', cleanup);
    process.emit.resetHistory();
  });

  after(() => {
    process.emit.restore();
  });

  describe('uncaughtException', () => {
    it('should log error message with provided logger object', () => {
      methods.uncaughtException(error);
      assert(logger.calledOnce);
      assert(RegExp(error.toString()).test(logger.firstCall.args[0]));
    });

    it('should fallback to logger function', () => {
      const fake = sinon.fake();
      methods = methodsWrap({
        logger: { error: fake }, fileLogger, skipCleanup, callbacksArray, codeMap, timeoutAfter, extraInfoSymbol,
      });
      methods.uncaughtException(error);
      assert(fake.calledOnce);
      assert(RegExp(error.toString()).test(fake.firstCall.args[0]));
    });

    it('should log error message with provided file logger', () => {
      methods.uncaughtException(error);
      assert(fileLogger.calledOnce);
      assert(RegExp(error.toString()).test(fileLogger.firstCall.args[0]));
    });

    it('should emit cleanup with code 1', () => {
      methods.uncaughtException(error);
      assert(process.emit.calledOnceWith('cleanup', 1));
    });
  });

  describe('unhandledRejection', () => {
    it('', () => {

    });
  });

  describe('SIGINT', () => {
    it('should emit cleanup with code 3', () => {
      methods.SIGINT();
      assert(process.emit.calledOnceWith('cleanup', 3));
    });
  });

  describe('SIGUSR1', () => {
    it('should emit cleanup with code 4', () => {
      methods.SIGUSR1();
      assert(process.emit.calledOnceWith('cleanup', 4));
    });
  });

  describe('SIGUSR2', () => {
    it('should emit cleanup with code 4', () => {
      methods.SIGUSR2();
      assert(process.emit.calledOnceWith('cleanup', 4));
    });
  });

  describe('exit', () => {
    it('', () => {

    });
  });

  describe('quit', () => {
    it('', () => {

    });
  });

  describe('cleanup', () => {
    it('', () => {

    });
  });

});
