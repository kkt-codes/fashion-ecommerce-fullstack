import React from 'react';
import { Link } from 'react-router-dom';
import { SparklesIcon, ShieldCheckIcon, HeartIcon, UserGroupIcon, LightBulbIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';

const AboutPage = () => {
  const heroImageUrl = '/assets/about-us/about-hero.jpg';
  const storyImageUrl = '/assets/about-us/about-story.jpg';

  const commitments = [
    {
      icon: SparklesIcon,
      title: 'Quality Craftsmanship',
      description: 'Every piece in our collection is crafted with attention to detail and made from high-quality materials to ensure longevity and comfort.',
    },
    {
      icon: HeartIcon,
      title: 'Passion for Style',
      description: 'We are passionate about fashion and dedicated to bringing you the latest trends and timeless classics that make you feel confident.',
    },
    {
      icon: ShieldCheckIcon,
      title: 'Customer Satisfaction',
      description: 'Your happiness is our priority. We strive to provide an exceptional shopping experience from browsing to delivery.',
    },
     {
      icon: LightBulbIcon,
      title: 'Ethical Sourcing',
      description: 'We are committed to responsible sourcing and partnering with suppliers who share our values for ethical production.',
    },
  ];

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero Section */}
      <section 
        className="relative bg-cover bg-center py-24 sm:py-32 md:py-40" 
        style={{ backgroundImage: `url(${heroImageUrl})` }}
      >
        <div className="absolute inset-0 bg-black/50"></div> {/* Dark overlay */}
        <div className="relative container mx-auto px-6 lg:px-8 text-center z-10">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight">
            About <span className="text-blue-400">FASHION</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-gray-200 max-w-2xl mx-auto">
            Discover the passion, quality, and style that define us. We're more than just a store; we're a fashion destination.
          </p>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="prose prose-lg text-gray-700 max-w-none"> {/* prose classes for nice typography */}
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-6 flex items-center">
                <UserGroupIcon className="h-10 w-10 text-blue-600 mr-3" />
                Our Story
              </h2>
              <p>
                Founded with a love for fashion and a desire to make style accessible, FASHION started as a small dream. We envisioned a place where everyone could find pieces that not only look great but also feel amazing to wear. Our journey has been fueled by the belief that clothing is a powerful form of self-expression.
              </p>
              <p>
                We meticulously curate our collections, focusing on quality materials, contemporary designs, and a perfect fit. From everyday essentials to standout pieces for special occasions, our goal is to provide a versatile wardrobe that empowers you to express your unique identity with confidence and flair.
              </p>
              <p>
                Thank you for being a part of our story. We're excited to continue growing and bringing you the best in fashion.
              </p>
            </div>
            <div className="mt-8 md:mt-0">
              <img 
                src={storyImageUrl} 
                alt="Our Fashion Story" 
                className="rounded-xl shadow-2xl object-cover w-full h-auto max-h-[500px]" 
              />
            </div>
          </div>
        </div>
      </section>

      {/* Our Commitment Section */}
      <section className="py-16 sm:py-20 bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-800">Our Commitment to You</h2>
            <p className="mt-3 text-lg text-gray-600 max-w-xl mx-auto">
              We believe in providing more than just clothes. We're committed to values that make a difference.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {commitments.map((item) => (
              <div key={item.title} className="bg-white p-8 rounded-xl shadow-lg text-center hover:shadow-xl transition-shadow duration-300">
                <item.icon className="h-12 w-12 text-blue-600 mx-auto mb-5" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-16 sm:py-20 bg-blue-600 text-white">
        <div className="container mx-auto px-6 lg:px-8 text-center">
          <ShoppingBagIcon className="h-16 w-16 mx-auto mb-4 "/>
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">Ready to Elevate Your Style?</h2>
          <p className="text-lg text-blue-100 mb-8 max-w-xl mx-auto">
            Explore our latest collections and find your new favorite pieces today.
          </p>
          <Link
            to="/products"
            className="inline-block bg-white text-blue-600 font-semibold px-10 py-4 rounded-lg shadow-md hover:bg-gray-100 transition-colors duration-300 text-lg"
          >
            Shop All Products
          </Link>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;

