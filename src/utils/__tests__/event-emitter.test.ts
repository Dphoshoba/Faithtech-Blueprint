import { EventEmitter } from '../event-emitter';

describe('EventEmitter', () => {
  let eventEmitter: EventEmitter;

  beforeEach(() => {
    eventEmitter = new EventEmitter();
  });

  describe('on and emit', () => {
    it('should call registered callback when event is emitted', () => {
      const callback = jest.fn();
      eventEmitter.on('test', callback);
      
      eventEmitter.emit('test', { data: 'test' });
      
      expect(callback).toHaveBeenCalledWith({ data: 'test' });
    });

    it('should call multiple callbacks for the same event', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      
      eventEmitter.on('test', callback1);
      eventEmitter.on('test', callback2);
      
      eventEmitter.emit('test', { data: 'test' });
      
      expect(callback1).toHaveBeenCalledWith({ data: 'test' });
      expect(callback2).toHaveBeenCalledWith({ data: 'test' });
    });

    it('should not call callbacks for different events', () => {
      const callback = jest.fn();
      eventEmitter.on('test1', callback);
      
      eventEmitter.emit('test2', { data: 'test' });
      
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('off', () => {
    it('should remove specific callback', () => {
      const callback = jest.fn();
      eventEmitter.on('test', callback);
      
      eventEmitter.off('test', callback);
      eventEmitter.emit('test', { data: 'test' });
      
      expect(callback).not.toHaveBeenCalled();
    });

    it('should not affect other callbacks', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      
      eventEmitter.on('test', callback1);
      eventEmitter.on('test', callback2);
      
      eventEmitter.off('test', callback1);
      eventEmitter.emit('test', { data: 'test' });
      
      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalledWith({ data: 'test' });
    });
  });

  describe('once', () => {
    it('should call callback only once', () => {
      const callback = jest.fn();
      eventEmitter.once('test', callback);
      
      eventEmitter.emit('test', { data: 'test1' });
      eventEmitter.emit('test', { data: 'test2' });
      
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith({ data: 'test1' });
    });
  });

  describe('removeAllListeners', () => {
    it('should remove all callbacks for specific event', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      
      eventEmitter.on('test1', callback1);
      eventEmitter.on('test2', callback2);
      
      eventEmitter.removeAllListeners('test1');
      eventEmitter.emit('test1', { data: 'test1' });
      eventEmitter.emit('test2', { data: 'test2' });
      
      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalledWith({ data: 'test2' });
    });

    it('should remove all callbacks when no event specified', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      
      eventEmitter.on('test1', callback1);
      eventEmitter.on('test2', callback2);
      
      eventEmitter.removeAllListeners();
      eventEmitter.emit('test1', { data: 'test1' });
      eventEmitter.emit('test2', { data: 'test2' });
      
      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).not.toHaveBeenCalled();
    });
  });

  describe('listenerCount', () => {
    it('should return correct number of listeners', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      
      expect(eventEmitter.listenerCount('test')).toBe(0);
      
      eventEmitter.on('test', callback1);
      expect(eventEmitter.listenerCount('test')).toBe(1);
      
      eventEmitter.on('test', callback2);
      expect(eventEmitter.listenerCount('test')).toBe(2);
      
      eventEmitter.off('test', callback1);
      expect(eventEmitter.listenerCount('test')).toBe(1);
    });
  });

  describe('error handling', () => {
    it('should catch and log errors in callbacks', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const error = new Error('Test error');
      const callback = jest.fn().mockImplementation(() => {
        throw error;
      });
      
      eventEmitter.on('test', callback);
      eventEmitter.emit('test', { data: 'test' });
      
      expect(consoleSpy).toHaveBeenCalledWith('Error in event handler for test:', error);
      consoleSpy.mockRestore();
    });

    it('should continue executing other callbacks after error', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const callback1 = jest.fn().mockImplementation(() => {
        throw new Error('Test error');
      });
      const callback2 = jest.fn();
      
      eventEmitter.on('test', callback1);
      eventEmitter.on('test', callback2);
      
      eventEmitter.emit('test', { data: 'test' });
      
      expect(callback2).toHaveBeenCalledWith({ data: 'test' });
      consoleSpy.mockRestore();
    });
  });
}); 