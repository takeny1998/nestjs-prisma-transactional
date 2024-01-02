
# nestjs-prisma-transactional

Manage **PrismaORM transactions** easily by **adding decorator** to your nest.js services.

![npm](https://img.shields.io/npm/v/%40takeny1998%2Fnestjs-prisma-transactional?link=https%3A%2F%2Fwww.npmjs.com%2Fpackage%2F%40takeny1998%2Fnestjs-prisma-transactional)  ![npm](https://img.shields.io/npm/dt/%40takeny1998%2Fnestjs-prisma-transactional?link=https%3A%2F%2Fwww.npmjs.com%2Fpackage%2F%40takeny1998%2Fnestjs-prisma-transactional%2F)  [![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)



## Installation

Install with **npm**

```bash
  npm install @takeny1998/nestjs-prisma-transactional
```

Or install via **yarn**

```bash
  yarn add @takeny1998/nestjs-prisma-transactional
```


## Usage

### Step 1: Import Transaction Module

Import the `TransactionMoudle` to `AppModule` of your nest.js project. Or just add it to the module you want to use.

```typescript
import { TransactionModule } from '@takeny1998/nestjs-prisma-transactional';

@Module({
  imports: [
    ...
    TransactionModule, // just import it
  ],
  controllers: [...],
  providers: [...],
})
export class AppModule {}

```



### Step 2: Extend PrismaClient

I provide the extension so that you can freely extend `PrismaClient`. My extension does not modify the type of the existing `PrismaClient`, so you can simply extend and inject your own Client.
```typescript
import { TransactionModule } from '@takeny1998/nestjs-prisma-transactional';

@Module({
  imports: [
    ...
    TransactionModule,
  ],
  controllers: [...],
  providers: [
    {
      provide: 'PrismaService',
      useValue: new PrismaService().$extends(txExtension),
    },
  ],
  exports: ['PrismaService'],
})
export class AppModule {}

```

Otherwise, a good alternative is to [use the `CustomPrismaModule`](https://nestjs-prisma.dev/docs/prisma-client-extensions/) from the [nestjs-prisma](https://github.com/notiz-dev/nestjs-prisma) package.
(If you have a great way to extend PrismaClient, please let me know it by opening an issue)



### Step 3: Add `@Transactional` Decorator whereever you want

Add the `@Transactional()` decorator **to any method you want to make transactional scope,** and all repositories using the method's child `PrismaClien`t will automatically be merged as one transaction.

```typescript

@Transactional()
async writePost(dto: WritePostDto) {
  const createdPost = await this.postService.createPost(userUuid, { ...post, summary });

  const user = await this.userService.findUserByUniqueInput({ uuid: userUuid });

  if (!user) {
    throw new NotFoundException(`Cloud not found User with UUID: ${userUuid}`);
  }

  ...
}
```

Even if there are decorators from repositories or domain services under the method, they will be merged into the top-level transaction scope.



## Contributing

Contributions are always welcome!

If you have any suggestions for improvements or encounter a bug while using this package, please feel free to open an issue.

