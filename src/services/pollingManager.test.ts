import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PollingManager } from './pollingManager';

describe('PollingManager', () => {
  let manager: PollingManager;

  beforeEach(() => {
    vi.useFakeTimers();
    manager = new PollingManager();
  });

  afterEach(() => {
    manager.stop();
    vi.useRealTimers();
  });

  describe('start / stop', () => {
    it('calls update callback immediately on start', () => {
      const update = vi.fn();
      manager.onUpdate(update);
      manager.start(1000);

      expect(update).toHaveBeenCalledTimes(1);
    });

    it('calls update callback on each interval tick', () => {
      const update = vi.fn();
      manager.onUpdate(update);
      manager.start(500);

      // immediate call
      expect(update).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(500);
      expect(update).toHaveBeenCalledTimes(2);

      vi.advanceTimersByTime(500);
      expect(update).toHaveBeenCalledTimes(3);
    });

    it('stops polling when stop() is called', () => {
      const update = vi.fn();
      manager.onUpdate(update);
      manager.start(500);

      expect(update).toHaveBeenCalledTimes(1);

      manager.stop();
      vi.advanceTimersByTime(1500);

      // No additional calls after stop
      expect(update).toHaveBeenCalledTimes(1);
    });

    it('restarts polling if start() is called while already running', () => {
      const update = vi.fn();
      manager.onUpdate(update);
      manager.start(500);

      expect(update).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(250);

      // Restart with a different interval
      manager.start(1000);
      // Immediate call again on restart
      expect(update).toHaveBeenCalledTimes(2);

      // Old 500ms interval should not fire
      vi.advanceTimersByTime(500);
      expect(update).toHaveBeenCalledTimes(2);

      // New 1000ms interval fires
      vi.advanceTimersByTime(500);
      expect(update).toHaveBeenCalledTimes(3);
    });
  });

  describe('onUpdate', () => {
    it('does nothing if no update callback is registered', () => {
      // Should not throw
      expect(() => manager.start(1000)).not.toThrow();
    });
  });

  describe('onError', () => {
    it('calls error callback when sync update throws', () => {
      const errorCb = vi.fn();
      const error = new Error('sync failure');

      manager.onUpdate(() => { throw error; });
      manager.onError(errorCb);
      manager.start(1000);

      expect(errorCb).toHaveBeenCalledWith(error);
    });

    it('calls error callback when async update rejects', async () => {
      const errorCb = vi.fn();
      const error = new Error('async failure');

      manager.onUpdate(async () => { throw error; });
      manager.onError(errorCb);
      manager.start(1000);

      // Let microtasks (promise rejection) flush
      await vi.advanceTimersByTimeAsync(0);

      expect(errorCb).toHaveBeenCalledWith(error);
    });

    it('wraps non-Error throws into Error objects', () => {
      const errorCb = vi.fn();

      manager.onUpdate(() => { throw 'string error'; });
      manager.onError(errorCb);
      manager.start(1000);

      expect(errorCb).toHaveBeenCalledTimes(1);
      const received = errorCb.mock.calls[0][0];
      expect(received).toBeInstanceOf(Error);
      expect(received.message).toBe('string error');
    });

    it('does not stop polling when update throws', () => {
      const errorCb = vi.fn();
      let callCount = 0;

      manager.onUpdate(() => {
        callCount++;
        if (callCount === 1) throw new Error('first call fails');
      });
      manager.onError(errorCb);
      manager.start(500);

      // First call throws
      expect(errorCb).toHaveBeenCalledTimes(1);
      expect(callCount).toBe(1);

      // Polling continues
      vi.advanceTimersByTime(500);
      expect(callCount).toBe(2);
      // Second call doesn't throw, so error count stays at 1
      expect(errorCb).toHaveBeenCalledTimes(1);
    });

    it('silently ignores errors when no error callback is registered', () => {
      manager.onUpdate(() => { throw new Error('ignored'); });
      // No onError registered — should not throw
      expect(() => manager.start(1000)).not.toThrow();
    });
  });
});
