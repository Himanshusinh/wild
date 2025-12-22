'use client';

import React from 'react';
import LegalLayout from './LegalLayout';

const CookiePolicyPage: React.FC = () => {
  return (
    <LegalLayout currentPage="cookie">
      <div className="legal-header">
        <h1 id="cookie">Cookie Policy</h1>
        <h2>Wild Mind AI by Wild Child Studios</h2>
        <p><strong>Effective Date:</strong> October 4, 2025</p>
      </div>

      <div className="legal-content">
        <p>
          This Cookie Policy explains how Wild Mind AI by Wild Child Studios uses cookies and similar tracking technologies on our website and Service interfaces.
        </p>

        <h3>1. What are Cookies?</h3>
        <p>
          Cookies are small text files placed on your device when you visit a website. They are used to make websites work efficiently, store user preferences, and provide analytical data.
        </p>

        <h3>2. Categories of Cookies Used</h3>
        <p>We categorize the cookies we use as follows:</p>
        <ul>
          <li>
            <strong>Strictly Essential Cookies:</strong> These cookies are necessary for the website to function securely and cannot be switched off in our systems. They are typically set in response to actions made by you, such as logging in, maintaining session state, and managing the content generation queue. Consent is not required for these cookies.
          </li>
          <li>
            <strong>Performance and Analytics Cookies:</strong> These cookies allow us to count visits and traffic sources so we can measure and improve the performance of our site. They help us understand which pages are the most and least popular, and how visitors move around the site (e.g., Google Analytics). Explicit consent is required.
          </li>
          <li>
            <strong>Functionality Cookies:</strong> These enable the website to provide enhanced functionality and personalization, such as remembering language preferences or display settings. Explicit consent is required.
          </li>
          <li>
            <strong>Marketing and Advertising Cookies:</strong> These may be set through our site by our advertising partners. They may be used by those companies to build a profile of your interests and show you relevant advertisements on other sites. Explicit consent is required.
          </li>
        </ul>

        <h3>3. Cookie Consent Management (GDPR/ePrivacy Compliance)</h3>
        <p>
          We use a robust Consent Management Platform (CMP) to manage your preferences:
        </p>
        <ul>
          <li>
            <strong>Granular Opt-In:</strong> We require your explicit, affirmative, and granular consent for all non-essential cookies (Categories 2, 3, and 4) before they are set on your device.
          </li>
          <li>
            <strong>Withdrawal of Consent:</strong> It is as easy to withdraw your consent as it is to give it initially. You can manage your preferences or withdraw consent at any time via the "Cookie Settings" link available in the website footer.
          </li>
        </ul>

        <h3>4. Global Privacy Control (GPC) Signal Compliance</h3>
        <p>
          The Wild Mind AI website is technically configured to detect and recognize the Global Privacy Control (GPC) signal transmitted through your browser settings.
        </p>
        <p>
          Upon detecting a GPC signal, the Company will treat this as a valid opt-out request from the "sale" or "sharing" of your personal information and will automatically disable the setting of all non-essential cookies and trackers. We log the detection and response to the GPC signal for compliance and auditing purposes.
        </p>
      </div>
    </LegalLayout>
  );
};

export default CookiePolicyPage;

