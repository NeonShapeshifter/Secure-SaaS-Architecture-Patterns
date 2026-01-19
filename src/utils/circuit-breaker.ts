interface CircuitBreakerOptions {
  threshold: number; // Number of failures before opening
  timeout: number;   // Cooldown period in ms before trying again (Half-Open)
  name?: string;     // For logging
}

enum CircuitState {
  CLOSED,   // Normal operation
  OPEN,     // Failing, request blocked immediately
  HALF_OPEN // Testing if service is back
}

/**
 * A robust Circuit Breaker implementation for protecting distributed dependencies.
 * Used here to wrap Redis calls for session management.
 */
export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failures = 0;
  private nextAttempt = 0;
  private readonly options: CircuitBreakerOptions;

  constructor(options: CircuitBreakerOptions) {
    this.options = options;
  }

  public async execute<T>(action: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() < this.nextAttempt) {
        throw new Error(`Circuit '${this.options.name}' is OPEN`);
      }
      this.state = CircuitState.HALF_OPEN;
    }

    try {
      const result = await action();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = CircuitState.CLOSED;
  }

  private onFailure() {
    this.failures++;
    if (this.failures >= this.options.threshold) {
      this.state = CircuitState.OPEN;
      this.nextAttempt = Date.now() + this.options.timeout;
      console.warn(`[CircuitBreaker] ${this.options.name} is now OPEN`);
    }
  }
}
