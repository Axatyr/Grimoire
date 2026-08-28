import { Router } from 'express';
import {
  getNpcs,
  getNpcById,
  createNpc,
  updateNpc,
  deleteNpc,
  npcSchema
} from '../controllers/npc.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

export const npcRouter = Router();

npcRouter.use(authenticate);

npcRouter.get('/', getNpcs);
npcRouter.post('/', validate(npcSchema), createNpc);
npcRouter.get('/:id', getNpcById);
npcRouter.put('/:id', updateNpc);
npcRouter.delete('/:id', deleteNpc);
