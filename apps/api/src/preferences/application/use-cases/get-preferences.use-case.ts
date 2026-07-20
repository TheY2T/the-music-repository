import { Injectable } from '@nestjs/common';
import {
  DEFAULT_INSTRUMENT_PREFERENCES,
  type StoredInstrumentPreferences,
} from '../../domain/instrument-preferences';
import { UserPreferences } from '../ports/user-preferences.port';

@Injectable()
export class GetPreferencesUseCase {
  constructor(private readonly preferences: UserPreferences) {}

  /** The user's saved preferences, falling back to the defaults when none exist. */
  async execute(userId: string): Promise<StoredInstrumentPreferences> {
    const stored = await this.preferences.get(userId);
    return stored ?? { ...DEFAULT_INSTRUMENT_PREFERENCES, updatedAt: new Date(0) };
  }
}
