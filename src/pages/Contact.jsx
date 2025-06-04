import React, { useState, useEffect } from 'react';
import { EnvelopeIcon, PhoneIcon, MapPinIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import apiClient from '../services/api';
import { useAuthContext } from '../context/AuthContext'; // To prefill email if user is logged in
import toast from 'react-hot-toast';

const ContactPage = () => {
  const heroImageUrl = '/assets/contact-us/contact-hero.jpg';
  const mapImageUrl = '/assets/contact-us/map-placeholder.jpg';

  const { currentUser, isAuthenticated } = useAuthContext();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState({ message: '', type: '' }); // type: 'success' or 'error'

  // Pre-fill name and email if user is authenticated
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      setFormData(prev => ({
        ...prev,
        name: `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim(), // Handle potential null names
        email: currentUser.email || '',
      }));
    } else {
      // If user logs out, reset to initial state if form shouldn't retain old prefill
      setFormData({ name: '', email: '', subject: '', message: '' });
    }
  }, [isAuthenticated, currentUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = "Full name is required.";
    if (!formData.email.trim()) errors.email = "Email address is required.";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = "Invalid email format.";
    if (!formData.subject.trim()) errors.subject = "Subject is required.";
    if (!formData.message.trim()) errors.message = "Message is required.";
    else if (formData.message.trim().length < 10) errors.message = "Message must be at least 10 characters.";
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitStatus({ message: '', type: '' });
    if (!validateForm()) {
        toast.error("Please correct the errors in the form.");
        return;
    }

    setIsSubmitting(true);

    try {
      // Backend /api/contact expects ContactMessage object
      // { name, email, subject, message }
      await apiClient.post('/contact', formData); 
      
      setSubmitStatus({ message: 'Thank you! Your message has been sent successfully.', type: 'success' });
      toast.success("Message sent successfully!");
      setFormData({ // Reset form
        name: (isAuthenticated && currentUser) ? `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() : '',
        email: (isAuthenticated && currentUser) ? currentUser.email || '' : '',
        subject: '',
        message: '',
      });
      setFormErrors({});
    } catch (error) {
      console.error("Contact form submission error:", error.response?.data || error.message);
      const errMsg = error.response?.data?.message || 'Sorry, there was an error sending your message. Please try again later.';
      setSubmitStatus({ message: errMsg, type: 'error' });
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Spinner SVG for the submit button
  const spinner = (
    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero Section */}
      <section 
        className="relative bg-cover bg-center py-24 sm:py-32 md:py-40" 
        style={{ backgroundImage: `url(${heroImageUrl})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/70 to-purple-600/70"></div>
        <div className="relative container mx-auto px-6 lg:px-8 text-center z-10">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight">
            Get In Touch
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-gray-100 max-w-2xl mx-auto">
            We're here to help! Whether you have a question about our products, an order, or just want to say hello, we'd love to hear from you.
          </p>
        </div>
      </section>

      {/* Contact Form and Info Section */}
      <section className="py-16 sm:py-20">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12">
            
            <div className="lg:col-span-7 bg-white p-8 sm:p-10 rounded-xl shadow-xl">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-8">Send Us a Message</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input 
                    type="text" name="name" id="name" value={formData.name}
                    onChange={handleChange} required 
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:border-transparent outline-none ${formErrors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`} 
                    placeholder="John Doe"
                  />
                  {formErrors.name && <p className="text-xs text-red-600 mt-1">{formErrors.name}</p>}
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <input 
                    type="email" name="email" id="email" value={formData.email}
                    onChange={handleChange} required 
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:border-transparent outline-none ${formErrors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`} 
                    placeholder="you@example.com"
                  />
                  {formErrors.email && <p className="text-xs text-red-600 mt-1">{formErrors.email}</p>}
                </div>
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <input 
                    type="text" name="subject" id="subject" value={formData.subject}
                    onChange={handleChange} required 
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:border-transparent outline-none ${formErrors.subject ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`} 
                    placeholder="Question about an order"
                  />
                  {formErrors.subject && <p className="text-xs text-red-600 mt-1">{formErrors.subject}</p>}
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                  <textarea 
                    name="message" id="message" rows="5" value={formData.message}
                    onChange={handleChange} required 
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:border-transparent outline-none ${formErrors.message ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`} 
                    placeholder="Your message here..."
                  ></textarea> {/* Closing textarea tag was missing */}
                  {formErrors.message && <p className="text-xs text-red-600 mt-1">{formErrors.message}</p>}
                </div>
                <div>
                  <button 
                    type="submit" disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? ( 
                        <>
                          {spinner}
                          Sending...
                        </> 
                    ) : ( 
                        <>
                          <PaperAirplaneIcon className="h-5 w-5 mr-1" /> Send Message
                        </> 
                    )}
                  </button>
                </div>
                {submitStatus.message && (
                  <p className={`mt-4 text-sm text-center ${submitStatus.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
                    {submitStatus.message}
                  </p>
                )}
              </form> {/* Closing form tag */}
            </div> {/* Closing lg:col-span-7 div */}

            {/* Contact Info & Map (Static part) */}
            <div className="lg:col-span-5">
              <div className="bg-white p-8 sm:p-10 rounded-xl shadow-xl h-full">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-8">Contact Information</h2>
                <div className="space-y-6">
                  <div className="flex items-start">
                    <MapPinIcon className="h-7 w-7 text-blue-600 mr-4 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-700">Our Address</h3>
                      <p className="text-gray-600 text-sm">
                        123 E-commerce Avenue, Fashion City, FS 12345, Neptune
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <EnvelopeIcon className="h-7 w-7 text-blue-600 mr-4 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-700">Email Us</h3>
                      <a href="mailto:support@fashion.com" className="text-blue-600 hover:text-blue-700 text-sm transition-colors">
                        support@fashion.com
                      </a>
                      <br/>
                      <a href="mailto:partnerships@fashion.com" className="text-blue-600 hover:text-blue-700 text-sm transition-colors">
                        partnerships@fashion.com
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <PhoneIcon className="h-7 w-7 text-blue-600 mr-4 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-700">Call Us</h3>
                      <a href="tel:+120000000000" className="text-blue-600 hover:text-blue-700 text-sm transition-colors">
                        +12-000-000-0000
                      </a>
                    </div>
                  </div>
                </div>
                
                <div className="mt-10">
                  <h3 className="text-lg font-semibold text-gray-700 mb-3">Find Us Here</h3>
                  <img 
                    src={mapImageUrl} 
                    alt="Location Map Placeholder" 
                    className="w-full h-56 object-cover rounded-lg shadow-md"
                  />
                </div>
              </div> {/* Closing inner div for contact info */}
            </div> {/* Closing lg:col-span-5 div */}
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactPage;
