import { Module } from '@nestjs/common';
import { TransactionExplorer } from './transaction.explorer';
import { DiscoveryModule } from '@nestjs/core';

@Module({
  imports: [DiscoveryModule],
  providers: [TransactionExplorer],
})
export class TransactionModule {}
