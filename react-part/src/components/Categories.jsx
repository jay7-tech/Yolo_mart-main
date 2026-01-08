import React, { useState, useEffect } from 'react';
import { ShoppingCart, Map, Camera, User, Package } from 'lucide-react';

export default function Categories() {
  const [phone, setPhone] = useState('');
  const [preferences, setPreferences] = useState([]);
  const [showMap, setShowMap] = useState(false);

  const categories = [
    { 
      id: 'groceries', 
      name: 'Groceries', 
      icon: '🛒', 
      color: 'bg-green-500',
      location: 'Aisle 1-3',
      items: 50
    },
    { 
      id: 'dairy', 
      name: 'Dairy', 
      icon: '🥛', 
      color: 'bg-blue-500',
      location: 'Aisle 4',
      items: 30
    },
    { 
      id: 'bakery', 
      name: 'Bakery', 
      icon: '🍞', 
      color: 'bg-yellow-500',
      location: 'Aisle 5',
      items: 25
    },
    { 
      id: 'makeup', 
      name: 'Makeup', 
      icon: '💄', 
      color: 'bg-pink-500',
      location: 'Aisle 6-7',
      items: 40
    },
    { 
      id: 'haircare', 
      name: 'Haircare', 
      icon: '💇', 
      color: 'bg-purple-500',
      location: 'Aisle 8',
      items: 35
    },
    { 
      id: 'medicine', 
      name: 'Medicine', 
      icon: '💊', 
      color: 'bg-red-500',
      location: 'Aisle 9-10',
      items: 45
    },
  ];

  useEffect(() => {
    const storedPhone = localStorage.getItem('phone');
    if (!storedPhone) {
      window.location.href = '/';
      return;
    }
    setPhone(storedPhone);
    loadPreferences(storedPhone);
  }, []);

  const loadPreferences = async (phoneNumber) => {
    try {
      const response = await fetch(`http://localhost:3001/api/preferences/${phoneNumber}`);
      const data = await response.json();
      
      if (data.success && data.labels) {
        setPreferences(data.labels);
      }
    } catch (err) {
      console.error('Error loading preferences:', err);
    }
  };

  const handleCategoryClick = (categoryId) => {
    window.location.href = `/products/${categoryId}`;
  };

  const handleScanClick = () => {
    window.location.href = '/scanner';
  };

  const handleCartClick = () => {
    window.location.href = '/cart';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">YoloMart</h1>
                <p className="text-sm text-gray-500">Welcome back!</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={handleCartClick}
                className="p-2 hover:bg-gray-100 rounded-full relative"
              >
                <ShoppingCart className="w-6 h-6 text-gray-600" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  0
                </span>
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-full">
                <User className="w-6 h-6 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* User Info & Preferences */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm text-gray-500">Logged in as</p>
              <p className="font-semibold text-gray-800">+91 {phone}</p>
            </div>
            <button 
              onClick={() => window.location.href = '/preferences'}
              className="text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              Edit Preferences
            </button>
          </div>
          
          {preferences.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-2">Your Preferences:</p>
              <div className="flex flex-wrap gap-2">
                {preferences.slice(0, 4).map((pref, index) => (
                  <span 
                    key={index}
                    className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium"
                  >
                    {pref}
                  </span>
                ))}
                {preferences.length > 4 && (
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                    +{preferences.length - 4} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Store Map Button */}
        <button
          onClick={() => setShowMap(!showMap)}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold py-4 rounded-xl shadow-lg mb-6 flex items-center justify-center gap-2 transition-all"
        >
          <Map className="w-5 h-5" />
          {showMap ? 'Hide Store Map' : 'View Store Map'}
        </button>

        {/* Store Map */}
        {showMap && (
          <div className="bg-white rounded-xl shadow-xl p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Store Layout</h2>
            <div className="grid grid-cols-2 gap-4">
              {categories.map((category) => (
                <div 
                  key={category.id}
                  className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-400 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 ${category.color} rounded-lg flex items-center justify-center text-2xl`}>
                      {category.icon}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{category.name}</p>
                      <p className="text-xs text-gray-500">{category.location}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                💡 <strong>Tip:</strong> Use the camera icon to scan products anywhere in the store!
              </p>
            </div>
          </div>
        )}

        {/* Categories Grid */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Shop by Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryClick(category.id)}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all p-6 text-center group hover:scale-105"
              >
                <div className={`w-20 h-20 ${category.color} rounded-2xl flex items-center justify-center text-4xl mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                  {category.icon}
                </div>
                <h3 className="font-bold text-gray-800 mb-1">{category.name}</h3>
                <p className="text-sm text-gray-500">{category.items} items</p>
                <p className="text-xs text-gray-400 mt-1">{category.location}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Scan Button (now triggers CameraScanner) */}
<button
  id="camera-icon"                 /* <-- required: CameraScanner binds to this id */
  type="button"
  onClick={(e) => {
    // stop parent navigation and give scanner priority
    if (e && e.preventDefault) {
      e.preventDefault();
      e.stopPropagation();
    }

    // If CameraScanner registered a global helper, use it (preferred)
    if (window.openScanner && typeof window.openScanner === 'function') {
      try {
        window.openScanner();
        return;
      } catch (err) {
        console.warn('window.openScanner failed:', err);
      }
    }

    // Fallback: call the existing handler (preserves current behavior if helper isn't present)
    if (typeof handleScanClick === 'function') {
      try { handleScanClick(); } catch (err) { console.warn('handleScanClick failed:', err); }
    }
  }}
  className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-br from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 rounded-full shadow-2xl flex items-center justify-center text-white hover:scale-110 transition-transform z-20"
>
  <Camera className="w-8 h-8" />
</button>

      </div>
    </div>
  );
}