import { PrismaClient, User } from "@prisma/client";
import { txExtension } from "../src/transaction.extension";
import { wrapTransaction } from "../src/utils/wrap-transaction";

describe("parallel transaction", () => {
  const prisma = new PrismaClient().$extends(txExtension);

  const createTestUser = async (username: string = "test-user") =>
    prisma.user.create({
      data: { username },
    });

  const cleanUpUsers = async () => {
    await prisma.user.deleteMany();
  };

  const findAllUsers = async () => {
    return await prisma.user.findMany();
  };

  beforeEach(async () => {
    await cleanUpUsers();
  });

  it("should commit successfully with parallel operations in a single transaction", async () => {
    const method = wrapTransaction(async () => {
      return Promise.all([
        createTestUser("test-user-1"),
        createTestUser("test-user-2"),
        createTestUser("test-user-3"),
      ]);
    }, null);

    const createdUsers = await method();
    const users = await findAllUsers();

    expect(users).toHaveLength(createdUsers.length);
    createdUsers.forEach((createdUser: User) => {
      expect(users).toContainEqual(
        expect.objectContaining({
          username: createdUser.username,
        })
      );
    });
  });

  it("should rollback transaction in case of an exception", async () => {
    const method = wrapTransaction(async () => {
      await Promise.all([
        createTestUser("test-user-1"),
        createTestUser("test-user-2"),
        createTestUser("test-user-3"),
      ]);

      throw new Error("Test Error");
    }, null);

    await expect(method()).rejects.toBeDefined();
    const users = await findAllUsers();

    expect(users).toEqual([]);
  });
});
