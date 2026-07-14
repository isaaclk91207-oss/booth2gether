import type { Request, Response } from 'express';
import { PhotoService, PhotoUploadError } from '../services/photo.service';

const photoService = new PhotoService();

export async function uploadPhoto(req: Request, res: Response) {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const { roomCode, userId, shotIndex } = req.body;
    if (!roomCode || !userId || shotIndex === undefined) {
      res.status(400).json({ error: 'Missing required fields: roomCode, userId, shotIndex' });
      return;
    }

    const photo = await photoService.uploadPhoto(
      file,
      roomCode,
      userId,
      parseInt(shotIndex, 10),
    );

    res.status(201).json({ photo });
  } catch (error) {
    if (error instanceof PhotoUploadError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    console.error('upload photo error:', error);
    res.status(500).json({ error: 'Failed to upload photo' });
  }
}

export async function getRoomPhotos(req: Request, res: Response) {
  try {
    const { roomCode } = req.params;
    const photos = await photoService.getRoomPhotos(roomCode);
    res.json({ photos });
  } catch (error) {
    if (error instanceof PhotoUploadError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    console.error('get photos error:', error);
    res.status(500).json({ error: 'Failed to get photos' });
  }
}

export async function generateStrip(req: Request, res: Response) {
  try {
    const { roomCode } = req.body;
    if (!roomCode) {
      res.status(400).json({ error: 'Missing roomCode' });
      return;
    }

    const stripUrl = await photoService.generateStrip(roomCode);
    res.json({ stripUrl });
  } catch (error) {
    if (error instanceof PhotoUploadError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    console.error('generate strip error:', error);
    res.status(500).json({ error: 'Failed to generate strip' });
  }
}

export async function getResult(req: Request, res: Response) {
  try {
    const { roomCode } = req.params;
    const result = await photoService.getResult(roomCode);
    res.json(result);
  } catch (error) {
    if (error instanceof PhotoUploadError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    console.error('get result error:', error);
    res.status(500).json({ error: 'Failed to get result' });
  }
}
