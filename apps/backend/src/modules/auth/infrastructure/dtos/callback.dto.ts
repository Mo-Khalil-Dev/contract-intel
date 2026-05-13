import { IsNotEmpty, IsString } from 'class-validator';

export class CallbackRequestDto {
  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsString()
  @IsNotEmpty()
  state!: string;
}

export interface CallbackResponse {
  returnUrl: string;
}
