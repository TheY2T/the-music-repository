import { Injectable } from '@nestjs/common';
import type {
  InstrumentPreferences,
  StoredInstrumentPreferences,
} from '../../domain/instrument-preferences';
import { UserPreferences } from '../ports/user-preferences.port';

@Injectable()
export class UpdatePreferencesUseCase {
  constructor(private readonly preferences: UserPreferences) {}

  execute(userId: string, prefs: InstrumentPreferences): Promise<StoredInstrumentPreferences> {
    return this.preferences.put(userId, prefs);
  }
}
