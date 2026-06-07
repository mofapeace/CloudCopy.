const express = require('express');
const supabase = require('../supabase');
const { calculatePrice } = require('../services/pricing');
const router = express.Router();

// GET /jobs/student/:email - Fetch all jobs for a student
router.get('/student/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const { data: jobs, error } = await supabase
      .from('jobs')
      .select('*, shops(name)')
      .eq('user_email', email)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(jobs);
  } catch (err) {
    console.error('Fetch student jobs error:', err);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

// GET /jobs/shop/:shopId - Fetch pending jobs for an operator queue
router.get('/shop/:shopId', async (req, res) => {
  try {
    const { shopId } = req.params;
    const { data: jobs, error } = await supabase
      .from('jobs')
      .select('id, student_name, page_count, color, double_sided, copies, price_cfa, status, created_at, student_confirmed')
      .eq('shop_id', shopId)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) throw error;
    res.json(jobs);
  } catch (err) {
    console.error('Fetch shop jobs error:', err);
    res.status(500).json({ error: 'Failed to fetch queue' });
  }
});

// PATCH /jobs/:id - Edit pending job (copies, color, doubleSided)
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { color, doubleSided, copies } = req.body;

    // Fetch existing job to get page_count
    const { data: existingJob, error: fetchError } = await supabase
      .from('jobs')
      .select('page_count, status')
      .eq('id', id)
      .single();

    if (fetchError || !existingJob) return res.status(404).json({ error: 'Job not found' });
    if (existingJob.status !== 'pending') return res.status(400).json({ error: 'Only pending jobs can be edited' });

    // Recalculate price
    const priceCfa = calculatePrice(existingJob.page_count, color, doubleSided, copies, []); // Assume color pages map is lost for simple edits, or recalculate assuming all pages

    const { data: updatedJob, error: updateError } = await supabase
      .from('jobs')
      .update({
        color,
        double_sided: doubleSided,
        copies,
        price_cfa: priceCfa
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;
    res.json(updatedJob);
  } catch (err) {
    console.error('Update job error:', err);
    res.status(500).json({ error: 'Failed to update job' });
  }
});

// POST /jobs/:id/confirm - Student confirms the job
router.post('/:id/confirm', async (req, res) => {
  try {
    const { id } = req.params;
    const { data: job, error } = await supabase
      .from('jobs')
      .update({ student_confirmed: true })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(job);
  } catch (err) {
    console.error('Confirm job error:', err);
    res.status(500).json({ error: 'Failed to confirm job' });
  }
});

module.exports = router;
