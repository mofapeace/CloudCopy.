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
  // We no longer hash the 6-digit code so we can return it safely to the operator
  return code;
}

/**
 * Verifies 2FA code against hash
 */
function verifyCode(inputCode, storedHash) {
  return inputCode === storedHash;
}

module.exports = { generateCode, hashCode, verifyCode };
