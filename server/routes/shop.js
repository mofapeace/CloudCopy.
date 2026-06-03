const express = require('express');
const supabase = require('../supabase');
const router = express.Router();

// Get all online shops
router.get('/', async (req, res) => {
  try {
    const { data: shops, error } = await supabase
      .from('shops')
      .select('id, name, location, is_online')
      .eq('is_online', true);

    if (error) throw error;

    res.json(shops);
  } catch (err) {
    console.error('Shop fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch shops' });
  }
});

// Update shop status (Operator toggle)
router.post('/status', async (req, res) => {
  try {
    const { shopId, isOnline } = req.body;

    const { data: shop, error } = await supabase
      .from('shops')
      .update({ is_online: isOnline })
      .eq('id', shopId)
      .select()
      .single();

    if (error) throw error;

    res.json(shop);
  } catch (err) {
    console.error('Status toggle error:', err);
    res.status(500).json({ error: 'Failed to toggle status' });
  }
});

module.exports = router;
