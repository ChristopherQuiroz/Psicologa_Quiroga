// backend/src/common/filters/http-exception.filter.ts
import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    
    // Obtener la respuesta de la excepción
    const exceptionResponse = exception.getResponse();
    
    // Formato CONSISTENTE para TODAS las respuestas de error
    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: typeof exceptionResponse === 'object' 
        ? (exceptionResponse as any).message || exception.message
        : exceptionResponse,
      error: exception.name
    };
    
    console.error('🔥 Excepción HTTP Capturada:', errorResponse);
    
    // Asegurar que siempre devolvemos JSON
    response
      .status(status)
      .header('Content-Type', 'application/json')
      .json(errorResponse);
  }
}