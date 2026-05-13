const crypto = require("crypto");

function createGuid() {
  return crypto.randomUUID();
}

module.exports = {
  createGuid,
};