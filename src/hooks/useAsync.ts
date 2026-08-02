import { useCallback, useEffect, useRef, useState } from "react";

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

/**
 * Runs a promise-returning task and tracks loading / error / data.
 * Late responses from superseded runs are discarded so fast typing in the
 * search field cannot resurrect a stale result set.
 */
export function useAsync<T>(
  task: () => Promise<T>,
  deps: unknown[],
): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const runId = useRef(0);

  // The task identity changes every render by design; deps drive re-runs.
  const taskRef = useRef(task);
  taskRef.current = task;

  useEffect(() => {
    const id = ++runId.current;
    setLoading(true);
    setError(null);

    taskRef
      .current()
      .then((result) => {
        if (id !== runId.current) return;
        setData(result);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (id !== runId.current) return;
        setError(err instanceof Error ? err.message : "Something went wrong.");
        setLoading(false);
      });

    return () => {
      // Bump the guard so an in-flight promise cannot commit after unmount.
      if (id === runId.current) runId.current++;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  return { data, loading, error, reload };
}

/** Debounces a rapidly changing value (search input) by `delay` ms. */
export function useDebounced<T>(value: T, delay = 220): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}
