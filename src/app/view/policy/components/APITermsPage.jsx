import React from 'react';

const APITermsPage = ({ onNavigate, currentPage }) => {
  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px', lineHeight: 1.7, textAlign: 'left', backgroundColor: '#000000', color: '#ffffff', minHeight: '100vh' }}>
      <div style={layoutStyle}>
        <Sidebar onNavigate={onNavigate} currentPage={currentPage} />

        <section style={contentStyle}>
          <div style={headerStickyStyle}>
            <h1 id="api-terms" style={{ marginBottom: 8 }}>Third-Party API Terms & Compliance</h1>
            <h2 style={{ marginTop: 0, fontSize: 18, fontWeight: 600 }}>Wild Mind AI by Wild Child Studios</h2>
            <p style={{ marginTop: 0 }}><strong>Effective Date:</strong> October 4, 2025</p>
          </div>

          <p>
            This document establishes the user's mandatory compliance obligations related to the third-party foundation models and Application Programming Interfaces (APIs) that Wild Mind AI by Wild Child Studios (the "Company") utilizes to power the Service.
          </p>

          <h3 style={{ marginTop: 28 }}>1. Scope and Relationship to Underlying Providers</h3>
          <p>
            You acknowledge that Wild Mind AI by Wild Child Studios relies upon, integrates, and consumes Application Programming Interfaces (APIs) and foundation models provided by various external, third-party vendors (collectively, the "Underlying Providers") to perform core generative functions and create the Output Content you request.
          </p>
          
          <p>
            <strong>Intermediary Role:</strong> Wild Mind AI acts solely as the technical intermediary and integrator, providing you with access to the outputs of these Underlying Providers. You understand that there is no direct contractual relationship between you and the Underlying Providers.
          </p>
          
          <p>
            <strong>Flow-Down Mandate:</strong> By using the Wild Mind AI Service, you are contractually agreeing to abide by the necessary and applicable compliance requirements, terms of use, and acceptable use policies (AUPs) of the respective Underlying Providers. Your failure to comply with an Underlying Provider's terms constitutes a material breach of your agreement with Wild Mind AI by Wild Child Studios.
          </p>

          <h3 style={{ marginTop: 28 }}>2. Mandatory Compliance with Flow-Down Terms</h3>
          <p>
            Your use of the Service is strictly conditioned upon your compliance with the following obligations, which flow down from the Underlying Providers:
          </p>
          
          <p>
            <strong>Content Restrictions:</strong> You are strictly prohibited from using the Service to generate any content that violates the AUPs of the Underlying Providers. This includes, but is not limited to, content related to child sexual abuse material, non-consensual intimate imagery, hate speech, illegal activities, or severe harassment.
          </p>
          
          <p>
            <strong>Export Control:</strong> You represent and warrant that neither you nor the Output Content generated will violate any applicable U.S. or international export control laws or sanctions lists, as these are strict requirements often mandated by the Underlying Providers.
          </p>
          
          <p>
            <strong>Security and Abuse:</strong> You must not engage in any activity that attempts to circumvent the security or access controls of the Underlying Providers, including unauthorized attempts to reverse-engineer, scrape, or perform denial-of-service attacks against their APIs via the Wild Mind AI platform.
          </p>

          <h3 style={{ marginTop: 28 }}>3. Liability, Disclaimer, and Enforcement</h3>
          <p>
            <strong>Enforcement Right:</strong> Wild Mind AI reserves the right to immediately suspend or terminate your account if an Underlying Provider notifies us that your account or generated content is in violation of their terms or policies. This is a critical action necessary to maintain our operational access to the third-party services.
          </p>
          
          <p>
            <strong>Disclaimer:</strong> Wild Mind AI explicitly disclaims all liability for the acts, omissions, or failures of any Underlying Provider, including model outages, API errors, changes to their terms, or inaccuracies in the data they provide. Your exclusive recourse for service failures remains against Wild Mind AI by Wild Child Studios under the Terms of Service.
          </p>
          
          <p>
            <strong>Strict Standard:</strong> Where a prohibition exists in both the Wild Mind AI Acceptable Use Policy (AUP) and the Underlying Provider's terms, the stricter restriction shall apply to your use of the Service.
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

export default APITermsPage;
