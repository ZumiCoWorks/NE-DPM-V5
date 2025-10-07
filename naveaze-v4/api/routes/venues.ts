import { Router } from 'express'
import { authenticateToken } from '../middleware/auth'
import {
  getVenues,
  getVenue,
  createVenue,
  updateVenue,
  deleteVenue,
} from '../venues/index'

const router = Router()

// Apply authentication middleware to all routes
router.use(authenticateToken)

// GET /api/venues - List venues
router.get('/', getVenues)

// GET /api/venues/:id - Get single venue
router.get('/:id', getVenue)

// POST /api/venues - Create venue
router.post('/', createVenue)

// PUT /api/venues/:id - Update venue
router.put('/:id', updateVenue)

// DELETE /api/venues/:id - Delete venue
router.delete('/:id', deleteVenue)

export default router