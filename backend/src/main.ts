// backend/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ValidationPipe, BadRequestException } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.useGlobalFilters(new HttpExceptionFilter(), new AllExceptionsFilter());
  // 📌 CONFIGURACIÓN CRÍTICA: ValidationPipe con mensajes de error detallados
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Elimina propiedades no decoradas
      forbidNonWhitelisted: false, // NO lanza error por propiedades extra
      transform: true, // Transforma tipos
      disableErrorMessages: false, // Muestra mensajes de error
      validationError: {
        target: false, // No incluye el objeto target en los errores
        value: false, // No incluye el valor en los errores
      },
    }),
  );
  
  // Configurar CORS
  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });
  
  await app.listen(3001);
  console.log(`🚀 Backend corriendo en http://localhost:3001`);
  console.log(`📝 Health check: http://localhost:3001/health`);
}
bootstrap();