'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import './LegalLayout.css';

interface LegalLayoutProps {
  children: React.ReactNode;
  currentPage: string;
}

const LegalLayout: React.FC<LegalLayoutProps> = ({ children, currentPage }) => {
  const router = useRouter();
  const items = [
    { id: 'aup', label: 'Acceptable Use Policy (AUP)', page: 'aup', route: '/legal/aup' },
    { id: 'api-terms', label: 'API Terms of Use', page: 'api-terms', route: '/legal/api-terms' },
    { id: 'cookie', label: 'Cookie Policy', page: 'cookie', route: '/legal/cookie' },
    { id: 'dmca', label: 'DMCA Policy', page: 'dmca', route: '/legal/dmca' },
    { id: 'privacy', label: 'Privacy Policy', page: 'privacy', route: '/legal/privacy' },
    { id: 'relationship', label: 'Service Relationship & Terms Hierarchy Document', page: 'relationship', route: '/legal/relationship' },
    { id: 'tos', label: 'Terms of Service (TOS)', page: 'tos', route: '/legal/terms' },
    { id: 'thirdparty', label: 'Third-Party Licenses & Attribution Policy', page: 'thirdparty', route: '/legal/thirdparty' }
  ];

  return (
    <main className="legal-page">
      <div className="legal-layout">
        {/* Header Section */}
        <div className="legal-header-section">
          <img 
            src="/icons/wildmindai logo white.svg" 
            alt="Wild Mind AI Logo" 
            className="legal-logo"
          />
          <div className="legal-title-wrapper">
            <button 
              onClick={() => router.back()}
              className="legal-back-button"
              aria-label="Go back"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Back</span>
            </button>
            <h3 className="legal-nav-title">Documentation</h3>
          </div>
        </div>

        {/* Main Content Area with Sidebar */}
        <div className="legal-main-container">
          {/* Left Sidebar - Navigation */}
          <aside className="legal-sidebar">
            <div className="legal-nav-grid">
              {items.map((item) => (
                <Link
                  key={item.id}
                  href={item.route}
                  className={`legal-nav-link ${currentPage === item.page ? 'active' : ''}`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </aside>

          {/* Right Content Area */}
          <section className="legal-content">
            {children}
          </section>
        </div>
      </div>
    </main>
  );
};

export default LegalLayout;

  