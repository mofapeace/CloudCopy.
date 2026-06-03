const cron = require('node-cron');
const supabase = require('../supabase');
const { deleteDocument } = require('./storage');

/**
 * Deletes a file and optionally the job record 10 minutes after it was printed
 * @param {string} jobId 
 */
function autoNuke(jobId) {
  setTimeout(async () => {
    try {
      const { data: job } = await supabase
        .from('jobs')
        .select('file_path')
        .eq('id', jobId)
        .single();

      if (job && job.file_path && job.file_path !== 'deleted') {
        await deleteDocument(job.file_path);
        await supabase.from('jobs').update({ file_path: 'deleted' }).eq('id', jobId);
        console.log(`Auto-nuked file for job ${jobId}`);
      }
    } catch (err) {
      console.error(`Failed to auto-nuke job ${jobId}:`, err);
    }
  }, 10 * 60 * 1000); // 10 minutes
}

// Midnight purge of pending jobs older than 24 hours
cron.schedule('0 0 * * *', async () => {
  console.log('Running midnight purge of abandoned jobs...');
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const { data: abandonedJobs } = await supabase
      .from('jobs')
      .select('id, file_path')
      .eq('status', 'pending')
      .lt('created_at', yesterday.toISOString());

    if (abandonedJobs && abandonedJobs.length > 0) {
      for (const job of abandonedJobs) {
        if (job.file_path && job.file_path !== 'deleted') {
          await deleteDocument(job.file_path);
        }
        await supabase.from('jobs').update({ status: 'expired', file_path: 'deleted' }).eq('id', job.id);
      }
      console.log(`Purged ${abandonedJobs.length} abandoned jobs.`);
    }
  } catch (err) {
    console.error('Midnight purge failed:', err);
  }
});

module.exports = { autoNuke };
