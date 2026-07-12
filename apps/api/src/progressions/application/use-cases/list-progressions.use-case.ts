import { Injectable } from '@nestjs/common';
import type { SavedProgression } from '../../domain/saved-progression';
import { ProgressionLibrary } from '../ports/progression-library.port';

@Injectable()
export class ListProgressionsUseCase {
  constructor(private readonly library: ProgressionLibrary) {}

  execute(userId: string): Promise<SavedProgression[]> {
    return this.library.list(userId);
  }
}
