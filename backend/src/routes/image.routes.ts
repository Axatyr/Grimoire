import { Router } from 'express';
import {
  getImages,
  uploadImageFile,
  addExternalImage,
  deleteImage,
  upload,
  externalImageSchema
} from '../controllers/image.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

export const imageRouter = Router();

imageRouter.use(authenticate);

imageRouter.get('/', getImages);
imageRouter.post('/upload', upload.single('image'), uploadImageFile);
imageRouter.post('/external', validate(externalImageSchema), addExternalImage);
imageRouter.delete('/:id', deleteImage);
