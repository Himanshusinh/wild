'use client';

import React, { useState } from 'react';
import TurnstileCaptcha from '@/components/TurnstileCaptcha';

const ContactForm: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string>('');
  const [captchaError, setCaptchaError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verify captcha token is present
    if (!captchaToken) {
      setCaptchaError(true);
      alert('Please complete the captcha verification');
      return;
    }
    
    // TODO: Send captchaToken to backend for verification
    // TODO: Implement contact form submission to backend
    console.log('Form submitted with captcha token:', captchaToken);
    setSubmitted(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleCaptchaVerify = (token: string) => {
    setCaptchaToken(token);
    setCaptchaError(false);
  };

  const handleCaptchaError = () => {
    setCaptchaToken('');
    setCaptchaError(true);
  };

  if (submitted) {
    return (
      <div className="p-6 bg-gray-900 border border-gray-800 rounded-lg">
        <p className="text-gray-300">
          Thank you for contacting us! We've received your message and will get back to you as soon as possible.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-2">
          Name *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white focus:outline-none focus:border-white"
          placeholder="Your name"
        />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-2">
          Email *
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white focus:outline-none focus:border-white"
          placeholder="your.email@example.com"
        />
      </div>
      <div>
        <label htmlFor="subject" className="block text-sm font-medium mb-2">
          Subject *
        </label>
        <select
          id="subject"
          name="subject"
          value={formData.subject}
          onChange={handleChange}
          required
          className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white focus:outline-none focus:border-white"
        >
          <option value="">Select a subject</option>
          <option value="support">Technical Support</option>
          <option value="billing">Billing Question</option>
          <option value="feature">Feature Request</option>
          <option value="partnership">Partnership Inquiry</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div>
        <label htmlFor="message" className="block text-sm font-medium mb-2">
          Message *
        </label>
        <textarea
          id="message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          required
          rows={6}
          className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white focus:outline-none focus:border-white resize-none"
          placeholder="Your message..."
        />
      </div>
      
      {/* Cloudflare Turnstile Captcha */}
      <TurnstileCaptcha
        onVerify={handleCaptchaVerify}
        onError={handleCaptchaError}
        theme="dark"
      />
      
      {captchaError && (
        <p className="text-sm text-red-500">Please complete the captcha verification</p>
      )}
      
      <button
        type="submit"
        disabled={!captchaToken}
        className="w-full px-6 py-3 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors font-semibold disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed"
      >
        Send Message
      </button>
    </form>
  );
};

export default ContactForm;

