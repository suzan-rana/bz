import { useCallback } from 'react';
import NProgress from 'nprogress';

export const useProgress = () => {
  const startProgress = useCallback(() => {
    NProgress.start();
  }, []);

  const completeProgress = useCallback(() => {
    NProgress.done();
  }, []);

  const withProgress = useCallback(async <T>(
    promise: Promise<T>,
    options?: { 
      startImmediately?: boolean;
      delay?: number;
    }
  ): Promise<T> => {
    const { startImmediately = true, delay = 0 } = options || {};
    
    if (startImmediately) {
      NProgress.start();
    }

    try {
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      const result = await promise;
      return result;
    } finally {
      NProgress.done();
    }
  }, []);

  return {
    startProgress,
    completeProgress,
    withProgress,
  };
};
