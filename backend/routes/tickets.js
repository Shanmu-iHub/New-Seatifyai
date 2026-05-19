const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { Ticket, User } = require('../models');

// GET /api/tickets — Fetch all tickets (Admin only)
router.get('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden. Admin access required.' });
    }
    const tickets = await Ticket.find()
      .populate('student', 'name email mobile role')
      .sort({ createdAt: -1 });
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/tickets/my — Fetch tickets for logged-in student
router.get('/my', auth, async (req, res) => {
  try {
    const tickets = await Ticket.find({ student: req.user._id })
      .populate('student', 'name email mobile role')
      .sort({ createdAt: -1 });
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/tickets/:id — Fetch a single ticket's thread details
router.get('/:id', auth, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('student', 'name email mobile role');
    
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Access control: Student can only see their own tickets
    if (req.user.role !== 'admin' && ticket.student._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    res.json(ticket);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/tickets — Create a new ticket (Student)
router.post('/', auth, async (req, res) => {
  try {
    const { category, priority, subject, description } = req.body;
    if (!category || !subject || !description) {
      return res.status(400).json({ message: 'Category, subject, and description are required.' });
    }

    const ticket = await Ticket.create({
      student: req.user._id,
      category,
      priority: priority || 'Medium',
      subject,
      description,
      status: 'open',
      replies: []
    });

    res.status(201).json({
      message: 'Ticket created successfully',
      ticket
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/tickets/:id/reply — Append reply to a ticket thread
router.post('/:id/reply', auth, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Reply message cannot be empty.' });
    }

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Access control
    if (req.user.role !== 'admin' && ticket.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const senderType = req.user.role === 'admin' ? 'support' : 'student';

    ticket.replies.push({
      sender: senderType,
      message: message.trim(),
      createdAt: new Date()
    });

    // Auto update status: If admin replies, set status to in_progress. If student replies, set back to open if resolved.
    if (req.user.role === 'admin') {
      if (ticket.status === 'open') {
        ticket.status = 'in_progress';
      }
    } else {
      if (ticket.status === 'resolved') {
        ticket.status = 'open';
      }
    }

    await ticket.save();

    const populatedTicket = await Ticket.findById(ticket._id)
      .populate('student', 'name email mobile role');

    res.json({
      message: 'Reply sent successfully',
      ticket: populatedTicket
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/tickets/:id/status — Update ticket status (Admin only)
router.put('/:id/status', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden. Admin access required.' });
    }

    const { status } = req.body;
    if (!status || !['open', 'in_progress', 'resolved'].includes(status)) {
      return res.status(400).json({ message: 'Invalid ticket status.' });
    }

    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('student', 'name email mobile role');

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    res.json({
      message: `Ticket status updated to ${status} successfully`,
      ticket
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
