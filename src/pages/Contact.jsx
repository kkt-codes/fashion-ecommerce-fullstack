import React, { useState, useEffect } from 'react';
import { EnvelopeIcon, PhoneIcon, MapPinIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

import { useAuth } from '../context/AuthContext';
import { submitContactForm } from '../services/api';

const ContactPage = () => {
  const { currentUser, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({ senderName: '', senderEmail: '', subject: '', message: '' });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated && currentUser) {
      setFormData(prev => ({
        ...prev,
        senderName: `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim(),
        senderEmail: currentUser.email || '',
      }));
    } else {
      setFormData({ senderName: '', senderEmail: '', subject: '', message: '' });
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
    if (!formData.senderName.trim()) errors.senderName = "Full name is required.";
    if (!formData.senderEmail.trim()) errors.senderEmail = "Email address is required.";
    else if (!/\S+@\S+\.\S+/.test(formData.senderEmail)) errors.senderEmail = "Invalid email format.";
    if (!formData.subject.trim()) errors.subject = "Subject is required.";
    if (!formData.message.trim() || formData.message.trim().length < 10) {
      errors.message = "Message must be at least 10 characters.";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please correct the errors in the form.");
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading("Sending your message...");

    try {
      await submitContactForm({
        senderName: formData.senderName,
        senderEmail: formData.senderEmail,
        subject: formData.subject,
        message: formData.message,
      });
      
      toast.success("Message sent successfully!", { id: toastId });
      setFormData({
        senderName: isAuthenticated && currentUser ? `${currentUser.firstName} ${currentUser.lastName}`.trim() : '',
        senderEmail: isAuthenticated && currentUser ? currentUser.email : '',
        subject: '',
        message: '',
      });
      setFormErrors({});
    } catch (error) {
      console.error("Contact form submission error:", error);
      const errMsg = error.response?.data?.message || 'Sorry, there was an error sending your message.';
      toast.error(errMsg, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="bg-gray-50 min-h-screen">
      <section 
        className="relative bg-cover bg-center py-32" 
        style={{ backgroundImage: `url('/assets/contact-us/contact-hero.jpg')` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/70 to-purple-600/70"></div>
        <div className="relative container mx-auto px-6 text-center z-10">
          <h1 className="text-5xl md:text-6xl font-bold text-white">Get In Touch</h1>
          <p className="mt-6 text-lg text-gray-100 max-w-2xl mx-auto">We're here to help! We'd love to hear from you.</p>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12">
            
            <div className="lg:col-span-7 bg-white p-10 rounded-xl shadow-xl">
              <h2 className="text-3xl font-bold text-gray-800 mb-8">Send Us a Message</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="senderName" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input type="text" name="senderName" id="senderName" value={formData.senderName} onChange={handleChange} required className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 ${formErrors.senderName ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`} placeholder="John Doe" />
                  {formErrors.senderName && <p className="text-xs text-red-600 mt-1">{formErrors.senderName}</p>}
                </div>
                <div>
                  <label htmlFor="senderEmail" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <input type="email" name="senderEmail" id="senderEmail" value={formData.senderEmail} onChange={handleChange} required className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 ${formErrors.senderEmail ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`} placeholder="you@example.com" />
                  {formErrors.senderEmail && <p className="text-xs text-red-600 mt-1">{formErrors.senderEmail}</p>}
                </div>
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <input type="text" name="subject" id="subject" value={formData.subject} onChange={handleChange} required className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 ${formErrors.subject ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`} placeholder="Question about an order" />
                  {formErrors.subject && <p className="text-xs text-red-600 mt-1">{formErrors.subject}</p>}
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                  <textarea name="message" id="message" rows="5" value={formData.message} onChange={handleChange} required className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 ${formErrors.message ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`} placeholder="Your message here..."></textarea>
                  {formErrors.message && <p className="text-xs text-red-600 mt-1">{formErrors.message}</p>}
                </div>
                <div>
                  <button type="submit" disabled={isSubmitting} className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-70">
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                  </button>
                </div>
              </form>
            </div>

            <div className="lg:col-span-5">
              <div className="bg-white p-10 rounded-xl shadow-xl h-full">
                <h2 className="text-3xl font-bold text-gray-800 mb-8">Contact Information</h2>
                <div className="space-y-6">
                  <div className="flex items-start"><MapPinIcon className="h-7 w-7 text-blue-600 mr-4 mt-1" /><div><h3 className="text-lg font-semibold">Our Address</h3><p className="text-gray-600 text-sm">123 E-commerce Avenue, Fashion City, FS 12345</p></div></div>
                  <div className="flex items-start"><EnvelopeIcon className="h-7 w-7 text-blue-600 mr-4 mt-1" /><div><h3 className="text-lg font-semibold">Email Us</h3><a href="mailto:support@fashion.com" className="text-blue-600 hover:underline text-sm">support@fashion.com</a></div></div>
                  <div className="flex items-start"><PhoneIcon className="h-7 w-7 text-blue-600 mr-4 mt-1" /><div><h3 className="text-lg font-semibold">Call Us</h3><a href="tel:+1234567890" className="text-blue-600 hover:underline text-sm">+1 (234) 567-890</a></div></div>
                </div>
                <div className="mt-8 pt-8 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Find Us Here</h3>
                  <img 
                      src="/assets/contact-us/map-placeholder.jpg" 
                      alt="A person cheerfully assisting a customer on the phone" 
                      className="w-full h-auto object-cover rounded-lg shadow-md"
                  />
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactPage;