import { Router } from 'express'
import { authenticateToken } from '../middleware/auth'
import {
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
} from '../events/index'

const router = Router()

// Apply authentication middleware to all routes
router.use(authenticateToken)

// GET /api/events - List events
router.get('/', getEvents)

// GET /api/events/:id - Get single event
router.get('/:id', getEvent)

// POST /api/events - Create event
router.post('/', createEvent)

// PUT /api/events/:id - Update event
router.put('/:id', updateEvent)

// DELETE /api/events/:id - Delete event
router.delete('/:id', deleteEvent)

export default router