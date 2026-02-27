import swaggerJsdoc from 'swagger-jsdoc';
import { config } from '../config/index';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: { title: 'CineSync Battle Service API', version: '1.0.0', description: 'Battle create/invite/accept, leaderboard, score' },
    servers: [{ url: `http://localhost:${config.port}`, description: 'Local Dev' }],
    components: { securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } } },
    security: [{ bearerAuth: [] }],
    tags: [{ name: 'Battles', description: 'Battle gamification endpoints' }],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
