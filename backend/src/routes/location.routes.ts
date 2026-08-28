import { Router } from 'express';
import {
  getLocations,
  getLocationById,
  createLocation,
  updateLocation,
  deleteLocation,
  locationSchema
} from '../controllers/location.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

export const locationRouter = Router();

locationRouter.use(authenticate);

locationRouter.get('/', getLocations);
locationRouter.post('/', validate(locationSchema), createLocation);
locationRouter.get('/:id', getLocationById);
locationRouter.put('/:id', updateLocation);
locationRouter.delete('/:id', deleteLocation);
