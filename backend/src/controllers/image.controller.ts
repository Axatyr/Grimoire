import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { z } from 'zod';
import { prisma } from '../db/prisma.js';
import { config } from '../config/index.js';
import { AuthRequest } from '../types/index.js';
import { ImageSourceType } from '@prisma/client';
import { getParam, getQueryParam } from '../utils/params.js';

if (!fs.existsSync(config.uploadDir)) {
  fs.mkdirSync(config.uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  }
});

export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

export const externalImageSchema = z.object({
  campaignId: z.string().uuid(),
  url: z.string().url(),
  filename: z.string().default('External Image'),
  altText: z.string().optional(),
});

export const getImages = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const campaignId = getQueryParam(req, 'campaignId');

    const images = await prisma.image.findMany({
      where: {
        deletedAt: null,
        ...(campaignId ? { campaignId } : {}),
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ images });
  } catch (error) {
    next(error);
  }
};

export const uploadImageFile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const file = req.file;
    const { campaignId, altText } = req.body;

    if (!file) {
      res.status(400).json({ error: 'No image file uploaded' });
      return;
    }

    if (!campaignId) {
      res.status(400).json({ error: 'campaignId is required' });
      return;
    }

    const fileUrl = `/uploads/${file.filename}`;

    const image = await prisma.image.create({
      data: {
        campaignId,
        filename: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        sourceType: ImageSourceType.UPLOADED,
        url: fileUrl,
        altText: altText || file.originalname,
      }
    });

    res.status(201).json({ image });
  } catch (error) {
    next(error);
  }
};

export const addExternalImage = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { campaignId, url, filename, altText } = req.body;

    const image = await prisma.image.create({
      data: {
        campaignId,
        filename: filename || 'External Link',
        sourceType: ImageSourceType.EXTERNAL_URL,
        url,
        altText,
      }
    });

    res.status(201).json({ image });
  } catch (error) {
    next(error);
  }
};

export const deleteImage = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = getParam(req, 'id');

    const image = await prisma.image.findFirst({
      where: { id, deletedAt: null }
    });

    if (!image) {
      res.status(404).json({ error: 'Image not found' });
      return;
    }

    await prisma.image.update({
      where: { id },
      data: { deletedAt: new Date() }
    });

    res.json({ message: 'Image deleted successfully' });
  } catch (error) {
    next(error);
  }
};
