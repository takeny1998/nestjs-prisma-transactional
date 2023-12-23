import { Prisma, PrismaClient } from '@prisma/client';

export type TransactionalClient = Prisma.TransactionClient & {
  $commit: () => Promise<void>;
  $rollback: () => Promise<void>;
};

const ROLLBACK_SYMBOL = { [Symbol.for('prisma.client.extension.rollback')]: true };

/**
 * Starts a transaction with the provided Prisma client.
 *
 * @param {PrismaClient} prisma - The Prisma client instance.
 * @returns {Promise<TransactionalClient>} - A promise that resolves to a transactional client.
 * @throws {Error} - Throws an error if transactions are not supported.
 */
export const startTransaction = async (prisma: PrismaClient): Promise<TransactionalClient> => {
  if (!isTransactionSupported(prisma)) {
    throw new Error('Transactions are not supported by this client');
  }

  let resolveTransaction: (tx: Prisma.TransactionClient) => void;
  let commitTransaction: () => void;
  let rollbackTransaction: () => void;

  // transactionEndPromise controls the resolution or rejection of the transaction.
  // It gets resolved on commit and rejected on rollback.
  const transactionEndPromise = new Promise<void>((resolve, reject) => {
    commitTransaction = () => resolve();
    rollbackTransaction = () => reject(ROLLBACK_SYMBOL);
  });

  // transactionClientPromise resolves with the Prisma.TransactionClient
  // provided by Prisma's $transaction method.
  const transactionClientPromise = new Promise<Prisma.TransactionClient>((resolve) => {
    resolveTransaction = (txClient) => resolve(txClient);
  });

  // transaction represents the actual transaction.
  // The transaction is committed or rolled back based on the transactionEndPromise.
  const transaction = prisma.$transaction((transactionClient: Prisma.TransactionClient) => {
    resolveTransaction(transactionClient);

    return transactionEndPromise;
  });

  return new Proxy(await transactionClientPromise, {
    get(target, prop) {
      if (prop === '$commit') {
        return () => {
          commitTransaction();
          return transaction;
        };
      }
      if (prop === '$rollback') {
        return () => {
          rollbackTransaction();
          return transaction;
        };
      }
      return target[prop as keyof typeof target];
    },
  }) as TransactionalClient;
};

/**
 * Checks if the given Prisma client supports transactions.
 *
 * @param {PrismaClient} prisma - The Prisma client instance.
 * @returns {boolean} - Returns true if transactions are supported, false otherwise.
 */
const isTransactionSupported = (prisma: PrismaClient): boolean => {
  return '$transaction' in prisma && typeof prisma['$transaction'] === 'function';
};
