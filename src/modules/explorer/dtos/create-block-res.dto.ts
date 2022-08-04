import { IsBoolean } from 'class-validator';

export class CreateBlockStatusDto {
  @IsBoolean()
  isNowCreated: boolean;
}
