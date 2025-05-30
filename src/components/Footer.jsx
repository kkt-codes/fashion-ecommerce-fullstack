import { Link } from "react-router-dom";

// Using react-icons (make sure it's installed: npm install react-icons)
import { FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn } from 'react-icons/fa'; 

const Footer = () => {
  const logoUrl = "/assets/logo.png";

  const companyLinks = [
    { label: "Home", path: "/" },
    { label: "Products", path: "/products" },
    { label: "About Us", path: "/about" },
    { label: "Contact Us", path: "/contact" },
  ];

  const socialLinks = [
    { label: "Facebook", icon: FaFacebookF, href: "https://facebook.com" },
    { label: "Twitter", icon: FaTwitter, href: "https://twitter.com" },
    { label: "Instagram", icon: FaInstagram, href: "https://instagram.com" },
    { label: "LinkedIn", icon: FaLinkedinIn, href: "https://linkedin.com" },
  ];

  return (
    // Changed background to bg-gray-100 and text to darker shades
    <footer className="bg-gray-100 text-gray-700 pt-12 pb-8 border-t border-gray-300">
      {/* Added max-w-7xl to align with navbar content width */}
      <div className="container mx-auto px-6 lg:px-8 max-w-7xl">
        {/* Main footer content grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-10">
          
          {/* Column 1: Logo and About */}
          <div className="md:col-span-12 lg:col-span-5">
            <Link to="/" className="inline-block mb-6">
              {/* Ensure logoUrl is correct and logo has transparent background if bg-gray-100 is used */}
              <img src={logoUrl} className="h-10 sm:h-12 w-auto" alt="Fashion Logo" />
            </Link>
            {/* Changed text color for better contrast on light background */}
            <p className="text-gray-600 text-sm leading-relaxed pr-0 lg:pr-8">
              We offer you a curated collection of stylish, high-quality clothing that blends comfort with fashion. Each piece is thoughtfully designed to elevate your wardrobe and reflect your unique sense of style. From casual essentials to statement pieces, our clothing is crafted to inspire confidence and ensure you look and feel your best every day.
            </p>
          </div>

          {/* Column 2: Company Links */}
          <div className="md:col-span-6 lg:col-span-2">
            {/* Changed title color */}
            <h3 className="text-lg font-semibold text-gray-800 mb-5 tracking-wider">COMPANY</h3>
            <ul className="space-y-3">
              {companyLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.path}
                    // Changed link color
                    className="text-gray-600 hover:text-blue-600 transition-colors duration-300 text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Get in Touch */}
          <div className="md:col-span-6 lg:col-span-3">
            {/* Changed title color */}
            <h3 className="text-lg font-semibold text-gray-800 mb-5 tracking-wider">GET IN TOUCH</h3>
            <ul className="space-y-3 text-sm">
              {/* Changed link color */}
              <li className="text-gray-600">
                <a href="tel:+120000000000" className="hover:text-blue-600 transition-colors duration-300">
                  +12-000-000-0000
                </a>
              </li>
              <li className="text-gray-600">
                <a href="mailto:support@fashion.com" className="hover:text-blue-600 transition-colors duration-300">
                  support@fashion.com
                </a>
              </li>
               <li className="text-gray-600">
                <a href="mailto:partnerships@fashion.com" className="hover:text-blue-600 transition-colors duration-300">
                  partnerships@fashion.com
                </a>
              </li>
              <li className="text-gray-600 mt-2">
                123 E-commerce Avenue, <br />
                Fashion City, FS 12345
              </li>
            </ul>
          </div>
          
          {/* Column 4: Social Media */}
          <div className="md:col-span-12 lg:col-span-2">
             {/* Changed title color */}
             <h3 className="text-lg font-semibold text-gray-800 mb-5 tracking-wider">FOLLOW US</h3>
             <div className="flex space-x-4 mb-6">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    // Changed icon color
                    className="text-gray-500 hover:text-blue-600 transition-colors duration-300"
                  >
                    <social.icon className="h-6 w-6" />
                  </a>
                ))}
             </div>
          </div>

        </div>

        {/* Bottom Bar: Copyright */}
        <div className="border-t border-gray-300 pt-8 mt-8 text-center">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Fashion. All rights reserved.
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Designed with passion.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
