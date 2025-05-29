import logger from '../logger';

describe('Logger', () => {
  const originalConsole = { ...console };
  let consoleSpies: { [key: string]: jest.SpyInstance };

  beforeEach(() => {
    // Spy on console methods
    consoleSpies = {
      debug: jest.spyOn(console, 'debug').mockImplementation(),
      info: jest.spyOn(console, 'info').mockImplementation(),
      warn: jest.spyOn(console, 'warn').mockImplementation(),
      error: jest.spyOn(console, 'error').mockImplementation()
    };
  });

  afterEach(() => {
    // Restore console methods
    Object.values(consoleSpies).forEach(spy => spy.mockRestore());
  });

  afterAll(() => {
    // Restore original console
    Object.assign(console, originalConsole);
  });

  describe('log levels', () => {
    it('should respect log level hierarchy', () => {
      const testMessage = 'test message';
      
      // Set log level to info
      process.env.LOG_LEVEL = 'info';
      
      logger.debug(testMessage);
      logger.info(testMessage);
      logger.warn(testMessage);
      logger.error(testMessage);

      expect(consoleSpies.debug).not.toHaveBeenCalled();
      expect(consoleSpies.info).toHaveBeenCalled();
      expect(consoleSpies.warn).toHaveBeenCalled();
      expect(consoleSpies.error).toHaveBeenCalled();
    });

    it('should only show errors at error level', () => {
      process.env.LOG_LEVEL = 'error';
      
      logger.debug('debug');
      logger.info('info');
      logger.warn('warn');
      logger.error('error');

      expect(consoleSpies.debug).not.toHaveBeenCalled();
      expect(consoleSpies.info).not.toHaveBeenCalled();
      expect(consoleSpies.warn).not.toHaveBeenCalled();
      expect(consoleSpies.error).toHaveBeenCalled();
    });

    it('should show all logs at debug level', () => {
      process.env.LOG_LEVEL = 'debug';
      
      logger.debug('debug');
      logger.info('info');
      logger.warn('warn');
      logger.error('error');

      expect(consoleSpies.debug).toHaveBeenCalled();
      expect(consoleSpies.info).toHaveBeenCalled();
      expect(consoleSpies.warn).toHaveBeenCalled();
      expect(consoleSpies.error).toHaveBeenCalled();
    });
  });

  describe('message formatting', () => {
    it('should include timestamp and level in message', () => {
      const testMessage = 'test message';
      logger.info(testMessage);

      const loggedMessage = (consoleSpies.info.mock.calls[0][0] as string);
      expect(loggedMessage).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/); // ISO timestamp
      expect(loggedMessage).toContain('INFO:');
      expect(loggedMessage).toContain(testMessage);
    });

    it('should handle additional arguments', () => {
      const testMessage = 'test message';
      const additionalArg = { key: 'value' };
      
      logger.info(testMessage, additionalArg);

      expect(consoleSpies.info).toHaveBeenCalledWith(
        expect.stringContaining(testMessage),
        additionalArg
      );
    });
  });

  describe('child loggers', () => {
    it('should create child logger with prefix', () => {
      const childLogger = logger.child('TestModule');
      childLogger.info('test message');

      const loggedMessage = (consoleSpies.info.mock.calls[0][0] as string);
      expect(loggedMessage).toContain('[TestModule]');
    });

    it('should support nested child loggers', () => {
      const childLogger = logger.child('Parent');
      const grandchildLogger = childLogger.child('Child');
      
      grandchildLogger.info('test message');

      const loggedMessage = (consoleSpies.info.mock.calls[0][0] as string);
      expect(loggedMessage).toContain('[Parent:Child]');
    });
  });

  describe('error handling', () => {
    it('should handle Error objects', () => {
      const error = new Error('test error');
      logger.error('An error occurred', error);

      expect(consoleSpies.error).toHaveBeenCalledWith(
        expect.stringContaining('An error occurred'),
        error
      );
    });

    it('should handle circular references', () => {
      const circular: any = { key: 'value' };
      circular.self = circular;
      
      logger.info('Circular object', circular);

      expect(consoleSpies.info).toHaveBeenCalled();
      // Should not throw
    });
  });
}); 