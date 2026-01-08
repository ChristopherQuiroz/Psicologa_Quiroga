// backend/scripts/migrate-all-passwords.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { AuthService } from '../src/auth/auth.service';

async function migrateAllPasswords() {
  console.log('🚀 INICIANDO MIGRACIÓN DE CONTRASEÑAS');
  
  const app = await NestFactory.createApplicationContext(AppModule);
  const authService = app.get(AuthService);
  
  try {
    const result = await authService.migrateAllUsersToBcrypt();
    console.log('🎉 Resultado:', result);
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
  } finally {
    await app.close();
    process.exit(0);
  }
}

migrateAllPasswords();