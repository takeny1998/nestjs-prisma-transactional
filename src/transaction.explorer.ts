import { Injectable, OnModuleInit } from "@nestjs/common";
import { DiscoveryService, MetadataScanner, Reflector } from "@nestjs/core";
import { TRANSACTIONAL } from "./transactional.decorator";
import { wrapTransaction } from "./utils/wrap-transaction";

@Injectable()
export class TransactionExplorer implements OnModuleInit {
  constructor(
    private readonly discoverService: DiscoveryService,
    private readonly metadataScanner: MetadataScanner,
    private readonly reflector: Reflector
  ) {}

  /**
   * Initializes the transaction manager, wrapping methods and repositories with transactional logic.
   */
  onModuleInit() {
    this.wrapDecorators();
  }

  /**
   * Retrieves static instances from the discovery service.
   * @returns Array of static instances.
   */
  private getStaticInstances(): any[] {
    return this.discoverService
      .getProviders()
      .filter((wrapper) => wrapper.isDependencyTreeStatic())
      .filter(({ instance }) => instance && Object.getPrototypeOf(instance))
      .map(({ instance }) => instance);
  }

  /**
   * Wraps methods annotated with @Transactional.
   */
  wrapDecorators() {
    const instances = this.getStaticInstances();

    instances.forEach((instance) => {
      const prototype = Object.getPrototypeOf(instance);
      const methodNames = this.metadataScanner.getAllMethodNames(prototype);

      methodNames.forEach((name) => {
        const method = instance[name];

        if (!method) {
          return undefined;
        }

        // Wrap only if the method is annotated with @Transactional.
        if (this.reflector.get(TRANSACTIONAL, method)) {
          instance[name] = wrapTransaction(method, instance);
        }
      });
    });
  }
}
