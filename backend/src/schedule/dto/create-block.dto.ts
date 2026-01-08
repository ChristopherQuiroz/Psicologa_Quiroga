import { IsString, IsDateString, IsInt, IsOptional, IsBoolean } from 'class-validator';

export class CreateBlockDto {
  @IsString()
  titulo: string;

  @IsDateString()
  inicio: string;

  @IsDateString()
  fin: string;

  @IsOptional()
  @IsBoolean()
  recurrente?: boolean;

  @IsInt()
  id_psicologa: number;
}