const express = require('express');
const { listCarouselItems } = require('../models/carousel');
const router = express.Router();

router.get('/', async (_req, res) => {
  const items = await listCarouselItems();
  res.json(items);
});

module.exports = router;
module.exports.default = router;