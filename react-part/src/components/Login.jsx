import React, { useState } from 'react';
import { Phone, ArrowRight, ShoppingCart } from 'lucide-react';

export default function SupermarketAuth() {
  const [step, setStep] = useState('phone'); // 'phone' or 'otp'
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePhoneSubmit = async () => {
    setError('');
    setLoading(true);

    // Validate phone number (10 digits)
    if (phone.length !== 10 || !/^\d+$/.test(phone)) {
      setError('Please enter a valid 10-digit phone number');
      setLoading(false);
      return;
    }

    try {
      console.log('Sending OTP request to backend...');
      // Call backend to send OTP via Twilio
      const response = await fetch('http://localhost:3001/api/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone }),
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (data.success) {
        alert('OTP sent successfully! Check your phone.');
        setStep('otp');
      } else {
        setError(data.message || 'Failed to send OTP');
      }
    } catch (err) {
      console.error('Error sending OTP:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async () => {
    setError('');

    if (otp.length !== 6) {
      setError('Please enter a 6-digit OTP');
      return;
    }

    try {
      // Call backend to verify OTP
      const response = await fetch('http://localhost:3001/api/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone, otp }),
      });

      const data = await response.json();

      if (data.success) {
          localStorage.setItem('authenticated', 'true');
          localStorage.setItem('phone', phone);
          window.location.href = '/preferences'; // Navigate to preferences
      } else {
        setError(data.message || 'Invalid OTP');
      }
    } catch (err) {
      console.error('Error verifying OTP:', err);
      setError('Network error. Please try again.');
    }
  };

  const handleOtpChange = (value) => {
    // Only allow digits and max 6 characters
    if (/^\d*$/.test(value) && value.length <= 6) {
      setOtp(value);
    }
  };

  const handlePhoneChange = (value) => {
    // Only allow digits and max 10 characters
    if (/^\d*$/.test(value) && value.length <= 10) {
      setPhone(value);
    }
  };

  const handlePhoneKeyPress = (e) => {
    if (e.key === 'Enter') {
      handlePhoneSubmit();
    }
  };

  const handleOtpKeyPress = (e) => {
    if (e.key === 'Enter' && otp.length === 6) {
      handleOtpSubmit();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 rounded-full mb-4">
            <ShoppingCart className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Yolomart</h1>
          <p className="text-gray-600">
            {step === 'phone' ? 'Enter your phone number to continue' : 'Enter the OTP sent to your phone'}
          </p>
        </div>

        {/* Phone Number Step */}
        {step === 'phone' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  onKeyPress={handlePhoneKeyPress}
                  placeholder="Enter 10-digit number"
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none transition-colors text-lg"
                  autoFocus
                />
              </div>
              {error && (
                <p className="mt-2 text-sm text-red-600">{error}</p>
              )}
            </div>

            <button
              onClick={handlePhoneSubmit}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              Send OTP
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* OTP Verification Step */}
        {step === 'otp' && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Enter OTP
                </label>
                <button
                  onClick={() => {
                    setStep('phone');
                    setOtp('');
                    setError('');
                  }}
                  className="text-sm text-green-600 hover:text-green-700"
                >
                  Change number
                </button>
              </div>
              <input
                type="text"
                value={otp}
                onChange={(e) => handleOtpChange(e.target.value)}
                onKeyPress={handleOtpKeyPress}
                placeholder="Enter 6-digit OTP"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none transition-colors text-lg text-center tracking-widest"
                autoFocus
              />
              <p className="mt-2 text-sm text-gray-600">
                OTP sent to +91 {phone}
              </p>
              {error && (
                <p className="mt-2 text-sm text-red-600">{error}</p>
              )}
            </div>

            <button
              onClick={handleOtpSubmit}
              disabled={otp.length !== 6}
              className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              Verify & Continue
              <ArrowRight className="w-5 h-5" />
            </button>

            <button
              onClick={handlePhoneSubmit}
              className="w-full text-green-600 hover:text-green-700 font-medium text-sm"
            >
              Resend OTP
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-gray-500">
          By continuing, you agree to our Terms & Conditions
        </div>
      </div>
    </div>
  );
}