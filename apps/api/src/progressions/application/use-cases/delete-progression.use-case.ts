import { Injectable } from '@nestjs/common';
import { ProgressionLibrary } from '../ports/progression-library.port';

@Injectable()
export class DeleteProgressionUseCase {
  constructor(private readonly library: ProgressionLibrary) {}

  execute(userId: string, name: string): Promise<void> {
    return this.library.remove(userId, name);
  }
}
