const express = require('express');

const ServiceProvider = require('../models/ServiceProvider');

const router = express.Router();

const defaultProviders = [
  {
    name: 'Ravi Electric Works',
    serviceType: 'Electrician',
    location: 'Central Market',
    phone: '+91-9876543210',
    availableNow: true,
  },
  {
    name: 'A1 Plumbing Team',
    serviceType: 'Plumber',
    location: 'Station Road',
    phone: '+91-9123456780',
    availableNow: true,
  },
  {
    name: 'CleanHome Services',
    serviceType: 'Cleaner',
    location: 'Old City Area',
    phone: '+91-9988776655',
    availableNow: false,
  },
];

router.get('/', async (req, res) => {
  try {
    const providers = await ServiceProvider.find({}).sort({ createdAt: -1 });

    if (providers.length === 0) {
      return res.status(200).json(defaultProviders);
    }

    return res.status(200).json(providers);
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to fetch service providers',
      error: error.message,
    });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, serviceType, location, phone, availableNow } = req.body;

    if (!name || !serviceType || !location || !phone) {
      return res.status(400).json({
        message: 'name, serviceType, location, and phone are required',
      });
    }

    const provider = await ServiceProvider.create({
      name,
      serviceType,
      location,
      phone,
      availableNow,
    });

    return res.status(201).json(provider);
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to create service provider',
      error: error.message,
    });
  }
});

module.exports = router;