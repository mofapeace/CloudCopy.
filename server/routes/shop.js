const express = require('express');
const supabase = require('../supabase');
const router = express.Router();

// Register new shop (operator signup)
router.post('/register', async (req, res) => {
  try {
    const { userId, email, shopName, location, bwPrice, colorPrice } = req.body;

    // Validate pricing
    if (!bwPrice || !colorPrice || bwPrice < 5 || colorPrice < 5) {
      return res.status(400).json({ error: 'Invalid pricing (minimum 5 CFA)' });
    }

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }

    // Check if shop already exists for this user by checking operators table
    const { data: existingOperator } = await supabase
      .from('operators')
      .select('shop_id')
      .eq('email', email)
      .single();

    if (existingOperator) {
      return res.status(400).json({ error: 'Shop already registered for this operator' });
    }

    // Create shop record
    const { data: shop, error: shopError } = await supabase
      .from('shops')
      .insert({
        name: shopName,
        location: location,
        bw_price_per_page: parseInt(bwPrice, 10),
        color_price_per_page: parseInt(colorPrice, 10),
        is_online: true
      })
      .select()
      .single();

    if (shopError) {
      console.error('Supabase shop insert error:', shopError);
      throw shopError;
    }

    // Create operator record linking to shop
    const { error: operatorError } = await supabase
      .from('operators')
      .insert({
        id: userId, // Use auth user.id as operator id
        shop_id: shop.id,
        email: email
      });

    if (operatorError) {
      console.error('Supabase operator insert error:', operatorError);
      throw operatorError;
    }

    res.json({ 
      success: true, 
      shop: {
        id: shop.id,
        name: shop.name,
        location: shop.location,
        bwPrice: shop.bw_price_per_page,
        colorPrice: shop.color_price_per_page
      }
    });
  } catch (err) {
    console.error('Shop registration error:', err);
    res.status(500).json({ error: 'Failed to register shop', details: err.message });
  }
});

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
