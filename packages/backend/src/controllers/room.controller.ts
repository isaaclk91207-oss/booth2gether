import { Request, Response, NextFunction } from 'express';
import { RoomService } from '../services/room.service';

const roomService = new RoomService();

export async function createRoom(req: Request, res: Response, next: NextFunction) {
  try {
    const { hostName } = req.body;

    if (!hostName || typeof hostName !== 'string' || hostName.trim().length === 0) {
      res.status(400).json({ error: 'Host name is required' });
      return;
    }

    const trimmed = hostName.trim();
    if (trimmed.length > 50) {
      res.status(400).json({ error: 'Host name must be 50 characters or less' });
      return;
    }

    const result = await roomService.createRoom(trimmed);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function getRoom(req: Request, res: Response, next: NextFunction) {
  try {
    const { code } = req.params;

    if (!code || code.length !== 6) {
      res.status(400).json({ error: 'Invalid room code' });
      return;
    }

    const result = await roomService.getRoom(code.toUpperCase());
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function joinRoom(req: Request, res: Response, next: NextFunction) {
  try {
    const { code } = req.params;
    const { guestName } = req.body;

    if (!code || code.length !== 6) {
      res.status(400).json({ error: 'Invalid room code' });
      return;
    }

    if (!guestName || typeof guestName !== 'string' || guestName.trim().length === 0) {
      res.status(400).json({ error: 'Guest name is required' });
      return;
    }

    const trimmed = guestName.trim();
    if (trimmed.length > 50) {
      res.status(400).json({ error: 'Guest name must be 50 characters or less' });
      return;
    }

    const result = await roomService.joinRoom(code.toUpperCase(), trimmed);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function closeRoom(req: Request, res: Response, next: NextFunction) {
  try {
    const { code } = req.params;

    if (!code || code.length !== 6) {
      res.status(400).json({ error: 'Invalid room code' });
      return;
    }

    await roomService.closeRoom(code.toUpperCase());
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}
