const express = require('express');
const router = express.Router();

// In-memory storage (replace with database later)
const userPreferences = {};

// Save preferences
router.post('/', (req, res) => {
  const { phone, preferences, labels } = req.body;
  
  userPreferences[phone] = {
    preferences,
    labels,
    updatedAt: new Date()
  };
  
  console.log(`Preferences saved for ${phone}:`, labels);
  res.json({ success: true, message: 'Preferences saved successfully' });
});

// Get preferences
router.get('/:phone', (req, res) => {
  const { phone } = req.params;
  
  const prefs = userPreferences[phone];
  
  if (prefs) {
    res.json({ 
      success: true, 
      preferences: prefs.preferences,
      labels: prefs.labels 
    });
  } else {
    res.json({ success: true, preferences: [] });
  }
});

module.exports = router;