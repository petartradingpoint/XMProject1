import { IsOptional, IsString } from 'class-validator';

export class BookQueryDto {
  @IsOptional()
  @IsString()
  readonly genre?: string;

  @IsOptional()
  @IsString()
  readonly author?: string;
}
