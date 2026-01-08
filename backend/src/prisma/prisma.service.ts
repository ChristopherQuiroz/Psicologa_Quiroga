// backend/src/prisma/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      // Configuración específica para Supabase
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'info' },
        { emit: 'event', level: 'warn' },
        { emit: 'event', level: 'error' },
      ],
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });

    // Logs para debug
    this.$on('query' as never, (event: any) => {
      this.logger.debug(`Query: ${event.query}`);
      this.logger.debug(`Duration: ${event.duration}ms`);
    });

    this.$on('error' as never, (event: any) => {
      this.logger.error(`Prisma Error: ${event.message}`);
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('✅ Prisma conectado a Supabase');
      
      // Test de conexión
      const result = await this.$queryRaw`SELECT 1 as test`;
      this.logger.log(`✅ Test de conexión: ${JSON.stringify(result)}`);
    } catch (error) {
      this.logger.error('❌ Error conectando a Supabase:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  // Método para manejar conexiones largas
  async withRetry<T>(operation: () => Promise<T>, retries = 3): Promise<T> {
    for (let i = 0; i < retries; i++) {
      try {
        return await operation();
      } catch (error) {
        if (i === retries - 1) throw error;
        this.logger.warn(`Reintento ${i + 1}/${retries}...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
    throw new Error('Máximo de reintentos alcanzado');
  }
}