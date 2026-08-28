import { Router } from 'express';
import {
  getStoryGraph,
  createStoryNode,
  updateStoryNode,
  deleteStoryNode,
  createStoryEdge,
  deleteStoryEdge,
  generateSessionRecap,
  storyNodeSchema,
  storyEdgeSchema
} from '../controllers/story.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

export const storyRouter = Router();

storyRouter.use(authenticate);

storyRouter.get('/campaign/:campaignId', getStoryGraph);
storyRouter.post('/nodes', validate(storyNodeSchema), createStoryNode);
storyRouter.put('/nodes/:id', updateStoryNode);
storyRouter.delete('/nodes/:id', deleteStoryNode);
storyRouter.post('/edges', validate(storyEdgeSchema), createStoryEdge);
storyRouter.delete('/edges/:id', deleteStoryEdge);
storyRouter.get('/campaign/:campaignId/recap', generateSessionRecap);
