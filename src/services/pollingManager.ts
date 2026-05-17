/**
 * PollingManager — 定期輪詢管理器
 *
 * 使用 setInterval 定期觸發 update callback，
 * 錯誤時觸發 onError 回呼但不中斷輪詢。
 */
export class PollingManager {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private updateCallback: (() => void | Promise<void>) | null = null;
  private errorCallback: ((error: Error) => void) | null = null;

  /**
   * 啟動輪詢。立即執行一次 update callback，之後每隔 intervalMs 毫秒執行。
   * 若已在運行中，會先停止再重新啟動。
   */
  start(intervalMs: number): void {
    if (this.intervalId !== null) {
      this.stop();
    }

    this.executeUpdate();

    this.intervalId = setInterval(() => {
      this.executeUpdate();
    }, intervalMs);
  }

  /** 停止輪詢，清除計時器。 */
  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /** 註冊 update 回呼，輪詢觸發時呼叫。 */
  onUpdate(callback: () => void | Promise<void>): void {
    this.updateCallback = callback;
  }

  /** 註冊 error 回呼，update 拋出錯誤時呼叫。 */
  onError(callback: (error: Error) => void): void {
    this.errorCallback = callback;
  }

  // -----------------------------------------------------------------------
  // Private
  // -----------------------------------------------------------------------

  private executeUpdate(): void {
    if (!this.updateCallback) return;

    try {
      const result = this.updateCallback();
      // Handle async callbacks — catch rejected promises
      if (result && typeof (result as Promise<void>).catch === 'function') {
        (result as Promise<void>).catch((err: unknown) => {
          this.handleError(err);
        });
      }
    } catch (err: unknown) {
      this.handleError(err);
    }
  }

  private handleError(err: unknown): void {
    if (this.errorCallback) {
      const error = err instanceof Error ? err : new Error(String(err));
      this.errorCallback(error);
    }
  }
}
