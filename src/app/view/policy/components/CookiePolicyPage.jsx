import React from 'react';

const CookiePolicyPage = ({ onNavigate, currentPage }) => {
  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px', lineHeight: 1.7, textAlign: 'left', backgroundColor: '#000000', color: '#ffffff', minHeight: '100vh' }}>
      <div style={layoutStyle}>
        <Sidebar onNavigate={onNavigate} currentPage={currentPage} />

        <section style={contentStyle}>
          <div style={headerStickyStyle}>
            <h1 id="cookie" style={{ marginBottom: 8 }}>Cookie Policy</h1>
            <h2 style={{ marginTop: 0, fontSize: 18, fontWeight: 600 }}>Wild Mind AI by Wild Child Studios</h2>
            <p style={{ marginTop: 0 }}><strong>Effective Date:</strong> October 4, 2025</p>
          </div>

          <p>
            This Cookie Policy explains how Wild Mind AI by Wild Child Studios uses cookies and similar tracking technologies on our website and Service interfaces.
          </p>

          <h3 style={{ marginTop: 28 }}>1. What are Cookies?</h3>
          <p>
            Cookies are small text files placed on your device when you visit a website. They are used to make websites work efficiently, store user preferences, and provide analytical data.
          </p>

          <h3 style={{ marginTop: 28 }}>2. Categories of Cookies Used</h3>
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

          <h3 style={{ marginTop: 28 }}>3. Cookie Consent Management (GDPR/ePrivacy Compliance)</h3>
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

          <h3 style={{ marginTop: 28 }}>4. Global Privacy Control (GPC) Signal Compliance</h3>
          <p>
            The Wild Mind AI website is technically configured to detect and recognize the Global Privacy Control (GPC) signal transmitted through your browser settings.
          </p>
          <p>
            Upon detecting a GPC signal, the Company will treat this as a valid opt-out request from the "sale" or "sharing" of your personal information and will automatically disable the setting of all non-essential cookies and trackers. We log the detection and response to the GPC signal for compliance and auditing purposes.
          </p>
        </section>
      </div>
    </main>
  );
};

// Layout styles (kept inline for simplicity and to avoid external CSS requirements)
const layoutStyle = {
  display: 'grid',
  gridTemplateColumns: '260px 1fr',
  gap: 24
};

const sidebarStyle = {
  position: 'sticky',
  top: 24,
  alignSelf: 'start',
  height: 'fit-content',
  padding: 16,
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: 8,
  background: '#1a1a1a'
};

const sidebarListStyle = {
  listStyle: 'none',
  margin: '12px 0 0 0',
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 8
};

const sidebarLinkStyle = {
  color: '#ffffff',
  textDecoration: 'none',
  cursor: 'default'
};

const contentStyle = {
  minWidth: 0
};

const headerStickyStyle = {
  position: 'sticky',
  top: 0,
  background: '#000000',
  color: '#ffffff',
  paddingTop: 8,
  paddingBottom: 8,
  zIndex: 5
};

// Sidebar component with navigation
const Sidebar = ({ onNavigate, currentPage }) => {
  const items = [
    { id: 'aup', label: 'Acceptable Use Policy (AUP)', page: 'aup' },
    { id: 'api-terms', label: 'API Terms of Use', page: 'api-terms' },
    { id: 'cookie', label: 'Cookie Policy', page: 'cookie' },
    { id: 'dmca', label: 'DMCA Policy', page: 'dmca' },
    { id: 'privacy', label: 'Privacy Policy', page: 'privacy' },
    { id: 'relationship', label: 'Service Relationship & Terms Hierarchy Document', page: 'relationship' },
    { id: 'tos', label: 'Terms of Service (TOS)', page: 'tos' },
    { id: 'thirdparty', label: 'Third-Party Licenses & Attribution Policy', page: 'thirdparty' }
  ];

  const handleClick = (e, page) => {
    e.preventDefault();
    if (onNavigate) {
      onNavigate(page);
    }
  };

  return (
    <aside style={sidebarStyle}>
      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#ffffff' }}>Documentation</h3>
      <ul style={sidebarListStyle}>
        {items.map((item) => (
          <li key={item.id}>
            <a
              href="#"
              onClick={(e) => handleClick(e, item.page)}
              style={{
                ...sidebarLinkStyle,
                fontWeight: 500,
                backgroundColor: currentPage === item.page ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                borderRadius: 6,
                padding: '8px 10px',
                display: 'block',
                cursor: 'pointer'
              }}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </aside>
  );
};

export default CookiePolicyPage;


