const express = require('express');

const Application = require('../models/Application');
const Job = require('../models/Job');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { jobId } = req.query;
    const filter = jobId ? { jobId } : {};

    const applications = await Application.find(filter)
      .populate('jobId', 'title location salary')
      .sort({ createdAt: -1 });

    return res.status(200).json(applications);
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to fetch applications',
      error: error.message,
    });
  }
});

router.post('/', async (req, res) => {
  try {
    const { jobId, applicantName, applicantPhone, note } = req.body;

    if (!jobId || !applicantName || !applicantPhone) {
      return res.status(400).json({
        message: 'jobId, applicantName, and applicantPhone are required',
      });
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const application = await Application.create({
      jobId,
      applicantName,
      applicantPhone,
      note,
    });

    return res.status(201).json(application);
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to submit application',
      error: error.message,
    });
  }
});

module.exports = router;