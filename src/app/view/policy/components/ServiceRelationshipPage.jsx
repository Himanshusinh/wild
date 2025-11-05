import React from 'react';

const ServiceRelationshipPage = ({ onNavigate, currentPage }) => {
  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px', lineHeight: 1.7, textAlign: 'left', backgroundColor: '#000000', color: '#ffffff', minHeight: '100vh' }}>
      <div style={layoutStyle}>
        <Sidebar onNavigate={onNavigate} currentPage={currentPage} />

        <section style={contentStyle}>
          <div style={headerStickyStyle}>
            <h1 id="relationship" style={{ marginBottom: 8 }}>Service Relationship & Terms Hierarchy Document</h1>
            <h2 style={{ marginTop: 0, fontSize: 18, fontWeight: 600 }}>Wild Mind AI by Wild Child Studios</h2>
            <p style={{ marginTop: 0 }}><strong>Effective Date:</strong> October 4, 2025</p>
          </div>

          <p>
            This document establishes the binding legal relationship between the user and Wild Mind AI by Wild Child Studios (the "Company," "we," "us," or "our") and defines the definitive order of precedence for all governing legal agreements.
          </p>

          <h3 style={{ marginTop: 28 }}>1. Legal Entity and Relationship</h3>
          <p>
            The user acknowledges and agrees that Wild Mind AI is a product and service offered under the corporate structure of Wild Child Studios. By agreeing to any of the Wild Mind AI Terms and Policies listed below, the user is concurrently agreeing to and bound by the foundational legal terms of Wild Child Studios, including any relevant Master Entity Agreement or General Business Terms, which are incorporated by reference. The policies listed herein are supplementary to, and governed by, the Wild Child Studios corporate structure.
          </p>

          <h3 style={{ marginTop: 28 }}>2. Agreement Components and Nature</h3>
          <p>
            The legal relationship between the Company and the user is governed by the following documents, which are incorporated by reference. Each document applies to specific aspects of the user’s interaction with the Service, and all are legally binding.
          </p>

          <div style={{ overflowX: 'auto' }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={cellHeaderStyle}>Document Name</th>
                  <th style={cellHeaderStyle}>Purpose</th>
                  <th style={cellHeaderStyle}>Scope of Application</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={cellStyle}><strong>Terms of Service (TOS)</strong></td>
                  <td style={cellStyle}>The Master Agreement governing general access, account creation, billing, IP assignment, and dispute resolution.</td>
                  <td style={cellStyle}>All users (B2C and B2B) accessing the web platform or general services.</td>
                </tr>
                <tr>
                  <td style={cellStyle}><strong>Third-Party API Terms & Compliance</strong></td>
                  <td style={cellStyle}>Governs the user's mandatory compliance obligations flowing down from the underlying third-party generative models and APIs utilized by Wild Mind AI.</td>
                  <td style={cellStyle}>All users consuming services that rely on third-party generative models.</td>
                </tr>
                <tr>
                  <td style={cellStyle}><strong>Acceptable Use Policy (AUP)</strong></td>
                  <td style={cellStyle}>Details specific content restrictions, behavioral guidelines, and enforcement actions (e.g., deepfakes, copyright, violence).</td>
                  <td style={cellStyle}>All user inputs, outputs, and behaviors on the Service.</td>
                </tr>
                <tr>
                  <td style={cellStyle}><strong>Privacy Policy (PP)</strong></td>
                  <td style={cellStyle}>Governs the collection, use, security, and storage of user personal data (including biometric identifiers).</td>
                  <td style={cellStyle}>All users providing Personal Information or sensitive data to the Service.</td>
                </tr>
                <tr>
                  <td style={cellStyle}><strong>DMCA Policy</strong></td>
                  <td style={cellStyle}>Outlines procedures for copyright infringement claims and safe harbor protections.</td>
                  <td style={cellStyle}>All user-generated AI content and material where copyright is asserted.</td>
                </tr>
                <tr>
                  <td style={cellStyle}><strong>Cookie Policy (CP)</strong></td>
                  <td style={cellStyle}>Details the use of cookies and tracking technologies, and the mechanism for consent management.</td>
                  <td style={cellStyle}>All visitors to the Wild Mind AI website interface.</td>
                </tr>
                <tr>
                  <td style={cellStyle}><strong>Third-Party Licenses & Attribution</strong></td>
                  <td style={cellStyle}>Specifies compliance obligations for open-source components, models, and required user attributions.</td>
                  <td style={cellStyle}>All commercial and public sharing of AI-generated output derived from the Service.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 style={{ marginTop: 28 }}>3. Order of Precedence (Conflict Resolution)</h3>
          <p>
            In the event of an irreconcilable conflict or ambiguity between any of the documents listed above, the conflict shall be resolved by applying the documents in the following strict descending order of precedence:
          </p>
          <ol>
            <li>
              <strong>Executed Enterprise Service Agreement (ESA):</strong> A negotiated and signed custom contract for B2B or high-volume enterprise clients. Only the specific, explicitly negotiated clauses in the ESA override the underlying TOS and Policies.
            </li>
            <li>
              <strong>Geographic-Specific Addendum:</strong> Mandatory legal addendums (e.g., GDPR, CCPA, LGPD) override any conflicting clause in the lower-tier documents to the extent necessary to ensure compliance with mandatory local law.
            </li>
            <li>
              <strong>Terms of Service (TOS):</strong> The Master Agreement for all general legal and commercial terms.
            </li>
            <li>
              <strong>Third-Party API Terms & Compliance:</strong> Only for matters directly relating to flow-down obligations from underlying model providers.
            </li>
            <li>
              <strong>Acceptable Use Policy (AUP):</strong> For specific matters relating to prohibited conduct, content restrictions, and enforcement.
            </li>
            <li>
              <strong>All Remaining Supplementary Policies (PP, DMCA, CP, Attribution):</strong> These provide detail and context but are generally subservient to the TOS.
            </li>
          </ol>

          <h3 style={{ marginTop: 28 }}>4. Version Control and Updates</h3>
          <ul>
            <li>
              <strong>Non-Material Changes:</strong> Changes deemed non-material (e.g., clarification or minor edits) are effective upon posting the revised version.
            </li>
            <li>
              <strong>Material Changes:</strong> For material changes that substantively alter the user’s rights, obligations, or data handling (e.g., changes to the Limitation of Liability or data sharing practices), the Company shall provide the user with at least thirty (30) days’ prior written notice (via email or in-service notification) before the changes take effect.
            </li>
            <li>
              <strong>Archival:</strong> The Company shall maintain a publicly accessible archive of all previous document versions.
            </li>
          </ul>
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

export default ServiceRelationshipPage;


