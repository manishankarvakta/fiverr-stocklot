import { Award, Clock, Mail, Shield } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import SuggestButton from '../suggestions/SuggestButton';
export default function Footer() {
  const [socialSettings, setSocialSettings] = useState({
    facebookUrl: '',
    twitterUrl: '',
    instagramUrl: '',
    youtubeUrl: '',
    linkedinUrl: ''
  });

  // Load social media settings from admin configuration
  useEffect(() => {
    const loadSocialSettings = async () => {
      try {
        const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
        const response = await fetch(`${backendUrl}/api/platform/config`);
        
        // Check if response is OK and content-type is JSON
        const contentType = response.headers.get('content-type');
        const isJson = contentType && contentType.includes('application/json');
        
        if (response.ok && isJson) {
          const config = await response.json();
          const settings = config.settings || {};
          const socialMedia = settings.social_media || {};
          console.log('Loaded social settings:', socialMedia);
          setSocialSettings({
            facebookUrl: socialMedia.facebook || socialMedia.facebook_url || 'https://facebook.com/stocklot',
            twitterUrl: socialMedia.twitter || socialMedia.x_url || 'https://x.com/stocklotmarket',
            instagramUrl: socialMedia.instagram || socialMedia.instagram_url || 'https://instagram.com/stocklot',
            youtubeUrl: socialMedia.youtube || socialMedia.youtube_url || 'https://www.youtube.com/@stocklotmarket',
            linkedinUrl: socialMedia.linkedin || socialMedia.linkedin_url || 'https://www.linkedin.com/company/stocklotmarket'
          });
        } else {
          // Set fallback social media URLs if endpoint doesn't exist or returns non-JSON
          setSocialSettings({
            facebookUrl: 'https://facebook.com/stocklot',
            twitterUrl: 'https://x.com/stocklotmarket',
            instagramUrl: 'https://instagram.com/stocklot',
            youtubeUrl: 'https://www.youtube.com/@stocklotmarket',
            linkedinUrl: 'https://www.linkedin.com/company/stocklotmarket'
          });
        }
      } catch (error) {
        console.error('Failed to load social settings:', error);
        // Set fallback social media URLs on error
        setSocialSettings({
          facebookUrl: 'https://facebook.com/stocklot',
          twitterUrl: 'https://x.com/stocklotmarket',
          instagramUrl: 'https://instagram.com/stocklot',
          youtubeUrl: 'https://www.youtube.com/@stocklotmarket',
          linkedinUrl: 'https://www.linkedin.com/company/stocklotmarket'
        });
      }
    };
    
    loadSocialSettings();
  }, []);

  return (
    <footer className="bg-emerald-900 p-6 pt-8 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-lg font-bold">🐄</span>
              </div>
              <h3 className="text-xl font-bold text-emerald-100">StockLot</h3>
            </div>
            <p className="text-emerald-200 text-sm leading-relaxed">
              South Africa's premier livestock marketplace, connecting farmers and buyers nationwide with secure escrow payments and comprehensive animal taxonomy.
            </p>
            
            {/* Social Media Buttons */}
            <div className="flex space-x-2">
              
              {socialSettings.facebookUrl && (
                <a 
                  href={socialSettings.facebookUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-1.5 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                  title="Follow us on Facebook"
                >
                  <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
              )}
              
              {socialSettings.twitterUrl && (
                <a 
                  href={socialSettings.twitterUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-1.5 bg-black hover:bg-gray-800 rounded-md transition-colors"
                  title="Follow us on X/Twitter"
                >
                  <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
              )}
              
              {socialSettings.instagramUrl && (
                <a 
                  href={socialSettings.instagramUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-1.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-md transition-colors"
                  title="Follow us on Instagram"
                >
                  <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
              )}
              
              {socialSettings.youtubeUrl && (
                <a 
                  href={socialSettings.youtubeUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-1.5 bg-red-600 hover:bg-red-700 rounded-md transition-colors"
                  title="Subscribe to our YouTube channel"
                >
                  <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </a>
              )}
              
              {socialSettings.linkedinUrl && (
                <a 
                  href={socialSettings.linkedinUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-1.5 bg-blue-700 hover:bg-blue-800 rounded-md transition-colors"
                  title="Connect with us on LinkedIn"
                >
                  <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
              )}
              
              {/* Show email as fallback if no social media is configured */}
              {!socialSettings.facebookUrl && !socialSettings.twitterUrl && !socialSettings.instagramUrl && !socialSettings.youtubeUrl && !socialSettings.linkedinUrl && (
                <a 
                  href="mailto:hello@stocklot.farm"
                  className="p-1.5 bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors"
                  title="Email us"
                >
                  <Mail className="h-4 w-4 text-white" />
                </a>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-semibold text-emerald-100 text-lg">Quick Links</h4>
            <div className="flex flex-col space-y-2 text-sm">
              <Link to="/marketplace" className="text-emerald-200 hover:text-emerald-100 transition-colors">Browse Animals</Link>
              <Link to="/how-it-works" className="text-emerald-200 hover:text-emerald-100 transition-colors">How It Works</Link>
              <Link to="/about" className="text-emerald-200 hover:text-emerald-100 transition-colors">About Us</Link>
              <Link to="/pricing" className="text-emerald-200 hover:text-emerald-100 transition-colors">Pricing</Link>
              <Link to="/blog" className="text-emerald-200 hover:text-emerald-100 transition-colors">Blog</Link>
              <Link to="/contact" className="text-emerald-200 hover:text-emerald-100 transition-colors">Contact Us</Link>
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-4">
            <h4 className="font-semibold text-emerald-100 text-lg">Categories</h4>
            <div className="flex flex-col space-y-2 text-sm">
              <Link to="/marketplace?category=poultry" className="text-emerald-200 hover:text-emerald-100 transition-colors">Chickens & Poultry</Link>
              <Link to="/marketplace?category=ruminants" className="text-emerald-200 hover:text-emerald-100 transition-colors">Cattle & Goats</Link>
              <Link to="/marketplace?category=sheep" className="text-emerald-200 hover:text-emerald-100 transition-colors">Sheep</Link>
              <Link to="/marketplace?category=free-range" className="text-emerald-200 hover:text-emerald-100 transition-colors">Free Range</Link>
              <Link to="/marketplace" className="text-emerald-200 hover:text-emerald-100 transition-colors">View All Categories</Link>
            </div>
          </div>

          {/* Support & Help */}
          <div className="space-y-4">
            <h4 className="font-semibold text-emerald-100 text-lg">Support & Help</h4>
            <div className="flex flex-col space-y-3 text-sm">
              <div className="flex items-center space-x-2 text-emerald-200">
                <Mail className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                <span>hello@stocklot.farm</span>
              </div>
            </div>
            <div className="pt-4">
              <h5 className="font-medium text-emerald-100 mb-2">Trust & Safety</h5>
              <div className="flex flex-col space-y-2 text-xs">
                <div className="flex items-center space-x-2 text-emerald-200">
                  <Shield className="h-3 w-3 text-emerald-400" />
                  <span>Secure Payments</span>
                </div>
                <div className="flex items-center space-x-2 text-emerald-200">
                  <Award className="h-3 w-3 text-emerald-400" />
                  <span>Verified Sellers</span>
                </div>
                <div className="flex items-center space-x-2 text-emerald-200">
                  <Clock className="h-3 w-3 text-emerald-400" />
                  <span>24/7 Support</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-emerald-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-emerald-300 text-sm">
              © 2024 StockLot. All rights reserved. | Connecting South Africa's Farmers | 
              <Link to="/privacy" className="text-emerald-200 hover:text-emerald-100 ml-1">Privacy Policy</Link> | 
              <Link to="/terms" className="text-emerald-200 hover:text-emerald-100 ml-1">Terms of Service</Link>
            </p>
            <SuggestButton compact />
          </div>
        </div>
      </div>
    </footer>
  );
}