import { transactionStorage } from "./transaction.storage";

/**
 * Wraps a method with transactional logic.
 * @param method The original method to wrap.
 * @param instance The instance of the class containing the method.
 * @returns The wrapped method.
 */
export const wrapTransaction = (method: any, instance: any) => {
  // Wrapping the original method with transaction logic.
  return async function (...args: any[]) {
    return transactionStorage.run({ txClient: null }, async () => {
      try {
        const result = await method.apply(instance, args);

        const store = transactionStorage.getStore();

        if (store?.txClient) {
          await store.txClient.$commit();
        }

        return result;
      } catch (error) {
        const store = transactionStorage.getStore();

        if (store?.txClient) {
          await store.txClient.$rollback();
        }
        throw error;
      }
    });
  };
};
