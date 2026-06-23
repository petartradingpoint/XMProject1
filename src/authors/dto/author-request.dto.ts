import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class AuthorRequestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  readonly name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  readonly nationality?: string;

  @IsOptional()
  @IsInt()
  readonly birthYear?: number;
}
