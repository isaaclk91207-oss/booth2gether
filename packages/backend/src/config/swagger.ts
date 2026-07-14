import swaggerJsdoc from 'swagger-jsdoc';
import type { Options } from 'swagger-jsdoc';

const options: Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'BoothTogether API',
      version: '0.1.0',
      description: 'Real-time online photobooth API — room management, user sessions, photo capture & processing.',
    },
    servers: [
      {
        url: 'http://localhost:4000',
        description: 'Local development',
      },
    ],
    components: {
      schemas: {
        Room: {
          type: 'object',
          properties: {
            id:        { type: 'string', format: 'uuid' },
            code:      { type: 'string', example: 'RBEQ6Y' },
            hostId:    { type: 'string', format: 'uuid', nullable: true },
            state:     { type: 'string', enum: ['WAITING','JOINED','READY','SHOOTING','PROCESSING','COMPLETED','CLOSED'] },
            stripUrl:  { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        User: {
          type: 'object',
          properties: {
            id:          { type: 'string', format: 'uuid' },
            name:        { type: 'string', example: 'Alice' },
            roomId:      { type: 'string', format: 'uuid' },
            role:        { type: 'string', enum: ['HOST', 'GUEST'] },
            isReady:     { type: 'boolean' },
            isConnected: { type: 'boolean' },
            createdAt:   { type: 'string', format: 'date-time' },
          },
        },
        CreateRoomRequest: {
          type: 'object',
          required: ['hostName'],
          properties: {
            hostName: { type: 'string', example: 'Alice', maxLength: 50 },
          },
        },
        JoinRoomRequest: {
          type: 'object',
          required: ['guestName'],
          properties: {
            guestName: { type: 'string', example: 'Bob', maxLength: 50 },
          },
        },
        CreateRoomResponse: {
          type: 'object',
          properties: {
            room: { $ref: '#/components/schemas/Room' },
            user: { $ref: '#/components/schemas/User' },
          },
        },
        RoomDetailResponse: {
          type: 'object',
          properties: {
            room:      { $ref: '#/components/schemas/Room' },
            userCount: { type: 'integer', example: 1 },
          },
        },
        JoinRoomResponse: {
          type: 'object',
          properties: {
            room:  { $ref: '#/components/schemas/Room' },
            user:  { $ref: '#/components/schemas/User' },
            users: { type: 'array', items: { $ref: '#/components/schemas/User' } },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
        HealthResponse: {
          type: 'object',
          properties: {
            status:    { type: 'string', example: 'ok' },
            timestamp: { type: 'string', format: 'date-time' },
            uptime:    { type: 'number' },
            database:  { type: 'string', example: 'connected' },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.ts', './src/server.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
