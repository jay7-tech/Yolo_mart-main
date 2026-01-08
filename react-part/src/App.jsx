import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Preferences from './components/Preferences';
import Categories from './components/Categories';
import ProductList from './components/ProductList';
import ProductDetails from './components/ProductDetails';
import Cart from './components/Cart';
import CameraScanner from './components/CameraScanner';
import CameraButton from './components/CameraButton';
import ChatWidget from './components/ChatWidget';
import RFIDListener from './components/RFIDListener';

function App() {
  return (
    <Router>

      {/* 🔵 Camera Scanner must be OUTSIDE Routes so it can open on any page */}
      <CameraScanner openOnClickSelector="#camera-icon" />
      <CameraButton />
      <ChatWidget />

      <RFIDListener />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/preferences" element={<Preferences />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/products/:category" element={<ProductList />} />
        <Route path="/product/:id" element={<ProductDetails />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;