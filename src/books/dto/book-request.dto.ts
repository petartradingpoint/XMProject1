import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  Max,
  Min,
  IsString,
  MaxLength,
} from 'class-validator';

export class BookRequestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  readonly title!: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @MaxLength(255, { each: true })
  readonly authors!: string[];

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  readonly isbn!: string;

  @IsInt()
  readonly publishedYear!: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  readonly genre?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  readonly rating?: number | null;
}
