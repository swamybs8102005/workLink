const express = require('express');

const Job = require('../models/Job');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { q = '' } = req.query;
    const filter = q
      ? {
          $or: [
            { title: { $regex: q, $options: 'i' } },
            { location: { $regex: q, $options: 'i' } },
            { category: { $regex: q, $options: 'i' } },
          ],
        }
      : {};

    const jobs = await Job.find(filter).sort({ createdAt: -1 });
    res.status(200).json(jobs);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch jobs', error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, salary, location, contactNumber, description, category } = req.body;

    if (!title || !salary || !location || !contactNumber) {
      return res.status(400).json({
        message: 'title, salary, location, and contactNumber are required',
      });
    }

    const job = await Job.create({
      title,
      salary,
      location,
      contactNumber,
      description,
      category,
    });

    return res.status(201).json(job);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create job', error: error.message });
  }
});

module.exports = router;