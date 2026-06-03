const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

/**
 * Downloads a file from a URL to a local temporary path
 */
function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const client = url.startsWith('https') ? https : http;
    client.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

/**
 * Prints the document
 */
async function printDocument(job, config) {
  console.log(`[Printer] Processing job ${job.id} for ${job.studentName}`);
  
  if (!job.fileUrl) {
    console.warn(`[Printer] Job ${job.id} has no file URL.`);
    return;
  }

  const tempPath = path.join(__dirname, `temp_${job.id}.pdf`);
  
  try {
    console.log(`[Printer] Downloading file from ${job.fileUrl.substring(0, 50)}...`);
    await downloadFile(job.fileUrl, tempPath);
    console.log(`[Printer] Download complete.`);

    // Mock print step
    console.log(`[Printer] Sending to printer: ${config.printerName}`);
    console.log(`[Printer] Options: ${job.copies} copies, Color: ${job.color}, DoubleSided: ${job.doubleSided}`);
    
    // Simulating print delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log(`[Printer] Print successful!`);

  } catch (err) {
    console.error(`[Printer] Error printing job ${job.id}:`, err);
    throw err;
  } finally {
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }
  }
}

module.exports = { printDocument };
