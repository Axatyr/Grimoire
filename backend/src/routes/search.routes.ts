import { Router } from 'express';
import { globalSearch } from '../controllers/search.controller.js';
import { authenticate } from '../middleware/auth.js';

export const searchRouter = Router();

searchRouter.use(authenticate);

searchRouter.get('/', globalSearch);
