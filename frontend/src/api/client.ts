import type { TransactionScore, PaginatedTransactions, GlobalGraph, Metrics } from "../types";

const BASE = (import.meta.env.VITE_API_BASE as string) || "http://localhost:8000";

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`API ${path} -> ${res.status}`);
  return res.json() as Promise<T>;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API POST ${path} -> ${res.status}`);
  return res.json() as Promise<T>;
}

export const api = {
  getFlaggedTransactions: (page = 1, perPage = 100) =>
    get<PaginatedTransactions>(`/transactions/flagged?page=${page}&per_page=${perPage}`),

  getGlobalGraph: () =>
    get<GlobalGraph>("/graph/global"),

  getMetrics: () =>
    get<Metrics>("/metrics"),

  scoreTransaction: (transactionId: string) =>
    post<TransactionScore>("/score", { transaction_id: transactionId }),

  scoreCustom: (payload: any) =>
    post<TransactionScore>("/score", payload),
};
