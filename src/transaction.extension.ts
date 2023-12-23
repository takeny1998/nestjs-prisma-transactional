import { Prisma } from '@prisma/client';
import { transactionStorage } from './utils/transaction.storage';
import { startTransaction } from './utils/flat-transaction';

export const txExtension = Prisma.defineExtension((prisma) => {
  return prisma.$extends({
    query: {
      $allOperations: async ({ args, model, operation, query }) => {
        const store = transactionStorage.getStore();

        // if out of transactional scope, just process it
        if (store === undefined) {
          return query(args);
        }

        if (store.txClient === null) {
          store.txClient = await startTransaction(prisma);
        }

        if (model) {
          return store.txClient[model][operation](args);
        }

        if (operation === '$queryRaw') {
          const result = await store.txClient[operation](args);

          (result as any).forEach((row: Record<string, unknown>) => {
            Object.keys(row).map((key) => {
              row[key] = {
                prisma__type: undefined,
                prisma__value: row[key],
              };
            });
          });

          return result;
        }

        return store.txClient[operation](args);
      },
    },
  });
});

export type TxPrismaClient = ReturnType<typeof txExtension>;
