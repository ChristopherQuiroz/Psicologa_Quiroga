import { IsInt, IsDateString, IsOptional, IsString } from 'class-validator';

export class UpdateBookingDto {
  @IsInt()
  @IsOptional()
  id_psicologa?: number;

  @IsInt()
  @IsOptional()
  id_consulta?: number;

  @IsDateString()
  @IsOptional()
  fecha?: string; // Formato: YYYY-MM-DD

  @IsString()
  @IsOptional()
  hora?: string; // Formato: HH:MM

  @IsString()
  @IsOptional()
  estado?: string;

  @IsString()
  @IsOptional()
  motivo?: string;

  @IsString()
  @IsOptional()
  notas?: string;
}