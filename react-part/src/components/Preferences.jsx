import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, Loader } from 'lucide-react';

export default function Preferences() {
  const [selectedPreferences, setSelectedPreferences] = useState([]);
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState('');

  // Dietary preferences options
  const preferences = [
    { id: 1, label: 'Low Calorie', emoji: '🔥', description: 'Under 200 cal/100g' },
    { id: 2, label: 'High Protein', emoji: '💪', description: 'Rich in protein' },
    { id: 3, label: 'Calorie Surplus', emoji: '📈', description: 'Energy-dense foods' },
    { id: 4, label: 'High Fiber', emoji: '🌾', description: 'Gut health' },
    { id: 5, label: 'No Sulphates', emoji: '🚫', description: 'Preservative-free' },
    { id: 6, label: 'Organic Only', emoji: '🌱', description: 'Chemical-free' },
    { id: 7, label: 'Low Sugar', emoji: '🍬', description: 'Reduced sugar' },
    { id: 8, label: 'Gluten Free', emoji: '🌾', description: 'No gluten' },
    { id: 9, label: 'Dairy Free', emoji: '🥛', description: 'Lactose-free' },
    { id: 10, label: 'Vegan', emoji: '🥗', description: 'Plant-based only' },
    { id: 11, label: 'Keto Friendly', emoji: '🥑', description: 'Low-carb, high-fat' },
    { id: 12, label: 'Low Sodium', emoji: '🧂', description: 'Heart-healthy' },
    { id: 13, label: 'Heart Healthy', emoji: '❤️', description: 'Good fats' },
    { id: 14, label: 'Diabetic Friendly', emoji: '💉', description: 'Low glycemic index' },
    { id: 15, label: 'No Preservatives', emoji: '✨', description: 'Fresh ingredients' },
    { id: 16, label: 'Non-GMO', emoji: '🧬', description: 'Natural crops' },
    { id: 17, label: 'Nut Free', emoji: '🥜', description: 'Allergy-safe' },
    { id: 18, label: 'Low Carb', emoji: '🍞', description: 'Reduced carbs' },
  ];

  useEffect(() => {
    // Get phone number from localStorage
    const storedPhone = localStorage.getItem('phone');
    if (!storedPhone) {
      window.location.href = '/';
      return;
    }
    setPhone(storedPhone);

    // Load existing preferences if any
    loadPreferences(storedPhone);
  }, []);

  const loadPreferences = async (phoneNumber) => {
    try {
      const response = await fetch(`http://localhost:3001/api/preferences/${phoneNumber}`);
      const data = await response.json();
      
      if (data.success && data.preferences) {
        setSelectedPreferences(data.preferences);
      }
    } catch (err) {
      console.error('Error loading preferences:', err);
    }
  };

  const togglePreference = (id) => {
    setSelectedPreferences(prev => 
      prev.includes(id) 
        ? prev.filter(p => p !== id)
        : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (selectedPreferences.length === 0) {
      alert('Please select at least one preference');
      return;
    }

    setLoading(true);

    const selectedLabels = preferences
      .filter(p => selectedPreferences.includes(p.id))
      .map(p => p.label);

    try {
      const response = await fetch('http://localhost:3001/api/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: phone,
          preferences: selectedPreferences,
          labels: selectedLabels
        }),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('preferencesSet', 'true');
        window.location.href = '/categories';
      } else {
        alert('Failed to save preferences. Please try again.');
      }
    } catch (err) {
      console.error('Error saving preferences:', err);
      alert('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('preferencesSet', 'true');
    window.location.href = '/categories';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mb-4 shadow-lg">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Your Food Preferences</h1>
          <p className="text-gray-600 text-lg">
            Select your dietary preferences for personalized recommendations
          </p>
          <p className="text-sm text-gray-500 mt-2">
            📱 Logged in as: {phone}
          </p>
        </div>

        {/* Preferences Grid */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto p-2">
            {preferences.map((pref) => (
              <button
                key={pref.id}
                onClick={() => togglePreference(pref.id)}
                className={`p-4 rounded-xl border-2 transition-all text-left hover:scale-105 ${
                  selectedPreferences.includes(pref.id)
                    ? 'border-purple-500 bg-purple-50 shadow-lg ring-2 ring-purple-200'
                    : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{pref.emoji}</div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-800 text-sm">{pref.label}</div>
                    <div className="text-xs text-gray-500">{pref.description}</div>
                  </div>
                  {selectedPreferences.includes(pref.id) && (
                    <div className="text-purple-500">✓</div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Selection Counter */}
        <div className="text-center mb-6">
          <div className="inline-block bg-white px-6 py-3 rounded-full shadow-md">
            <span className="text-gray-600 font-medium">
              {selectedPreferences.length} preference{selectedPreferences.length !== 1 ? 's' : ''} selected
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={handleSkip}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-4 rounded-xl transition-colors"
          >
            Skip for Now
          </button>

          <button
            onClick={handleSubmit}
            disabled={selectedPreferences.length === 0 || loading}
            className="flex-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white font-semibold py-4 px-8 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                Start Shopping
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>

        {/* Clear All Button */}
        {selectedPreferences.length > 0 && (
          <div className="text-center mt-4">
            <button
              onClick={() => setSelectedPreferences([])}
              className="text-purple-600 hover:text-purple-700 font-medium text-sm"
            >
              Clear All Selections
            </button>
          </div>
        )}
      </div>
    </div>
  );
}