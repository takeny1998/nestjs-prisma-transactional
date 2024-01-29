import { wrapTransaction } from "../src/utils/wrap-transaction";
import { txExtension } from "../src/transaction.extension";
import { PrismaClient } from "@prisma/client";

describe("single transaction", () => {
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

  it("should commit transaction if no exceptions are thrown", async () => {
    const createUserMethod = wrapTransaction(async () => {
      return createTestUser();
    }, null);

    const createdUser = await createUserMethod();
    const users = await findAllUsers();

    expect(users).toEqual([createdUser]);
  });

  it("should rollback transaction in case of an exception", async () => {
    const createUserMethod = wrapTransaction(async () => {
      await createTestUser();
      throw new Error("Test Error");
    }, null);

    await expect(createUserMethod()).rejects.toBeDefined();
    const users = await findAllUsers();

    expect(users).toEqual([]);
  });
});
