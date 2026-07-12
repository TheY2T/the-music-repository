import { Injectable } from '@nestjs/common';
import type { ProgressionChord } from '../../domain/saved-progression';
import { ProgressionLibrary } from '../ports/progression-library.port';

@Injectable()
export class SaveProgressionUseCase {
  constructor(private readonly library: ProgressionLibrary) {}

  execute(
    userId: string,
    name: string,
    keyRoot: number,
    chords: ProgressionChord[],
  ): Promise<void> {
    return this.library.save(userId, name, keyRoot, chords);
  }
}
