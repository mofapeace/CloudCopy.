const crypto = require('crypto');

/**
 * Generates a 6-digit 2FA code
 */
function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Hashes 2FA code for storage (not as critical as PIN, but good practice)
 */
function hashCode(code) {
  return crypto.createHash('sha256').update(code).digest('hex');
}

/**
 * Verifies 2FA code against hash
 */
function verifyCode(inputCode, storedHash) {
  const inputHash = crypto.createHash('sha256').update(inputCode).digest('hex');
  return inputHash === storedHash;
}

module.exports = { generateCode, hashCode, verifyCode };
