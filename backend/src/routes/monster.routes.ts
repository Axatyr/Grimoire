import { Router } from 'express';
import {
  getMonsters,
  getMonsterById,
  createMonster,
  updateMonster,
  deleteMonster,
  monsterSchema
} from '../controllers/monster.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

export const monsterRouter = Router();

monsterRouter.use(authenticate);

monsterRouter.get('/', getMonsters);
monsterRouter.post('/', validate(monsterSchema), createMonster);
monsterRouter.get('/:id', getMonsterById);
monsterRouter.put('/:id', updateMonster);
monsterRouter.delete('/:id', deleteMonster);
