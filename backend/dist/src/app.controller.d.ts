import { AppService } from './app.service';
export declare class AppController {
    private readonly appService;
    prisma: any;
    constructor(appService: AppService);
    getHello(): {
        message: string;
        timestamp: string;
        endpoints: {
            auth: string;
            health: string;
        };
    };
    healthCheck(): {
        status: string;
        timestamp: string;
        service: string;
    };
    protectedRoute(): {
        message: string;
        timestamp: string;
    };
}
