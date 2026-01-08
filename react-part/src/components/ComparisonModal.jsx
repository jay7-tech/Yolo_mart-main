import React from 'react';
import { X, TrendingUp, TrendingDown, Minus, Check, Package } from 'lucide-react';

export default function ComparisonModal({ currentProduct, alternativeProduct, onClose, onSelectAlternative }) {
  if (!currentProduct || !alternativeProduct) return null;

  const compareValue = (current, alternative, higherIsBetter = false) => {
    if (current === alternative) return 'same';
    if (higherIsBetter) {
      return alternative > current ? 'better' : 'worse';
    } else {
      return alternative < current ? 'better' : 'worse';
    }
  };

  const getComparisonIcon = (status) => {
    if (status === 'better') return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (status === 'worse') return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const getValueColor = (status) => {
    if (status === 'better') return 'text-green-600 font-bold';
    if (status === 'worse') return 'text-red-600';
    return 'text-gray-700';
  };

  const metrics = [
    { label: 'Price', currentVal: `₹${currentProduct.price}`, altVal: `₹${alternativeProduct.price}`, higherIsBetter: false },
    { label: 'Calories', currentVal: currentProduct.calories, altVal: alternativeProduct.calories, unit: ' cal', higherIsBetter: false },
    { label: 'Protein', currentVal: currentProduct.protein, altVal: alternativeProduct.protein, unit: 'g', higherIsBetter: true },
    { label: 'Fat', currentVal: currentProduct.fat, altVal: alternativeProduct.fat, unit: 'g', higherIsBetter: false },
    { label: 'Carbs', currentVal: currentProduct.carbs, altVal: alternativeProduct.carbs, unit: 'g', higherIsBetter: false },
    { label: 'Fiber', currentVal: currentProduct.fiber, altVal: alternativeProduct.fiber, unit: 'g', higherIsBetter: true },
    { label: 'Sugar', currentVal: currentProduct.sugar, altVal: alternativeProduct.sugar, unit: 'g', higherIsBetter: false },
    { label: 'Sodium', currentVal: currentProduct.sodium, altVal: alternativeProduct.sodium, unit: 'mg', higherIsBetter: false },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Package className="w-6 h-6" />
              Product Comparison
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Products Header */}
        <div className="grid grid-cols-2 gap-4 p-6 bg-gray-50 border-b">
          <div className="text-center">
            <div className="bg-purple-100 rounded-xl p-4 mb-2">
              <Package className="w-12 h-12 text-purple-500 mx-auto mb-2" />
              <h3 className="font-bold text-gray-800 text-sm">{currentProduct.name}</h3>
              <p className="text-xs text-gray-500 mt-1">{currentProduct.brand}</p>
            </div>
            <span className="text-xs text-gray-500">Current Product</span>
          </div>
          
          <div className="text-center">
            <div className="bg-green-100 rounded-xl p-4 mb-2 ring-2 ring-green-400">
              <Package className="w-12 h-12 text-green-500 mx-auto mb-2" />
              <h3 className="font-bold text-gray-800 text-sm">{alternativeProduct.name}</h3>
              <p className="text-xs text-gray-500 mt-1">{alternativeProduct.brand}</p>
            </div>
            <span className="text-xs text-green-600 font-semibold flex items-center justify-center gap-1">
              <Check className="w-4 h-4" />
              Better Choice
            </span>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="p-6">
          <div className="space-y-3">
            {metrics.map((metric, index) => {
              const status = compareValue(metric.currentVal, metric.altVal, metric.higherIsBetter);
              
              return (
                <div key={index} className="bg-gray-50 rounded-xl p-4">
                  <div className="grid grid-cols-3 gap-4 items-center">
                    {/* Current Product Value */}
                    <div className="text-center">
                      <span className="text-lg font-semibold text-gray-700">
                        {metric.currentVal}{metric.unit || ''}
                      </span>
                    </div>

                    {/* Metric Label with Icon */}
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        {getComparisonIcon(status)}
                        <span className="font-medium text-gray-600 text-sm">{metric.label}</span>
                      </div>
                    </div>

                    {/* Alternative Product Value */}
                    <div className="text-center">
                      <span className={`text-lg font-semibold ${getValueColor(status)}`}>
                        {metric.altVal}{metric.unit || ''}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Ingredients Comparison */}
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="bg-purple-50 rounded-xl p-4">
              <h4 className="font-semibold text-gray-700 mb-2 text-sm">Current Ingredients</h4>
              <div className="flex flex-wrap gap-1">
                {currentProduct.ingredients?.slice(0, 5).map((ing, idx) => (
                  <span key={idx} className="text-xs bg-purple-200 text-purple-700 px-2 py-1 rounded-full">
                    {ing}
                  </span>
                ))}
                {currentProduct.ingredients?.length > 5 && (
                  <span className="text-xs text-gray-500 px-2 py-1">
                    +{currentProduct.ingredients.length - 5} more
                  </span>
                )}
              </div>
            </div>

            <div className="bg-green-50 rounded-xl p-4">
              <h4 className="font-semibold text-gray-700 mb-2 text-sm">Alternative Ingredients</h4>
              <div className="flex flex-wrap gap-1">
                {alternativeProduct.ingredients?.slice(0, 5).map((ing, idx) => (
                  <span key={idx} className="text-xs bg-green-200 text-green-700 px-2 py-1 rounded-full">
                    {ing}
                  </span>
                ))}
                {alternativeProduct.ingredients?.length > 5 && (
                  <span className="text-xs text-gray-500 px-2 py-1">
                    +{alternativeProduct.ingredients.length - 5} more
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 bg-gray-50 rounded-b-2xl flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 rounded-xl transition"
          >
            Keep Current
          </button>
          <button
            onClick={() => onSelectAlternative(alternativeProduct)}
            className="flex-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold py-3 px-6 rounded-xl transition shadow-lg flex items-center justify-center gap-2"
          >
            <Check className="w-5 h-5" />
            Switch to Better Option
          </button>
        </div>
      </div>
    </div>
  );
}