import swaggerJsdoc from 'swagger-jsdoc';
import { config } from '../config/index';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: { title: 'CineSync User Service API', version: '1.0.0', description: 'User profiles, friends, heartbeat, achievements' },
    servers: [{ url: `http://localhost:${config.port}`, description: 'Local Dev' }],
    components: { securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } } },
    security: [{ bearerAuth: [] }],
    tags: [{ name: 'Users', description: 'User profile endpoints' }, { name: 'Friends', description: 'Friendship endpoints' }, { name: 'Achievements', description: 'Achievement endpoints' }],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
