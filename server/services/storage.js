const supabase = require('../supabase');
const crypto = require('crypto');
const path = require('path');

const BUCKET_NAME = 'documents';

/**
 * Uploads a file to Supabase storage
 * @param {Express.Multer.File} file 
 * @returns {Promise<string>} The storage path
 */
async function uploadDocument(file) {
  const extension = path.extname(file.originalname);
  const randomName = crypto.randomBytes(16).toString('hex');
  const filePath = `${randomName}${extension}`;

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
    });

  if (error) {
    throw error;
  }

  return filePath;
}

/**
 * Generates a signed URL valid for 5 minutes
 * @param {string} filePath 
 * @returns {Promise<string>}
 */
async function getSignedUrl(filePath) {
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(filePath, 300); // 5 minutes

  if (error) {
    throw error;
  }

  return data.signedUrl;
}

/**
 * Deletes a file from storage
 * @param {string} filePath 
 */
async function deleteDocument(filePath) {
  await supabase.storage
    .from(BUCKET_NAME)
    .remove([filePath]);
}

module.exports = { uploadDocument, getSignedUrl, deleteDocument };
