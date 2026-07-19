import { SubmitFeedbackBody, SubmitNpsBody, UpdateFeedbackBody } from '@TheY2T/tmr-contracts';
import { createZodDto } from 'nestjs-zod';

export class SubmitFeedbackDto extends createZodDto(SubmitFeedbackBody) {}
export class UpdateFeedbackDto extends createZodDto(UpdateFeedbackBody) {}
export class SubmitNpsDto extends createZodDto(SubmitNpsBody) {}
