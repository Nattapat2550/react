// react/backend/models/carousel.js
const { callPureApi } = require('../utils/pureApi');

async function listCarouselItems() {
  // GET /api/internal/carousel/list
  return await callPureApi('/carousel/list', 'GET') || [];
}

async function createCarouselItem(data) {
  // POST /api/internal/carousel/create
  return await callPureApi('/carousel/create', 'POST', data);
}

async function updateCarouselItem(id, data) {
  // POST /api/internal/carousel/update
  return await callPureApi('/carousel/update', 'POST', { id, ...data });
}

async function deleteCarouselItem(id) {
  // POST /api/internal/carousel/delete
  return await callPureApi('/carousel/delete', 'POST', { id });
}

module.exports = {
  listCarouselItems,
  createCarouselItem,
  updateCarouselItem,
  deleteCarouselItem,
};