import { Injectable } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import type { RequestContextPort } from '../ports/request-context.port';

/** RequestContextPort over nestjs-cls (AsyncLocalStorage — not REQUEST-scoped DI). */
@Injectable()
export class ClsContextAdapter implements RequestContextPort {
  constructor(private readonly cls: ClsService) {}

  get<T = unknown>(key: string): T | undefined {
    return this.cls.get(key) as T | undefined;
  }

  set(key: string, value: unknown): void {
    this.cls.set(key, value);
  }

  requestId(): string | undefined {
    return this.cls.getId() ?? this.cls.get<string>('requestId');
  }
}
