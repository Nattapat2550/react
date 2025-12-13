const api = require('../config/api');

async function listCarouselItems() {
  const { data } = await api.get('/api/internal/carousel/list');
  return data.data;
}

async function createCarouselItem(payload) {
  const { data } = await api.post('/api/internal/carousel/create', payload);
  return data.data;
}

async function updateCarouselItem(id, payload) {
  const { data } = await api.post('/api/internal/carousel/update', { id, ...payload });
  return data.data;
}

async function deleteCarouselItem(id) {
  await api.post('/api/internal/carousel/delete', { id });
}

module.exports = { listCarouselItems, createCarouselItem, updateCarouselItem, deleteCarouselItem };