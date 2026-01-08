import React, { useState, useEffect } from 'react';
import { ArrowLeft, ShoppingCart, Search, Filter, Package } from 'lucide-react';
export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');

  const categoryIcons = {
    'groceries': '🛒',
    'dairy': '🥛',
    'bakery': '🍞',
    'makeup': '💄',
    'haircare': '💇',
    'medicine': '💊'
  };

  useEffect(() => {
    // Get category from URL
    const pathParts = window.location.pathname.split('/');
    const cat = pathParts[pathParts.length - 1];
    setCategory(cat);
    
    loadProducts(cat);
  }, []);

  useEffect(() => {
    filterAndSortProducts();
  }, [products, searchQuery, sortBy]);

  const loadProducts = async (cat) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/api/product/${cat}`);
      const data = await response.json();
      
      if (data.success) {
        setProducts(data.products);
      }
    } catch (err) {
      console.error('Error loading products:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortProducts = () => {
    let filtered = [...products];

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort products
    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'stock':
        filtered.sort((a, b) => b.stock_left - a.stock_left);
        break;
      default:
        filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    setFilteredProducts(filtered);
  };

  const handleProductClick = (productId) => {
    window.location.href = `/product/${productId}`;
  };

  const handleBack = () => {
    window.location.href = '/categories';
  };

  const getStockColor = (stock) => {
    if (stock > 50) return 'text-green-600';
    if (stock > 20) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStockText = (stock) => {
    if (stock > 50) return 'In Stock';
    if (stock > 20) return 'Low Stock';
    if (stock > 0) return 'Very Low';
    return 'Out of Stock';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={handleBack}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <ArrowLeft className="w-6 h-6 text-gray-600" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-3xl">{categoryIcons[category]}</span>
                  <h1 className="text-2xl font-bold text-gray-800 capitalize">{category}</h1>
                </div>
                <p className="text-sm text-gray-500">{filteredProducts.length} items available</p>
              </div>
            </div>
            
            <button 
              onClick={() => window.location.href = '/cart'}
              className="p-2 hover:bg-gray-100 rounded-full relative"
            >
              <ShoppingCart className="w-6 h-6 text-gray-600" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                0
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Search and Filter Bar */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
              >
                <option value="name">Name (A-Z)</option>
                <option value="price-low">Price (Low to High)</option>
                <option value="price-high">Price (High to Low)</option>
                <option value="stock">Stock Level</option>
              </select>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading products...</p>
            </div>
          </div>
        )}

        {/* No Products */}
        {!loading && filteredProducts.length === 0 && (
          <div className="text-center py-16">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No products found</h3>
            <p className="text-gray-500">Try adjusting your search or filters</p>
          </div>
        )}

        {/* Products Grid */}
        {!loading && filteredProducts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => handleProductClick(product.id)}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all p-4 text-left group"
              >
                {/* Product Image Placeholder */}
                <div className="w-full h-40 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg mb-3 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Package className="w-16 h-16 text-gray-400" />
                </div>

                {/* Product Info */}
                <h3 className="font-bold text-gray-800 mb-1 line-clamp-2">{product.name}</h3>
                
                {/* Price and Stock Row */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-green-600">₹{product.price}</span>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${getStockColor(product.stock_left)}`}>
                      {getStockText(product.stock_left)}
                    </p>
                    <p className="text-xs text-gray-500">{product.stock_left} left</p>
                  </div>
                </div>

                {/* Origin */}
                <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
                  <span>🌍</span>
                  <span>Origin: {product.origin}</span>
                </div>

                {/* Quick Info Tags */}
                <div className="flex flex-wrap gap-1">
                  {product.ingredient1 && (
                    <span className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-full">
                      {product.ingredient1}
                    </span>
                  )}
                  {product.ingredient2 && (
                    <span className="px-2 py-1 bg-purple-50 text-purple-600 text-xs rounded-full">
                      {product.ingredient2}
                    </span>
                  )}
                </div>

                {/* View Details Button */}
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <span className="text-sm text-blue-600 font-medium group-hover:text-blue-700">
                    View Details & Nutrition →
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}