const crypto = require('crypto');
const bcrypt = require('bcrypt');

/**
 * Generates a random 4-digit PIN and its bcrypt hash
 * @returns {Promise<{pin: string, hash: string}>}
 */
async function generatePin() {
  const pin = crypto.randomInt(1000, 10000).toString();
  const saltRounds = 10;
  const hash = await bcrypt.hash(pin, saltRounds);
  return { pin, hash };
}

module.exports = { generatePin };
