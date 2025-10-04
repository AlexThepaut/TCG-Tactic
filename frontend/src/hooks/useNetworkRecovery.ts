/**
 * useNetworkRecovery Hook
 * Enhanced network error recovery with exponential backoff and retry logic
 * Task 1.3G - Enhanced Error Handling
 */
import { useState, useCallback, useEffect, useRef } from 'react';

export interface NetworkRecoveryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  onRetryAttempt?: (attempt: number, maxRetries: number) => void;
  onRecoverySuccess?: () => void;
  onRecoveryFailure?: (error: Error) => void;
}

export interface NetworkRecoveryState {
  isRecovering: boolean;
  retryCount: number;
  lastError: Error | null;
  canRetry: boolean;
}

const DEFAULT_OPTIONS: Required<NetworkRecoveryOptions> = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffMultiplier: 2,
  onRetryAttempt: () => {},
  onRecoverySuccess: () => {},
  onRecoveryFailure: () => {}
};

/**
 * Network recovery hook with exponential backoff
 */
export const useNetworkRecovery = (options: NetworkRecoveryOptions = {}) => {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  const [state, setState] = useState<NetworkRecoveryState>({
    isRecovering: false,
    retryCount: 0,
    lastError: null,
    canRetry: true
  });

  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const recoveryFnRef = useRef<(() => Promise<void>) | null>(null);

  /**
   * Calculate delay with exponential backoff
   */
  const calculateDelay = useCallback((attempt: number): number => {
    const delay = Math.min(
      opts.initialDelay * Math.pow(opts.backoffMultiplier, attempt),
      opts.maxDelay
    );
    return delay;
  }, [opts.initialDelay, opts.backoffMultiplier, opts.maxDelay]);

  /**
   * Clear any pending retry
   */
  const clearRetry = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, []);

  /**
   * Attempt recovery with exponential backoff
   */
  const attemptRecovery = useCallback(async (
    recoveryFn: () => Promise<void>,
    attempt: number = 0
  ): Promise<void> => {
    // Check if we've exceeded max retries
    if (attempt >= opts.maxRetries) {
      const error = state.lastError || new Error('Max retries exceeded');
      setState(prev => ({
        ...prev,
        isRecovering: false,
        canRetry: false
      }));
      opts.onRecoveryFailure(error);
      return;
    }

    setState(prev => ({
      ...prev,
      isRecovering: true,
      retryCount: attempt
    }));

    // Notify of retry attempt
    opts.onRetryAttempt(attempt + 1, opts.maxRetries);

    try {
      // Attempt recovery
      await recoveryFn();

      // Success - reset state
      setState({
        isRecovering: false,
        retryCount: 0,
        lastError: null,
        canRetry: true
      });
      clearRetry();
      opts.onRecoverySuccess();

    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));

      setState(prev => ({
        ...prev,
        lastError: err,
        retryCount: attempt + 1
      }));

      // Schedule next retry with exponential backoff
      const delay = calculateDelay(attempt);
      console.log(`Network recovery attempt ${attempt + 1}/${opts.maxRetries} failed. Retrying in ${delay}ms...`);

      retryTimeoutRef.current = setTimeout(() => {
        attemptRecovery(recoveryFn, attempt + 1);
      }, delay);
    }
  }, [opts, state.lastError, calculateDelay, clearRetry]);

  /**
   * Start recovery process
   */
  const startRecovery = useCallback((recoveryFn: () => Promise<void>) => {
    clearRetry();
    recoveryFnRef.current = recoveryFn;

    setState({
      isRecovering: true,
      retryCount: 0,
      lastError: null,
      canRetry: true
    });

    attemptRecovery(recoveryFn, 0);
  }, [attemptRecovery, clearRetry]);

  /**
   * Manual retry (triggered by user)
   */
  const retry = useCallback(() => {
    if (!state.canRetry || !recoveryFnRef.current) {
      console.warn('Cannot retry: recovery not available or max retries exceeded');
      return;
    }

    // Reset and start fresh recovery
    setState({
      isRecovering: true,
      retryCount: 0,
      lastError: null,
      canRetry: true
    });

    clearRetry();
    attemptRecovery(recoveryFnRef.current, 0);
  }, [state.canRetry, attemptRecovery, clearRetry]);

  /**
   * Cancel recovery process
   */
  const cancelRecovery = useCallback(() => {
    clearRetry();
    setState({
      isRecovering: false,
      retryCount: 0,
      lastError: null,
      canRetry: false
    });
  }, [clearRetry]);

  /**
   * Reset recovery state
   */
  const reset = useCallback(() => {
    clearRetry();
    recoveryFnRef.current = null;
    setState({
      isRecovering: false,
      retryCount: 0,
      lastError: null,
      canRetry: true
    });
  }, [clearRetry]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearRetry();
    };
  }, [clearRetry]);

  return {
    ...state,
    startRecovery,
    retry,
    cancelRecovery,
    reset
  };
};

export default useNetworkRecovery;
