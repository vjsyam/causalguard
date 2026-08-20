import { useState, useEffect } from 'react';
import { api } from '../api/client';
import type { TransactionSummary } from '../types';

export function useTransactions() {
  const [transactions, setTransactions] = useState<TransactionSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getFlaggedTransactions(1, 200)
      .then(data => {
        setTransactions(data.transactions);
        setTotal(data.total);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return { transactions, total, loading, error };
}
