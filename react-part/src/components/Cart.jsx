import React, { useState, useEffect } from 'react';
import { ArrowLeft, ShoppingCart, Trash2, Plus, Minus, Sparkles, Package } from 'lucide-react';

export default function Cart() {
  const [cartItems, setCartItems] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCart();
  }, []);

  useEffect(() => {
    if (cartItems.length > 0) {
      generateRecommendations();
    }
  }, [cartItems]);

  const loadCart = () => {
    // Load cart from localStorage
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    setCartItems(cart);
    setLoading(false);
  };

  const generateRecommendations = async () => {
    // Smart pairing logic
    const pairings = {
      'bread': ['butter', 'jam', 'cheese', 'peanut'],
      'milk': ['cereal', 'coffee', 'tea', 'cookie', 'bread'],
      'rice': ['dal', 'curry', 'oil'],
      'pasta': ['sauce', 'cheese', 'oil'],
      'coffee': ['milk', 'sugar', 'cream'],
      'tea': ['milk', 'sugar', 'biscuit'],
      'cereal': ['milk', 'yogurt', 'fruit'],
      'yogurt': ['granola', 'honey', 'fruit'],
      'flour': ['yeast', 'oil', 'salt', 'sugar'],
      'egg': ['bread', 'milk', 'butter', 'cheese'],
      'cheese': ['bread', 'cracker', 'wine'],
      'butter': ['bread', 'flour', 'sugar'],
      'oil': ['flour', 'spice', 'pasta'],
      'chocolate': ['milk', 'biscuit', 'bread'],
      'cookie': ['milk', 'tea', 'coffee'],
    };

    // Get categories/keywords from cart items
    const cartKeywords = cartItems.map(item => 
      item.name.toLowerCase().split(' ')
    ).flat();

    // Find matching pairings
    const suggestedKeywords = new Set();
    cartKeywords.forEach(keyword => {
      Object.keys(pairings).forEach(key => {
        if (keyword.includes(key)) {
          pairings[key].forEach(pairing => suggestedKeywords.add(pairing));
        }
      });
    });

    // Fetch products that match recommendations
    try {
      const allProducts = await fetchAllProducts();
      
      const recommended = allProducts.filter(product => {
        // Don't recommend items already in cart
        if (cartItems.some(item => item.id === product.id)) return false;
        
        const productNameLower = product.name.toLowerCase();
        return Array.from(suggestedKeywords).some(keyword => 
          productNameLower.includes(keyword)
        );
      }).slice(0, 4); // Limit to 4 recommendations

      setRecommendations(recommended);
    } catch (err) {
      console.error('Error generating recommendations:', err);
    }
  };

  const fetchAllProducts = async () => {
    const categories = ['Groceries', 'Dairy', 'Bakery'];
    const allProducts = [];

    for (const category of categories) {
      try {
        const response = await fetch(`http://localhost:3001/api/product/${category}`);
        const data = await response.json();
        if (data.success && data.products) {
          allProducts.push(...data.products);
        }
      } catch (err) {
        console.error(`Error fetching ${category}:`, err);
      }
    }

    return allProducts;
  };

  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity < 1) {
      removeItem(itemId);
      return;
    }

    const updatedCart = cartItems.map(item =>
      item.id === itemId ? { ...item, quantity: newQuantity } : item
    );
    setCartItems(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
  };

  const removeItem = (itemId) => {
    const updatedCart = cartItems.filter(item => item.id !== itemId);
    setCartItems(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
  };

  const addRecommendationToCart = (product) => {
    const existingItem = cartItems.find(item => item.id === product.id);
    
    if (existingItem) {
      updateQuantity(product.id, existingItem.quantity + 1);
    } else {
      const newCart = [...cartItems, { ...product, quantity: 1 }];
      setCartItems(newCart);
      localStorage.setItem('cart', JSON.stringify(newCart));
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      alert('Your cart is empty!');
      return;
    }
    alert(`Checkout - Total: ₹${calculateTotal()}\n(Payment integration coming soon!)`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading cart...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => window.history.back()}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            <h1 className="text-xl font-bold text-gray-800">Shopping Cart</h1>
            <div className="w-10" /> {/* Spacer */}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {cartItems.length === 0 ? (
          // Empty Cart
          <div className="text-center py-16">
            <ShoppingCart className="w-24 h-24 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-600 mb-2">Your cart is empty</h2>
            <p className="text-gray-500 mb-6">Add some items to get started!</p>
            <button
              onClick={() => window.location.href = '/categories'}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 px-8 rounded-xl"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Cart Items ({cartItems.length})
              </h2>

              {cartItems.map((item) => (
                <div key={item.id} className="bg-white rounded-xl shadow-md p-4 flex gap-4">
                  {/* Product Image */}
                  <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Package className="w-12 h-12 text-purple-400" />
                  </div>

                  {/* Product Info */}
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-800 mb-1">{item.name}</h3>
                    <p className="text-sm text-gray-500 mb-2">{item.brand}</p>
                    <div className="flex items-center gap-4">
                      <span className="text-2xl font-bold text-green-600">₹{item.price}</span>
                      {item.weight && (
                        <span className="text-sm text-gray-500">/ {item.weight}</span>
                      )}
                    </div>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex flex-col items-end justify-between">
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5 text-red-500" />
                    </button>

                    <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 flex items-center justify-center hover:bg-gray-200 rounded transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-bold">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center hover:bg-gray-200 rounded transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="text-right">
                      <span className="text-sm text-gray-500">Subtotal</span>
                      <div className="font-bold text-gray-800">₹{item.price * item.quantity}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-lg p-6 sticky top-24">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Order Summary</h3>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal ({cartItems.length} items)</span>
                    <span>₹{calculateTotal()}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Delivery Fee</span>
                    <span className="text-green-600 font-semibold">FREE</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between text-xl font-bold text-gray-800">
                    <span>Total</span>
                    <span>₹{calculateTotal()}</span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2"
                >
                  <ShoppingCart className="w-5 h-5" />
                  Proceed to Checkout
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Smart Recommendations */}
        {recommendations.length > 0 && (
          <div className="mt-8">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl shadow-lg p-6 text-white mb-4">
              <h3 className="text-2xl font-bold flex items-center gap-2 mb-2">
                <Sparkles className="w-6 h-6" />
                You might also need
              </h3>
              <p className="text-purple-100">Based on items in your cart</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {recommendations.map((product) => (
                <div key={product.id} className="bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition-shadow">
                  <div className="w-full aspect-square bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center mb-3">
                    <Package className="w-16 h-16 text-purple-400" />
                  </div>
                  
                  <h4 className="font-bold text-gray-800 mb-2 line-clamp-2">{product.name}</h4>
                  <p className="text-2xl font-bold text-green-600 mb-3">₹{product.price}</p>
                  
                  <button
                    onClick={() => addRecommendationToCart(product)}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold py-2 rounded-lg flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add to Cart
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}