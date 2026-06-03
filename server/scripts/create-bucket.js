const supabase = require('../supabase');

(async () => {
  try {
    const bucket = 'documents';
    const { data, error } = await supabase.storage.getBucket(bucket).catch(() => ({ data: null, error: null }));
    if (data && data.id) {
      console.log('Bucket already exists:', bucket);
      return;
    }

    const res = await supabase.storage.createBucket(bucket, { public: false });
    if (res.error) throw res.error;
    console.log('Created bucket:', bucket);
  } catch (err) {
    console.error('Failed to create bucket:', err.message || err);
    process.exitCode = 1;
  }
})();
