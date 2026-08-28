import { Router } from 'express';
import {
  getQuests,
  getQuestById,
  createQuest,
  updateQuest,
  deleteQuest,
  questSchema
} from '../controllers/quest.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

export const questRouter = Router();

questRouter.use(authenticate);

questRouter.get('/', getQuests);
questRouter.post('/', validate(questSchema), createQuest);
questRouter.get('/:id', getQuestById);
questRouter.put('/:id', updateQuest);
questRouter.delete('/:id', deleteQuest);
