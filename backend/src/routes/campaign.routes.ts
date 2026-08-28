import { Router } from 'express';
import {
  getCampaigns,
  getCampaignById,
  getAvailableCampaigns,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  joinCampaign,
  addMember,
  campaignSchema
} from '../controllers/campaign.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

export const campaignRouter = Router();

campaignRouter.use(authenticate);

campaignRouter.get('/', getCampaigns);
campaignRouter.get('/available', getAvailableCampaigns);
campaignRouter.post('/', requireRole(['MASTER', 'ADMIN']), validate(campaignSchema), createCampaign);
campaignRouter.post('/join', joinCampaign);
campaignRouter.get('/:id', getCampaignById);
campaignRouter.put('/:id', updateCampaign);
campaignRouter.delete('/:id', deleteCampaign);
campaignRouter.post('/:id/members', addMember);
