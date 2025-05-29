import { EventEmitter } from '../eventEmitter';

describe('EventEmitter', () => {
  let emitter: EventEmitter;

  beforeEach(() => {
    emitter = new EventEmitter();
  });

  describe('basic event handling', () => {
    it('should add and trigger event listeners', () => {
      const callback = jest.fn();
      emitter.on('test', callback);
      emitter.emit('test', 'arg1', 'arg2');
      
      expect(callback).toHaveBeenCalledWith('arg1', 'arg2');
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple listeners for same event', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      
      emitter.on('test', callback1);
      emitter.on('test', callback2);
      emitter.emit('test', 'data');
      
      expect(callback1).toHaveBeenCalledWith('data');
      expect(callback2).toHaveBeenCalledWith('data');
    });

    it('should not trigger removed listeners', () => {
      const callback = jest.fn();
      emitter.on('test', callback);
      emitter.off('test', callback);
      emitter.emit('test');
      
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('once', () => {
    it('should trigger listener only once', () => {
      const callback = jest.fn();
      emitter.once('test', callback);
      
      emitter.emit('test', 'first');
      emitter.emit('test', 'second');
      
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith('first');
    });
  });

  describe('removeAllListeners', () => {
    it('should remove all listeners for specific event', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      
      emitter.on('test1', callback1);
      emitter.on('test2', callback2);
      
      emitter.removeAllListeners('test1');
      
      emitter.emit('test1');
      emitter.emit('test2');
      
      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
    });

    it('should remove all listeners when no event specified', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      
      emitter.on('test1', callback1);
      emitter.on('test2', callback2);
      
      emitter.removeAllListeners();
      
      emitter.emit('test1');
      emitter.emit('test2');
      
      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle errors in listeners', () => {
      const errorCallback = jest.fn(() => {
        throw new Error('Test error');
      });
      const normalCallback = jest.fn();
      
      emitter.on('test', errorCallback);
      emitter.on('test', normalCallback);
      
      // Should not throw
      emitter.emit('test');
      
      expect(errorCallback).toHaveBeenCalled();
      expect(normalCallback).toHaveBeenCalled();
    });
  });

  describe('listenerCount', () => {
    it('should return correct number of listeners', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      
      expect(emitter.listenerCount('test')).toBe(0);
      
      emitter.on('test', callback1);
      expect(emitter.listenerCount('test')).toBe(1);
      
      emitter.on('test', callback2);
      expect(emitter.listenerCount('test')).toBe(2);
      
      emitter.off('test', callback1);
      expect(emitter.listenerCount('test')).toBe(1);
    });
  });
}); 