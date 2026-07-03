// tasks.js - Task management routes
const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const verifyToken = require('../middleware/auth');

// GET all tasks (with date filter support)
router.get('/', verifyToken, async (req, res) => {
  const { date } = req.query;
  const filter = { userId: req.user.uid };
  
  if (date) {
    filter.date = date;
  }

  try {
    const tasks = await Task.find(filter).sort({ startTime: 1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create task
router.post('/', verifyToken, async (req, res) => {
  const { title, description, date, startTime, endTime, priority, category } = req.body;
  
  try {
    const newTask = new Task({
      userId: req.user.uid,
      title,
      description,
      date,
      startTime,
      endTime,
      priority,
      category,
    });
    
    await newTask.save();
    res.status(201).json(newTask);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update task
router.put('/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { title, description, date, startTime, endTime, priority, category, completed } = req.body;

  try {
    let task = await Task.findOne({ _id: id, userId: req.user.uid });
    if (!task) return res.status(404).json({ error: 'Task not found or unauthorized.' });

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (date !== undefined) task.date = date;
    if (startTime !== undefined) task.startTime = startTime;
    if (endTime !== undefined) task.endTime = endTime;
    if (priority !== undefined) task.priority = priority;
    if (category !== undefined) task.category = category;
    if (completed !== undefined) task.completed = completed;

    await task.save();
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH toggle task completion status
router.patch('/:id/toggle', verifyToken, async (req, res) => {
  const { id } = req.params;

  try {
    let task = await Task.findOne({ _id: id, userId: req.user.uid });
    if (!task) return res.status(404).json({ error: 'Task not found.' });

    task.completed = !task.completed;
    await task.save();
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE remove task
router.delete('/:id', verifyToken, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await Task.deleteOne({ _id: id, userId: req.user.uid });
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Task not found.' });
    
    res.json({ success: true, message: 'Task deleted successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
