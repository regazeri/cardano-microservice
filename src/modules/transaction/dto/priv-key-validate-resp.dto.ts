import { IsBoolean } from 'class-validator';

export class PrivKeyvalidateResDto {
  @IsBoolean()
  isPrivKeyValid: boolean;
}
