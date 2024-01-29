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
          const txClient = await startTransaction(prisma);
          // double-check to prevent overwrite transactionClient
          // when it runs in parallel. (ex. Promise.all())
          if (store.txClient === null) {
            store.txClient = txClient;
          } else {
            await txClient.$commit();
          }
        }

        if (model) {
          const result = await (store.txClient as any)[model][operation](args);
          return result;
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

        return (store.txClient as any)[operation](args);
      },
    },
  });
});

export type TxPrismaClient = ReturnType<typeof txExtension>;
