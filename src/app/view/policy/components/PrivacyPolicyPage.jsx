import React from 'react';

const PrivacyPolicyPage = ({ onNavigate, currentPage }) => {
  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px', lineHeight: 1.7, textAlign: 'left', backgroundColor: '#000000', color: '#ffffff', minHeight: '100vh' }}>
      <div style={layoutStyle}>
        <Sidebar onNavigate={onNavigate} currentPage={currentPage} />

        <section style={contentStyle}>
          <div style={headerStickyStyle}>
            <h1 id="privacy" style={{ marginBottom: 8 }}>Privacy Policy</h1>
            <h2 style={{ marginTop: 0, fontSize: 18, fontWeight: 600 }}>Wild Mind AI by Wild Child Studios</h2>
            <p style={{ marginTop: 0 }}><strong>Effective Date:</strong> October 4, 2025</p>
          </div>

          <p>
            This Privacy Policy (PP) describes how Wild Mind AI by Wild Child Studios ("we," "us," or "our") collects, uses, secures, and discloses your personal information, designed to comply with global data protection standards (GDPR, CCPA/CPRA, etc.).
          </p>

          <h3 style={{ marginTop: 28 }}>1. Data Collection and Categories</h3>
          <p>
            We collect the following categories of data directly from you:
          </p>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={cellHeaderStyle}>Data Category</th>
                  <th style={cellHeaderStyle}>Examples of Data Collected</th>
                  <th style={cellHeaderStyle}>Lawful Basis for Processing</th>
                  <th style={cellHeaderStyle}>Retention Period</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={cellStyle}><strong>Account & Billing Data</strong></td>
                  <td style={cellStyle}>Name, email address, password (hashed), subscription tier, payment information (via secure processor).</td>
                  <td style={cellStyle}>Contractual Necessity, Legitimate Interest.</td>
                  <td style={cellStyle}>As long as account is active, plus legal/audit periods.</td>
                </tr>
                <tr>
                  <td style={cellStyle}><strong>Input Data (Prompts)</strong></td>
                  <td style={cellStyle}>Text prompts, parameters, reference URLs, and associated generation settings.</td>
                  <td style={cellStyle}>Contractual Necessity (Service Delivery), Legitimate Interest (Service Improvement).</td>
                  <td style={cellStyle}>90 days (de-identified).[4]</td>
                </tr>
                <tr>
                  <td style={cellStyle}><strong>Sensitive Data (Biometrics)</strong></td>
                  <td style={cellStyle}>Raw Voice Samples, facial reference images used for cloning/deepfake generation.</td>
                  <td style={cellStyle}>Explicit, Verifiable Consent.</td>
                  <td style={cellStyle}>Deleted 7 days post-verification/generation, unless ongoing consent is provided for model training.</td>
                </tr>
                <tr>
                  <td style={cellStyle}><strong>Usage & Analytics Data</strong></td>
                  <td style={cellStyle}>IP address, device type, generation requests, API consumption rates, AUP audit logs.</td>
                  <td style={cellStyle}>Legitimate Interest (Security, Compliance, Service Maintenance).</td>
                  <td style={cellStyle}>12 months (for security/audit logs).</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 style={{ marginTop: 28 }}>2. Explicit Consent for Sensitive Data Processing</h3>
          <p>
            We classify user-provided voice samples and related biometric data as Sensitive Personal Information. Processing this data requires your express, documented, and verifiable consent, separate from the general acceptance of these terms. You have the right to withdraw this consent at any time.
          </p>

          <h3 style={{ marginTop: 28 }}>3. Third-Party API Data Sharing Matrix</h3>
          <p>
            We utilize various third-party generative models and services to provide the Service. Your Input Data is shared with these partners strictly under contractual Data Processing Agreements (DPAs) and for the sole purpose of generating the requested Output Content.
          </p>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={cellHeaderStyle}>Data Category Shared</th>
                  <th style={cellHeaderStyle}>Third-Party Partner Type</th>
                  <th style={cellHeaderStyle}>Purpose of Sharing</th>
                  <th style={cellHeaderStyle}>Transfer Mechanism (EEA/UK)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={cellStyle}><strong>User Input Prompts (Text)</strong></td>
                  <td style={cellStyle}>Core Generative Model Provider</td>
                  <td style={cellStyle}>Model Inference and Content Generation.</td>
                  <td style={cellStyle}>Standard Contractual Clauses (SCCs).</td>
                </tr>
                <tr>
                  <td style={cellStyle}><strong>Reference Images/Voice Samples</strong></td>
                  <td style={cellStyle}>Biometric/Cloning Model Provider</td>
                  <td style={cellStyle}>Verification of identity, creation of target model.</td>
                  <td style={cellStyle}>Standard Contractual Clauses (SCCs).</td>
                </tr>
                <tr>
                  <td style={cellStyle}><strong>Payment Information</strong></td>
                  <td style={cellStyle}>Payment Processor (e.g., Stripe)</td>
                  <td style={cellStyle}>Transaction Processing and Fraud Prevention.</td>
                  <td style={cellStyle}>Necessary for Contractual Performance.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p>
            We commit to implementing the most restrictive data protection standards (e.g., GDPR) across all third-party vendors to ensure consistent data protection globally.
          </p>

          <h3 style={{ marginTop: 28 }}>4. Global Privacy Rights and Requests</h3>
          <p>
            Depending on your jurisdiction, you may have the following rights:
          </p>
          <ul>
            <li>
              <strong>GDPR (EEA/UK):</strong> Right of Access, Rectification, Erasure ("Right to be Forgotten"), Restriction of Processing, Data Portability, and the Right to Object.
            </li>
            <li>
              <strong>CCPA/CPRA (California):</strong> The Right to Know (access specific pieces of personal information), the Right to Delete, the Right to Opt-Out of the "Sale" or "Sharing" of Personal Information (as defined by CPRA), and the Right to Limit the Use of Sensitive Personal Information.
            </li>
          </ul>
          <p>
            To exercise any of these rights, please submit a verifiable request to our designated privacy contact (see Section 3.6).
          </p>

          <h3 style={{ marginTop: 28 }}>5. Cross-Border Data Transfers</h3>
          <p>
            Your data may be stored and processed in jurisdictions outside your country of residence (e.g., the United States). For international transfers of data originating from the EEA, the UK, or Switzerland, we rely on established legal mechanisms, primarily the execution of Standard Contractual Clauses (SCCs) or other recognized adequacy decisions, to ensure data remains protected to an equivalent standard.
          </p>

          <h3 style={{ marginTop: 28 }}>6. Contact Information</h3>
          <p>
            For all privacy or data requests:
          </p>
          <div>
            <p><strong>Data Protection Officer (DPO):</strong></p>
            <p>Wild Mind AI by Wild Child Studios</p>
            <p>
              511 Satyamev Eminence,<br />
              Science City Road,<br />
              Sola, Ahmedabad 380 060<br />
              Gujarat, India<br />
              [Head Office]
            </p>
          </div>
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

const tableStyle = {
  width: '100%',
  maxWidth: 920,
  borderCollapse: 'separate',
  borderSpacing: 0,
  border: '1px solid rgba(255, 255, 255, 0.1)',
  background: '#0a0a0a'
};

const cellHeaderStyle = {
  textAlign: 'left',
  padding: '12px 14px',
  background: '#1a1a1a',
  color: '#ffffff',
  fontWeight: 700,
  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  borderRight: '1px solid rgba(255, 255, 255, 0.1)'
};

const cellStyle = {
  verticalAlign: 'top',
  padding: '12px 14px',
  color: '#ffffff',
  borderTop: '1px solid rgba(255, 255, 255, 0.1)',
  borderRight: '1px solid rgba(255, 255, 255, 0.1)',
  wordBreak: 'break-word'
};

const contactInfoStyle = {
  background: '#1a1a1a',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: 8,
  padding: 16,
  margin: '16px 0',
  color: '#ffffff'
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

export default PrivacyPolicyPage;
