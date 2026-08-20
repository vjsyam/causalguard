import { useState, useEffect } from 'react';
import { api } from '../api/client';
import type { GlobalGraph } from '../types';

export function useGraph() {
  const [graph, setGraph] = useState<GlobalGraph | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getGlobalGraph()
      .then(setGraph)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return { graph, loading, error };
}
