import { IsString, IsNotEmpty } from 'class-validator';

export class CancelBookingDto {
  @IsString()
  @IsNotEmpty({ message: 'El token de cancelación es requerido' })
  cancelToken: string;
}