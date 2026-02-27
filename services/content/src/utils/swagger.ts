import swaggerJsdoc from 'swagger-jsdoc';
import { config } from '../config/index';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: { title: 'CineSync Content Service API', version: '1.0.0', description: 'Movies, search (Elasticsearch), watch history, ratings' },
    servers: [{ url: `http://localhost:${config.port}`, description: 'Local Dev' }],
    components: { securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } } },
    security: [{ bearerAuth: [] }],
    tags: [{ name: 'Movies', description: 'Movie CRUD, search, ratings' }],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
