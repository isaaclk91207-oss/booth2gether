import { Router } from 'express';
import { createRoom, getRoom, joinRoom, closeRoom } from '../controllers/room.controller';

export const roomRouter: import('express').Router = Router();

/**
 * @openapi
 * /api/rooms:
 *   post:
 *     tags: [Rooms]
 *     summary: Create a new room
 *     description: Creates a new photobooth room and returns the room code and host user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateRoomRequest'
 *     responses:
 *       201:
 *         description: Room created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CreateRoomResponse'
 *       400:
 *         description: Invalid request (missing or invalid hostName)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
roomRouter.post('/rooms', createRoom);

/**
 * @openapi
 * /api/rooms/{code}:
 *   get:
 *     tags: [Rooms]
 *     summary: Get room details
 *     description: Returns room information and current user count
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 6
 *           maxLength: 6
 *         description: 6-character room code
 *         example: RBEQ6Y
 *     responses:
 *       200:
 *         description: Room found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RoomDetailResponse'
 *       400:
 *         description: Invalid room code format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Room not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       410:
 *         description: Room has been closed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
roomRouter.get('/rooms/:code', getRoom);

/**
 * @openapi
 * /api/rooms/{code}/join:
 *   post:
 *     tags: [Rooms]
 *     summary: Join an existing room
 *     description: Adds a guest to the room. Room state changes to JOINED.
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 6
 *           maxLength: 6
 *         description: 6-character room code
 *         example: RBEQ6Y
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/JoinRoomRequest'
 *     responses:
 *       200:
 *         description: Joined room successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/JoinRoomResponse'
 *       400:
 *         description: Invalid request (missing guestName or invalid code)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Room not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Room is full or guest name already taken
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       410:
 *         description: Room has been closed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
roomRouter.post('/rooms/:code/join', joinRoom);

/**
 * @openapi
 * /api/rooms/{code}:
 *   delete:
 *     tags: [Rooms]
 *     summary: Close a room
 *     description: Closes the room and marks it as ended
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 6
 *           maxLength: 6
 *         description: 6-character room code
 *         example: RBEQ6Y
 *     responses:
 *       200:
 *         description: Room closed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Invalid room code format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Room not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
roomRouter.delete('/rooms/:code', closeRoom);
