// Optionally, use this file to combine and export all routes for easier import in server.js
// Not required for current setup, but useful for larger projects

module.exports = {
  auth: require('./auth'),
  tasks: require('./tasks'),
  workflow: require('./workflow'),
  refund: require('./refund'),
  bankProduct: require('./bankProduct'),
};
