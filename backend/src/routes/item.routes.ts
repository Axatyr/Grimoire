import { Router } from 'express';
import {
  getItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
  transferItem,
  batchRevealLoot,
  itemSchema,
  transferItemSchema,
  batchRevealSchema
} from '../controllers/item.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

export const itemRouter = Router();

itemRouter.use(authenticate);

itemRouter.get('/', getItems);
itemRouter.post('/', validate(itemSchema), createItem);
itemRouter.post('/batch-reveal', validate(batchRevealSchema), batchRevealLoot);
itemRouter.get('/:id', getItemById);
itemRouter.put('/:id', updateItem);
itemRouter.delete('/:id', deleteItem);
itemRouter.post('/:id/transfer', validate(transferItemSchema), transferItem);
