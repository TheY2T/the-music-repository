import { Inject, Injectable } from '@nestjs/common';
import { asc, eq } from 'drizzle-orm';
import { DATABASE, type Database } from '../../infrastructure/database/database.module';
import { locales } from '../../infrastructure/database/schema';
import { LocaleRegistry } from '../application/ports/locale-registry.port';
import type { LocaleInfo } from '../domain/locale';

@Injectable()
export class DrizzleLocaleRegistry extends LocaleRegistry {
  constructor(@Inject(DATABASE) private readonly db: Database) {
    super();
  }

  async list(): Promise<LocaleInfo[]> {
    const rows = await this.db
      .select({ code: locales.code, label: locales.label })
      .from(locales)
      .orderBy(asc(locales.code));
    return rows;
  }

  async exists(code: string): Promise<boolean> {
    const [row] = await this.db
      .select({ code: locales.code })
      .from(locales)
      .where(eq(locales.code, code))
      .limit(1);
    return Boolean(row);
  }

  async create(code: string, label: string): Promise<LocaleInfo> {
    const [row] = await this.db.insert(locales).values({ code, label }).returning();
    return { code: row?.code ?? code, label: row?.label ?? label };
  }

  async ensure(code: string, label?: string): Promise<void> {
    await this.db
      .insert(locales)
      .values({ code, label: label ?? code })
      .onConflictDoNothing({ target: locales.code });
  }
}
