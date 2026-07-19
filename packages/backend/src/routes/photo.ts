import { Router } from 'express';
import {
  uploadPhoto,
  getRoomPhotos,
  generateStrip,
  getResult,
  reorderPhotos,
} from '../controllers/photo.controller';
import { uploadPhoto as uploadMiddleware } from '../middleware/upload';

export const photoRouter: import('express').Router = Router();

/**
 * @openapi
 * /api/photos/upload:
 *   post:
 *     tags: [Photos]
 *     summary: Upload a photo
 *     description: Uploads a photo for a specific shot in a room
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file, roomCode, userId, shotIndex]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               roomCode:
 *                 type: string
 *               userId:
 *                 type: string
 *               shotIndex:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Photo uploaded successfully
 *       400:
 *         description: Invalid request
 *       404:
 *         description: Room not found
 */
photoRouter.post('/photos/upload', uploadMiddleware, uploadPhoto);

/**
 * @openapi
 * /api/photos/{roomCode}:
 *   get:
 *     tags: [Photos]
 *     summary: Get room photos
 *     description: Returns all photos for a room
 *     parameters:
 *       - in: path
 *         name: roomCode
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Photos retrieved successfully
 *       404:
 *         description: Room not found
 */
photoRouter.get('/photos/:roomCode', getRoomPhotos);

/**
 * @openapi
 * /api/photos/generate:
 *   post:
 *     tags: [Photos]
 *     summary: Generate photo strip
 *     description: Generates a photobooth strip from all room photos
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [roomCode]
 *             properties:
 *               roomCode:
 *                 type: string
 *     responses:
 *       200:
 *         description: Strip generated successfully
 *       400:
 *         description: Not all photos uploaded yet
 *       404:
 *         description: Room not found
 */
photoRouter.post('/photos/generate', generateStrip);

/**
 * @openapi
 * /api/photos/result/{roomCode}:
 *   get:
 *     tags: [Photos]
 *     summary: Get result
 *     description: Returns room details, photos, and strip URL
 *     parameters:
 *       - in: path
 *         name: roomCode
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Result retrieved successfully
 *       404:
 *         description: Room not found
 */
photoRouter.get('/photos/result/:roomCode', getResult);

photoRouter.put('/photos/reorder', reorderPhotos);
