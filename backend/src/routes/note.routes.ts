import { Router } from 'express';
import {
  getNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
  noteSchema
} from '../controllers/note.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

export const noteRouter = Router();

noteRouter.use(authenticate);

noteRouter.get('/', getNotes);
noteRouter.post('/', validate(noteSchema), createNote);
noteRouter.get('/:id', getNoteById);
noteRouter.put('/:id', updateNote);
noteRouter.delete('/:id', deleteNote);
