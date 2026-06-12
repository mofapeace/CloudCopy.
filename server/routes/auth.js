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
      return res.status(400).json({ error: 'Student already registered' });
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

module.exports = router;
