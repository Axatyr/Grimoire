import { Router } from 'express';
import {
  getCharacters,
  getCharacterById,
  createCharacter,
  updateCharacter,
  deleteCharacter,
  characterSchema
} from '../controllers/character.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

export const characterRouter = Router();

characterRouter.use(authenticate);

characterRouter.get('/', getCharacters);
characterRouter.post('/', validate(characterSchema), createCharacter);
characterRouter.get('/:id', getCharacterById);
characterRouter.put('/:id', updateCharacter);
characterRouter.delete('/:id', deleteCharacter);
