import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getImageUrl } from '@/routes/imageroute';
import ContactForm from './ContactForm';

const ContactUsPage: React.FC = () => {
  // Business contact information - Must be visible as text for Razorpay validation
  const businessInfo = {
    companyName: 'WildMind AI Technologies Pvt. Ltd.',
    address: {
      line1: '511 Satyamev Eminence',
      line2: 'Science City Road',
      area: 'Sola',
      city: 'Ahmedabad',
      state: 'Gujarat',
      pincode: '380 060',
      country: 'India'
    },
    email: 'support@wildmindai.com',
    phone: '+91 98765 43210', // TODO: Update with actual phone number
    supportHours: 'Monday - Saturday: 10:00 AM - 6:00 PM IST'
  };

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-12">
          <Link 
            href="/"
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6 w-fit"
            aria-label="Go back"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Back</span>
          </Link>
          <div className="mb-4">
            <Image
              src={getImageUrl("core", "logo") || "/placeholder.svg"}
              alt="WildMind Logo"
              width={120}
              height={48}
              className="h-8 w-auto"
            />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Contact Us</h1>
          <p className="text-xl text-gray-400">Get in touch with our team</p>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div>
            <h2 className="text-2xl font-semibold mb-6">Send us a Message</h2>
            <ContactForm />
          </div>

          {/* Contact Information - Must be visible as text for Razorpay */}
          <div>
            <h2 className="text-2xl font-semibold mb-6">Contact Information</h2>
            <div className="space-y-6">
              {/* Company Name */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Company</h3>
                <p className="text-gray-300">{businessInfo.companyName}</p>
              </div>

              {/* Physical Address - REQUIRED by Razorpay */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Business Address</h3>
                <address className="text-gray-300 not-italic leading-relaxed">
                  {businessInfo.address.line1}<br />
                  {businessInfo.address.line2}<br />
                  {businessInfo.address.area}, {businessInfo.address.city}<br />
                  {businessInfo.address.state}, {businessInfo.address.country} - {businessInfo.address.pincode}
                </address>
              </div>

              {/* Email Address - REQUIRED by Razorpay (must be visible text) */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Email Address</h3>
                <p className="text-gray-300">
                  <a 
                    href={`mailto:${businessInfo.email}`}
                    className="text-white hover:text-gray-300 underline"
                  >
                    {businessInfo.email}
                  </a>
                </p>
              </div>

              {/* Phone Number - REQUIRED by Razorpay */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Phone Number</h3>
                <p className="text-gray-300">
                  <a 
                    href={`tel:${businessInfo.phone.replace(/\s/g, '')}`}
                    className="text-white hover:text-gray-300 underline"
                  >
                    {businessInfo.phone}
                  </a>
                </p>
              </div>

              {/* Support Hours - REQUIRED by Razorpay */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Support Hours</h3>
                <p className="text-gray-300">{businessInfo.supportHours}</p>
              </div>

              {/* Response Time */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Response Time</h3>
                <p className="text-gray-300">
                  We typically respond to inquiries within 24-48 hours during business days.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default ContactUsPage;

