import React, { useState, useEffect } from 'react';
import { ArrowLeft, ShoppingCart, AlertTriangle, Package, Building, MapPin } from 'lucide-react';
import ComparisonModal from './ComparisonModal';

export default function ProductDetails() {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [alternatives, setAlternatives] = useState([]);
  const [userPreferences, setUserPreferences] = useState([]);
  const [conflictingIngredients, setConflictingIngredients] = useState([]);
  const [showComparison, setShowComparison] = useState(false);
  const [selectedAlternative, setSelectedAlternative] = useState(null);
  const [cartItemCount, setCartItemCount] = useState(0);

  useEffect(() => {
    loadUserPreferences();
    const pathParts = window.location.pathname.split('/');
    const productId = pathParts[pathParts.length - 1];
    loadProduct(productId);
    updateCartCount();
  }, []);

  const updateCartCount = () => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    setCartItemCount(totalItems);
  };

  useEffect(() => {
    if (product && userPreferences.length > 0) {
      checkIngredientConflicts(product);
    }
  }, [product, userPreferences]);

  const loadUserPreferences = async () => {
    try {
      const phone = localStorage.getItem('phone');
      if (!phone) return;
      
      const response = await fetch(`http://localhost:3001/api/preferences/${phone}`);
      const data = await response.json();
      
      console.log('User preferences loaded:', data);
      
      if (data.success && data.labels) {
        setUserPreferences(data.labels);
      }
    } catch (err) {
      console.error('Error loading preferences:', err);
    }
  };

  const loadProduct = async (productId) => {
    setLoading(true);
    try {
      console.log('Fetching product with ID:', productId);
      const response = await fetch(`http://localhost:3001/api/product/${productId}`);
      const data = await response.json();
      
      console.log('Received data:', data);
      console.log('Product object:', data.product);
      
      if (data.success && data.product) {
        setProduct(data.product);
      } else {
        console.error('Product not found in response');
        setProduct(null);
      }
    } catch (err) {
      console.error('Error loading product:', err);
      setProduct(null);
    } finally {
      setLoading(false);
    }
  };

  const checkIngredientConflicts = (product) => {
    if (!product || !userPreferences.length) {
      setConflictingIngredients([]);
      return;
    }

    console.log('Checking conflicts...');
    console.log('User preferences:', userPreferences);
    console.log('Product data:', product);

    const conflicts = [];

    userPreferences.forEach(pref => {
      const prefLower = pref.toLowerCase();

      if (prefLower.includes('free') && product.avoid_ingredients) {
        const ingredientType = prefLower.replace(' free', '').trim();
        const matchingIngredients = product.avoid_ingredients.filter(ing => 
          ing.toLowerCase().includes(ingredientType) || ingredientType.includes(ing.toLowerCase())
        );
        conflicts.push(...matchingIngredients);
      }

      if (prefLower === 'low sugar' && product.sugar > 10) {
        conflicts.push(`High Sugar (${product.sugar}g per 100g)`);
      }
      
      if (prefLower === 'low calorie' && product.calories > 200) {
        conflicts.push(`High Calorie (${product.calories} cal per 100g)`);
      }
      
      if (prefLower === 'high protein' && product.protein < 10) {
        conflicts.push(`Low Protein (${product.protein}g per 100g)`);
      }
      
      if (prefLower === 'low carb' && product.carbs > 30) {
        conflicts.push(`High Carbs (${product.carbs}g per 100g)`);
      }
      
      if (prefLower === 'low sodium' && product.sodium > 400) {
        conflicts.push(`High Sodium (${product.sodium}mg per 100g)`);
      }
      
      if (prefLower === 'high fiber' && product.fiber < 5) {
        conflicts.push(`Low Fiber (${product.fiber}g per 100g)`);
      }
      
      if (prefLower === 'keto friendly' && product.carbs > 10) {
        conflicts.push(`Too Many Carbs for Keto (${product.carbs}g per 100g)`);
      }
      
      if (prefLower === 'nut free' && product.allergens) {
        const nutAllergens = product.allergens.filter(a => 
          a.toLowerCase().includes('nut') || a.toLowerCase().includes('almond') || 
          a.toLowerCase().includes('peanut') || a.toLowerCase().includes('cashew')
        );
        conflicts.push(...nutAllergens);
      }
      
      if (prefLower === 'no preservatives' && product.ingredients) {
        const preservatives = product.ingredients.filter(ing => 
          ing.toLowerCase().includes('preservative') || 
          ing.toLowerCase().includes('benzoate') ||
          ing.toLowerCase().includes('sorbate')
        );
        if (preservatives.length > 0) {
          conflicts.push('Contains Preservatives');
        }
      }

      if (prefLower === 'no sulphates' && product.ingredients) {
        const sulphates = product.ingredients.filter(ing => 
          ing.toLowerCase().includes('sulphate') || 
          ing.toLowerCase().includes('sulfate')
        );
        if (sulphates.length > 0) {
          conflicts.push('Contains Sulphates');
        }
      }
    });
    
    const uniqueConflicts = [...new Set(conflicts)];
    
    console.log('Conflicts found:', uniqueConflicts);
    setConflictingIngredients(uniqueConflicts);
    
    if (uniqueConflicts.length > 0) {
      loadAlternatives(product.category, product.id);
    }
  };

  const loadAlternatives = async (category, currentId) => {
    try {
      const response = await fetch(`http://localhost:3001/api/product/${category}`);
      const data = await response.json();
      
      if (data.success && data.products) {
        const scoredAlternatives = data.products
          .filter(p => p.id !== currentId)
          .map(alt => ({
            ...alt,
            score: calculateHealthScore(alt)
          }))
          .filter(alt => alt.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 3);
        
        console.log('Alternatives with scores:', scoredAlternatives);
        setAlternatives(scoredAlternatives);
      }
    } catch (err) {
      console.error('Error loading alternatives:', err);
    }
  };

  const calculateHealthScore = (altProduct) => {
    if (!product || !userPreferences.length) return 0;
    
    let score = 0;
    
    userPreferences.forEach(pref => {
      const prefLower = pref.toLowerCase();
      
      if (prefLower === 'low sugar') {
        if (altProduct.sugar < product.sugar) score += 3;
        if (altProduct.sugar > product.sugar) score -= 2;
      }
      
      if (prefLower === 'low calorie') {
        if (altProduct.calories < product.calories) score += 3;
        if (altProduct.calories > product.calories) score -= 2;
      }
      
      if (prefLower === 'high protein') {
        if (altProduct.protein > product.protein) score += 3;
        if (altProduct.protein < product.protein) score -= 2;
      }
      
      if (prefLower === 'low carb') {
        if (altProduct.carbs < product.carbs) score += 3;
        if (altProduct.carbs > product.carbs) score -= 2;
      }
      
      if (prefLower === 'low sodium') {
        if (altProduct.sodium < product.sodium) score += 2;
        if (altProduct.sodium > product.sodium) score -= 1;
      }
      
      if (prefLower === 'high fiber') {
        if (altProduct.fiber > product.fiber) score += 2;
        if (altProduct.fiber < product.fiber) score -= 1;
      }
      
      if (prefLower === 'gluten free') {
        if (altProduct.avoid_ingredients && !altProduct.avoid_ingredients.some(ing => ing.toLowerCase().includes('gluten'))) {
          score += 5;
        }
      }
      
      if (prefLower === 'dairy free') {
        if (altProduct.avoid_ingredients && !altProduct.avoid_ingredients.some(ing => 
          ing.toLowerCase().includes('milk') || ing.toLowerCase().includes('dairy')
        )) {
          score += 5;
        }
      }
      
      if (prefLower === 'vegan') {
        const nonVeganIngredients = ['milk', 'butter', 'egg', 'honey', 'cheese'];
        const hasNonVegan = altProduct.ingredients?.some(ing => 
          nonVeganIngredients.some(nv => ing.toLowerCase().includes(nv))
        );
        if (!hasNonVegan) score += 5;
      }
      
      if (prefLower === 'keto friendly') {
        if (altProduct.carbs < 10 && altProduct.fat > product.fat) score += 4;
        if (altProduct.carbs > 15) score -= 3;
      }
    });
    
    return score;
  };

  const handleAddToCart = () => {
    // Get existing cart
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    
    // Check if product already exists in cart
    const existingItemIndex = cart.findIndex(item => item.id === product.id);
    
    if (existingItemIndex > -1) {
      // Update quantity if exists
      cart[existingItemIndex].quantity += quantity;
    } else {
      // Add new item
      cart.push({
        ...product,
        quantity: quantity
      });
    }
    
    // Save to localStorage
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Show success message
    alert(`Added ${quantity}x ${product.name} to cart!`);
    
    // Optionally redirect to cart
    // window.location.href = '/cart';
  };

  const handleBack = () => {
    window.history.back();
  };

  const handleCompareClick = (alternative) => {
    console.log('Compare clicked!', alternative);
    setSelectedAlternative(alternative);
    setShowComparison(true);
  };

  const handleSelectAlternative = (alternative) => {
    window.location.href = `/product/${alternative.id}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600">Product not found</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Comparison Modal */}
      {showComparison && selectedAlternative && (
        <ComparisonModal
          currentProduct={product}
          alternativeProduct={selectedAlternative}
          onClose={() => setShowComparison(false)}
          onSelectAlternative={handleSelectAlternative}
        />
      )}

      {/* Header */}
      <div className="bg-white shadow-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button onClick={handleBack} className="p-2 hover:bg-gray-100 rounded-full">
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            <h1 className="text-xl font-bold text-gray-800">Product Details</h1>
            <button 
              onClick={() => window.location.href = '/cart'}
              className="p-2 hover:bg-gray-100 rounded-full relative"
            >
              <ShoppingCart className="w-6 h-6 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Product Image and Basic Info */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-1/3">
              <div className="w-full aspect-square bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl flex items-center justify-center">
                <Package className="w-24 h-24 text-purple-400" />
              </div>
            </div>

            <div className="flex-1">
              <h2 className="text-3xl font-bold text-gray-800 mb-3">{product.name}</h2>
              
              <div className="flex items-baseline gap-3 mb-4">
                <span className="text-4xl font-bold text-green-600">₹{product.price}</span>
                {product.weight && <span className="text-gray-500">/ {product.weight}</span>}
              </div>

              <div className="space-y-2 mb-4">
                {product.brand && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <Building className="w-4 h-4" />
                    <span className="font-medium">Brand:</span>
                    <span>{product.brand}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-gray-700">
                  <MapPin className="w-4 h-4" />
                  <span className="font-medium">Origin:</span>
                  <span>{product.origin}</span>
                </div>
              </div>

              <div className="mb-4">
                <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                  product.stock_left > 50 ? 'bg-green-100 text-green-700' :
                  product.stock_left > 20 ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {product.stock_left} units in stock
                </div>
              </div>

              <div className="flex items-center gap-4 mb-4">
                <span className="font-medium text-gray-700">Quantity:</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold"
                  >
                    -
                  </button>
                  <span className="w-12 text-center font-bold text-lg">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock_left, quantity + 1))}
                    className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold"
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                onClick={handleAddToCart}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg"
              >
                <ShoppingCart className="w-5 h-5" />
                Add to Cart - ₹{product.price * quantity}
              </button>
            </div>
          </div>
        </div>

        {/* Nutrition Facts */}
        {(product.calories > 0 || product.protein > 0 || product.fat > 0 || product.carbs > 0) && (
          <div className="bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl shadow-lg p-6 text-white">
            <h3 className="text-2xl font-bold mb-4">Nutrition Facts (per 100g)</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-gray-800">{product.calories || 0}</div>
                <div className="text-sm text-gray-600">Calories</div>
              </div>
              <div className="bg-white rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-gray-800">{product.protein || 0}g</div>
                <div className="text-sm text-gray-600">Protein</div>
              </div>
              <div className="bg-white rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-gray-800">{product.fat || 0}g</div>
                <div className="text-sm text-gray-600">Fat</div>
              </div>
              <div className="bg-white rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-gray-800">{product.carbs || 0}g</div>
                <div className="text-sm text-gray-600">Carbs</div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
              {product.fiber !== undefined && product.fiber > 0 && (
                <div className="bg-white bg-opacity-90 rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-gray-800">{product.fiber}g</div>
                  <div className="text-xs text-gray-600">Fiber</div>
                </div>
              )}
              {product.sugar !== undefined && product.sugar > 0 && (
                <div className="bg-white bg-opacity-90 rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-gray-800">{product.sugar}g</div>
                  <div className="text-xs text-gray-600">Sugar</div>
                </div>
              )}
              {product.sodium !== undefined && product.sodium > 0 && (
                <div className="bg-white bg-opacity-90 rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-gray-800">{product.sodium}mg</div>
                  <div className="text-xs text-gray-600">Sodium</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Ingredients */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            📋 Ingredients
          </h3>
          <div className="flex flex-wrap gap-2">
            {product.ingredients && product.ingredients.map((ingredient, index) => (
              <span
                key={index}
                className="px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium"
              >
                {ingredient}
              </span>
            ))}
          </div>
        </div>

        {/* Warning: Ingredients to Avoid */}
        {conflictingIngredients.length > 0 && (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl shadow-lg p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="text-xl font-bold text-red-800 mb-3">
                  ⚠️ Contains ingredients you want to avoid:
                </h3>
                <div className="flex flex-wrap gap-2">
                  {conflictingIngredients.map((ingredient, index) => (
                    <span
                      key={index}
                      className="px-4 py-2 bg-red-600 text-white rounded-full text-sm font-bold"
                    >
                      {ingredient}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Allergen Warning */}
        {product.allergens && product.allergens.length > 0 && (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-yellow-800 mb-3 flex items-center gap-2">
              ⚠️ Allergen Information
            </h3>
            <div className="flex flex-wrap gap-2">
              {product.allergens.map((allergen, index) => (
                <span
                  key={index}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-full text-sm font-medium"
                >
                  {allergen}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Healthier Alternatives */}
        {alternatives.length > 0 && (
          <div className="bg-green-50 rounded-2xl shadow-lg p-6">
            <h3 className="text-2xl font-bold text-green-800 mb-4 flex items-center gap-2">
              💡 Healthier Alternatives
            </h3>
            <p className="text-green-700 mb-4">Based on your preferences, you might prefer:</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {alternatives.map((alt) => (
                <button
                  key={alt.id}
                  onClick={() => handleCompareClick(alt)}
                  className="bg-white rounded-xl p-4 hover:shadow-lg transition-shadow text-left hover:ring-2 hover:ring-green-400"
                >
                  <h4 className="font-bold text-gray-800 mb-2">{alt.name}</h4>
                  <p className="text-2xl font-bold text-green-600 mb-2">₹{alt.price}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-green-600 font-medium">Compare →</span>
                    {alt.score && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                        Score: +{alt.score}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}