"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var PrismaService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
let PrismaService = PrismaService_1 = class PrismaService extends client_1.PrismaClient {
    logger = new common_1.Logger(PrismaService_1.name);
    constructor() {
        super({
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
        this.$on('query', (event) => {
            this.logger.debug(`Query: ${event.query}`);
            this.logger.debug(`Duration: ${event.duration}ms`);
        });
        this.$on('error', (event) => {
            this.logger.error(`Prisma Error: ${event.message}`);
        });
    }
    async onModuleInit() {
        try {
            await this.$connect();
            this.logger.log('✅ Prisma conectado a Supabase');
            const result = await this.$queryRaw `SELECT 1 as test`;
            this.logger.log(`✅ Test de conexión: ${JSON.stringify(result)}`);
        }
        catch (error) {
            this.logger.error('❌ Error conectando a Supabase:', error);
            throw error;
        }
    }
    async onModuleDestroy() {
        await this.$disconnect();
    }
    async withRetry(operation, retries = 3) {
        for (let i = 0; i < retries; i++) {
            try {
                return await operation();
            }
            catch (error) {
                if (i === retries - 1)
                    throw error;
                this.logger.warn(`Reintento ${i + 1}/${retries}...`);
                await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
            }
        }
        throw new Error('Máximo de reintentos alcanzado');
    }
};
exports.PrismaService = PrismaService;
exports.PrismaService = PrismaService = PrismaService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], PrismaService);
//# sourceMappingURL=prisma.service.js.map