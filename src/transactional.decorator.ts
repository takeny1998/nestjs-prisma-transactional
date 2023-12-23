import { SetMetadata } from '@nestjs/common';

export const TRANSACTIONAL = Symbol('TRANSACTIONAL');
export const Transactional = (): MethodDecorator => SetMetadata(TRANSACTIONAL, true);
