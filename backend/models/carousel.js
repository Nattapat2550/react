// backend/models/carousel.js
const { callPureApi } = require('../utils/pureApi');

async function listCarouselItems() {
  const rows = await callPureApi('/carousel/list', 'GET');
  return rows || [];
}

async function createCarouselItem(data) {
  return await callPureApi('/carousel/create', 'POST', data);
}

async function updateCarouselItem(id, data) {
  return await callPureApi('/carousel/update', 'POST', { id, ...data });
}

async function deleteCarouselItem(id) {
  await callPureApi('/carousel/delete', 'POST', { id });
}

module.exports = { listCarouselItems, createCarouselItem, updateCarouselItem, deleteCarouselItem };