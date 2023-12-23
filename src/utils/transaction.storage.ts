import { AsyncLocalStorage } from 'async_hooks';
import { TransactionalClient } from './flat-transaction';

export type TransactionStorage = AsyncLocalStorage<{
  txClient: TransactionalClient | null;
}>;
export const transactionStorage: TransactionStorage = new AsyncLocalStorage();
