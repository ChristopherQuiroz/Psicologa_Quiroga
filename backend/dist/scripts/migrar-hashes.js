"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("../src/app.module");
const auth_service_1 = require("../src/auth/auth.service");
async function migrateAllPasswords() {
    console.log('🚀 INICIANDO MIGRACIÓN DE CONTRASEÑAS');
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const authService = app.get(auth_service_1.AuthService);
    try {
        const result = await authService.migrateAllUsersToBcrypt();
        console.log('🎉 Resultado:', result);
    }
    catch (error) {
        console.error('❌ Error durante la migración:', error);
    }
    finally {
        await app.close();
        process.exit(0);
    }
}
migrateAllPasswords();
//# sourceMappingURL=migrar-hashes.js.map