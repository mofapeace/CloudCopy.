const express = require('express');
const supabase = require('../supabase');
const router = express.Router();

// Register new student
router.post('/student-register', async (req, res) => {
  try {
    const { id, email, name } = req.body;

    if (!id || !email || !name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if student already exists
    const { data: existingStudent } = await supabase
      .from('students')
      .select('id')
      .eq('auth_id', id)
      .single();

    if (existingStudent) {
      return res.json({ success: true, student: existingStudent, alreadyExists: true });
    }

    // Create student record
    const { data: student, error } = await supabase
      .from('students')
      .insert({
        auth_id: id,
        email: email,
        name: name,
        is_pro: false
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase student insert error:', error);
      throw error;
    }

    res.json({ success: true, student });
  } catch (err) {
    console.error('Student registration error:', err);
    res.status(500).json({ error: 'Failed to register student', details: err.message });
  }
});

// Check user role by looking up students and operators tables
// This is the source of truth for role — NOT user_metadata
router.post('/check-role', async (req, res) => {
  try {
    const { userId, email } = req.body;

    if (!userId && !email) {
      return res.status(400).json({ error: 'Must provide userId or email' });
    }

    // Check if user is an operator
    let operatorQuery = supabase.from('operators').select('id, shop_id, email');
    if (userId) {
      operatorQuery = operatorQuery.eq('id', userId);
    } else {
      operatorQuery = operatorQuery.eq('email', email);
    }
    const { data: operator } = await operatorQuery.single();

    if (operator) {
      // Fetch shop details for the operator
      const { data: shop } = await supabase
        .from('shops')
        .select('id, name, location, bw_price_per_page, color_price_per_page')
        .eq('id', operator.shop_id)
        .single();

      return res.json({
        role: 'operator',
        operator: {
          id: operator.id,
          email: operator.email,
          shopId: operator.shop_id
        },
        shop: shop || null
      });
    }

    // Check if user is a student
    let studentQuery = supabase.from('students').select('id, auth_id, email, name, is_pro');
    if (userId) {
      studentQuery = studentQuery.eq('auth_id', userId);
    } else {
      studentQuery = studentQuery.eq('email', email);
    }
    const { data: student } = await studentQuery.single();

    if (student) {
      return res.json({
        role: 'student',
        student: {
          id: student.id,
          authId: student.auth_id,
          email: student.email,
          name: student.name,
          isPro: student.is_pro
        }
      });
    }

    // User exists in Supabase Auth but not in any role table
    return res.json({ role: null });

  } catch (err) {
    console.error('Check role error:', err);
    res.status(500).json({ error: 'Failed to check role', details: err.message });
  }
});

module.exports = router;
