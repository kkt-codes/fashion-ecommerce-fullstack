import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import toast from 'react-hot-toast';
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

const API_BASE_URL = 'http://localhost:8080/api';

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  
  const [isLoadingFeatured, setIsLoadingFeatured] = useState(true);
  const [featuredError, setFeaturedError] = useState(null);
  const [isLoadingNewArrivals, setIsLoadingNewArrivals] = useState(true);
  const [newArrivalsError, setNewArrivalsError] = useState(null);

  // Static categories data
  const categories = [
    { name: "Dress", image: "/assets/categories/dress.jpg", description: "Elegant & Stylish Dresses" },
    { name: "Jacket", image: "/assets/categories/jacket.jpg", description: "Warm & Trendy Jackets" },
    { name: "Kids", image: "/assets/categories/kids.jpg", description: "Fun & Comfy Kids Wear" },
    { name: "Shirt", image: "/assets/categories/shirt.jpg", description: "Smart & Casual Shirts" },
    { name: "T-shirt", image: "/assets/categories/tshirt.jpg", description: "Cool & Everyday T-shirts" },
    { name: "Trouser", image: "/assets/categories/trouser.jpg", description: "Comfortable & Chic Trousers" },
  ];

  const brandHighlights = [
    { icon: TruckIcon, title: "Fast Shipping", description: "Get your orders delivered swiftly to your doorstep." },
    { icon: ShieldCheckIcon, title: "Secure Payments", description: "Shop with confidence using our secure payment gateways." },
    { icon: GiftIcon, title: "Exclusive Offers", description: "Unlock special discounts and deals for members." },
    { icon: ChatBubbleLeftEllipsisIcon, title: "24/7 Support", description: "Our team is here to help you around the clock." }
  ];

  const fetchNewArrivals = useCallback(async () => {
    setIsLoadingNewArrivals(true);
    setNewArrivalsError(null);
    try {
      // Fetch products sorted by ID descending (proxy for newness)
      // Adjust sortBy if you have a 'createdAt' field for products
      const response = await fetch(`${API_BASE_URL}/products?page=0&size=4&sortBy=id&sortDir=DESC`);
      if (!response.ok) {
        const errData = await response.json().catch(() => ({ message: "Failed to load new arrivals."}));
        throw new Error(errData.message);
      }
      const data = await response.json(); // Page<ProductDto>
      setNewArrivals(data.content || []);
    } catch (error) {
      console.error("Home.jsx: Failed to fetch new arrivals:", error);
      setNewArrivalsError(error.message);
      setNewArrivals([]);
      // toast.error("Could not load new arrivals."); // Optional: can be noisy
    } finally {
      setIsLoadingNewArrivals(false);
    }
  }, []);

  const fetchFeaturedProducts = useCallback(async () => {
    setIsLoadingFeatured(true);
    setFeaturedError(null);
    try {
      // Fetch products sorted by averageRating descending
      const response = await fetch(`${API_BASE_URL}/products?page=0&size=4&sortBy=averageRating&sortDir=DESC&minRating=3`); // e.g. minRating 3
      if (!response.ok) {
        const errData = await response.json().catch(() => ({ message: "Failed to load featured products."}));
        throw new Error(errData.message);
      }
      const data = await response.json(); // Page<ProductDto>
      setFeaturedProducts(data.content || []);
    } catch (error) {
      console.error("Home.jsx: Failed to fetch featured products:", error);
      setFeaturedError(error.message);
      setFeaturedProducts([]);
      // toast.error("Could not load featured products."); // Optional
    } finally {
      setIsLoadingFeatured(false);
    }
  }, []);

  useEffect(() => {
    fetchNewArrivals();
    fetchFeaturedProducts();
  }, [fetchNewArrivals, fetchFeaturedProducts]);


  const renderProductSection = (title, products, isLoading, error, linkTo, linkText, sectionType) => {
    if (isLoading) {
      return (
        <div className="text-center py-8">
          <svg className="animate-spin h-8 w-8 text-blue-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-500 mt-2">Loading {title.toLowerCase()}...</p>
        </div>
      );
    }
    if (error) {
        return (
            <div className="text-center py-8 bg-red-50 p-4 rounded-lg">
                <ExclamationTriangleIcon className="h-12 w-12 text-red-400 mx-auto mb-2" />
                <p className="text-red-600 font-semibold">Could not load {title.toLowerCase()}.</p>
                <p className="text-red-500 text-sm">{error}</p>
                <button 
                    onClick={sectionType === 'new-arrivals' ? fetchNewArrivals : fetchFeaturedProducts}
                    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                >
                    Try Again
                </button>
            </div>
        );
    }
    if (!products.length) {
      return <p className="text-center text-gray-500 py-8">No {title.toLowerCase()} to display at the moment.</p>;
    }

    return (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {products.map((product) => ( // product is ProductDto
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        <div className="text-center mt-10 sm:mt-12">
          <Link
            to={linkTo}
            className={`px-6 py-3 border-2 border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-600 hover:text-white transition-colors duration-300 inline-flex items-center gap-2 ${sectionType === "featured" ? "bg-blue-600 text-white hover:bg-blue-700 hover:border-blue-700 shadow-lg hover:shadow-xl" : ""}`}
          >
            {linkText} {sectionType === "featured" ? <ShoppingCartIcon className="h-5 w-5" /> : <ArrowRightIcon className="h-5 w-5" />}
          </Link>
        </div>
      </>
    );
  };


  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero Section */}
      <section 
        className="relative w-full h-[calc(100vh-80px)] sm:h-[450px] md:h-[550px] bg-center bg-cover flex items-center justify-center text-white" 
        style={{ backgroundImage: "url('/assets/hero-banner.jpg')" }}
      >
        <div className="bg-black/60 absolute inset-0"></div>
        <div className="relative z-10 text-center p-4">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 drop-shadow-lg">Discover Your Style</h1>
          <p className="text-lg sm:text-xl mb-8 max-w-2xl mx-auto drop-shadow-md">
            Shop the latest trends in fashion. Unbeatable quality at prices you'll love.
          </p>
          <Link 
            to="/products" 
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300 ease-in-out rounded-lg text-white font-semibold text-lg inline-flex items-center gap-2 shadow-xl hover:shadow-2xl transform hover:scale-105"
          >
            Shop Now <ArrowRightIcon className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-800">Shop by Category</h2>
            <p className="mt-3 text-lg text-gray-600">Explore our curated collections.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
            {categories.map((category) => (
              <Link
                key={category.name}
                to={`/products?category=${encodeURIComponent(category.name)}`}
                className="relative group block aspect-square sm:aspect-[4/5] overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <img 
                  src={category.image || '/assets/placeholder.png'} 
                  alt={category.name} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex flex-col items-center justify-end p-3 sm:p-4 text-center">
                  <h3 className="text-white text-md sm:text-lg font-semibold drop-shadow-md">{category.name}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* New Arrivals Section */}
      <section className="py-12 sm:py-16 bg-gray-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-800">New Arrivals</h2>
            <p className="mt-3 text-lg text-gray-600">Check out the freshest styles added to our store.</p>
          </div>
          {renderProductSection(
            "New Arrivals", 
            newArrivals, 
            isLoadingNewArrivals,
            newArrivalsError,
            "/products?sortBy=id&sortDir=DESC", // Link to all new products
            "View All New Products",
            "new-arrivals"
          )}
        </div>
      </section>
      
      {/* Featured Products Section */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-800">Featured Products</h2>
            <p className="mt-3 text-lg text-gray-600">Handpicked selections with top reviews.</p>
          </div>
          {renderProductSection(
            "Featured Products",
            featuredProducts,
            isLoadingFeatured,
            featuredError,
            "/products?sortBy=averageRating&sortDir=DESC", // Link to top-rated products
            "Explore All Products",
            "featured"
          )}
        </div>
      </section>

      {/* Brand Highlights Section */}
      <section className="py-12 sm:py-16 bg-gradient-to-br from-purple-600 to-blue-700 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold">Why Choose Us?</h2>
            <p className="mt-3 text-lg text-blue-100">Experience the difference with our commitment to quality and service.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {brandHighlights.map((highlight) => (
              <div key={highlight.title} className="flex flex-col items-center text-center p-6 bg-white/10 hover:bg-white/20 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105">
                <highlight.icon className="h-12 w-12 text-yellow-400 mb-4" />
                <h3 className="text-xl font-semibold mb-2">{highlight.title}</h3>
                <p className="text-sm text-blue-50">{highlight.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Simple Call to Action (Newsletter) */}
      <section className="py-12 sm:py-16 bg-gray-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <TagIcon className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-3">Stay Updated!</h2>
          <p className="text-gray-600 mb-6 max-w-xl mx-auto">
            Subscribe to our newsletter for the latest collections, sales, and style tips.
          </p>
          <form className="max-w-md mx-auto flex flex-col sm:flex-row gap-3">
            <input 
              type="email" 
              placeholder="Enter your email address" 
              className="flex-grow p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" 
              required 
            />
            <button 
              type="submit" 
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-300"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
