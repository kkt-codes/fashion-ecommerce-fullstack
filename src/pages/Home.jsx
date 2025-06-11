import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRightIcon,
  ShoppingCartIcon,
  TagIcon,
  ShieldCheckIcon,
  TruckIcon,
  ChatBubbleLeftEllipsisIcon,
  GiftIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

import ProductCard from '../components/ProductCard';
import { getProducts } from '../services/api';

// Component for rendering product sections (Featured, New Arrivals)
const ProductShowcase = ({ title, products, isLoading, error }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="border border-gray-200 rounded-lg p-4 bg-white animate-pulse">
            <div className="bg-gray-300 h-48 rounded-md mb-4"></div>
            <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 bg-red-50 p-4 rounded-lg">
        <ExclamationTriangleIcon className="h-12 w-12 text-red-400 mx-auto mb-2" />
        <p className="text-red-600 font-semibold">Could not load {title.toLowerCase()}.</p>
      </div>
    );
  }

  if (products.length === 0) {
      return <p className="text-center text-gray-500 py-8">No {title.toLowerCase()} to display right now.</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
};


export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Static data for categories and highlights
  const categories = [
    { name: "Dresses", image: "/assets/categories/dress.jpg", path: "/products?category=Dress" },
    { name: "Jackets", image: "/assets/categories/jacket.jpg", path: "/products?category=Jacket" },
    { name: "Kids", image: "/assets/categories/kids.jpg", path: "/products?category=Kids" },
    { name: "Shirts", image: "/assets/categories/shirt.jpg", path: "/products?category=Shirt" },
    { name: "T-Shirts", image: "/assets/categories/tshirt.jpg", path: "/products?category=T-shirt" },
    { name: "Trousers", image: "/assets/categories/trouser.jpg", path: "/products?category=Trouser" },
  ];

  const brandHighlights = [
    { icon: TruckIcon, title: "Fast Shipping", description: "Get your orders delivered swiftly." },
    { icon: ShieldCheckIcon, title: "Secure Payments", description: "Shop with confidence and security." },
    { icon: GiftIcon, title: "Exclusive Offers", description: "Unlock special discounts and deals." },
    { icon: ChatBubbleLeftEllipsisIcon, title: "24/7 Support", description: "Our team is here to help you." }
  ];

  // Fetch all necessary data for the homepage concurrently
  const fetchHomePageData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [featuredResponse, newArrivalsResponse] = await Promise.all([
        getProducts({ page: 0, size: 4, sortBy: 'averageRating', sortDir: 'DESC' }),
        getProducts({ page: 0, size: 4, sortBy: 'id', sortDir: 'DESC' })
      ]);
      setFeaturedProducts(featuredResponse.data?.content || []);
      setNewArrivals(newArrivalsResponse.data?.content || []);
    } catch (err) {
      console.error("Home.jsx: Failed to fetch homepage data:", err);
      setError("Could not load products at this time. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  useEffect(() => {
    fetchHomePageData();
  }, [fetchHomePageData]);


  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero Section */}
      <section className="relative w-full h-[calc(100vh-80px)] bg-center bg-cover flex items-center justify-center text-white" style={{ backgroundImage: "url('/assets/hero-banner.jpg')" }}>
        <div className="bg-black/60 absolute inset-0"></div>
        <div className="relative z-10 text-center p-4">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 drop-shadow-lg">Discover Your Style</h1>
          <p className="text-xl mb-8 max-w-2xl mx-auto">Shop the latest trends in fashion. Unbeatable quality at prices you'll love.</p>
          <Link to="/products" className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg text-white font-semibold text-lg inline-flex items-center gap-2 shadow-xl hover:shadow-2xl transform hover:scale-105">
            Shop Now <ArrowRightIcon className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-800">Shop by Category</h2>
            <p className="mt-3 text-lg text-gray-600">Explore our curated collections.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
            {categories.map((category) => (
              <Link key={category.name} to={category.path} className="relative group block aspect-w-1 aspect-h-1 overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300">
                <img src={category.image} alt={category.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-center justify-end p-4 text-center flex-col">
                  <h3 className="text-white text-lg font-semibold drop-shadow-md">{category.name}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* New Arrivals Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12"><h2 className="text-4xl font-bold text-gray-800">New Arrivals</h2><p className="mt-3 text-lg text-gray-600">Check out the freshest styles added to our store.</p></div>
          <ProductShowcase title="New Arrivals" products={newArrivals} isLoading={isLoading} error={error} />
          <div className="text-center mt-12"><Link to="/products?sort=id-desc" className="px-6 py-3 border-2 border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-600 hover:text-white transition-colors">View All New Products <ArrowRightIcon className="h-5 w-5 inline-block" /></Link></div>
        </div>
      </section>
      
      {/* Featured Products Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12"><h2 className="text-4xl font-bold text-gray-800">Featured Products</h2><p className="mt-3 text-lg text-gray-600">Handpicked selections with top reviews.</p></div>
          <ProductShowcase title="Featured Products" products={featuredProducts} isLoading={isLoading} error={error} />
           <div className="text-center mt-12"><Link to="/products?sort=averageRating-desc" className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 shadow-lg inline-flex items-center gap-2">Explore All Products <ShoppingCartIcon className="h-5 w-5" /></Link></div>
        </div>
      </section>

      {/* Brand Highlights Section */}
      <section className="py-16 bg-gradient-to-br from-purple-600 to-blue-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12"><h2 className="text-4xl font-bold">Why Choose Us?</h2><p className="mt-3 text-lg text-blue-100">Our commitment to quality and service.</p></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {brandHighlights.map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex flex-col items-center text-center p-6 bg-white/10 hover:bg-white/20 rounded-xl shadow-lg transition-all transform hover:scale-105">
                <Icon className="h-12 w-12 text-yellow-400 mb-4" />
                <h3 className="text-xl font-semibold mb-2">{title}</h3>
                <p className="text-sm text-blue-50">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}