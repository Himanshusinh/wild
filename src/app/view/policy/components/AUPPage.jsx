import React, { useMemo } from 'react';

const AUPPage = ({ onNavigate, currentPage }) => {
  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px', lineHeight: 1.7, textAlign: 'left', backgroundColor: '#000000', color: '#ffffff', minHeight: '100vh' }}>
      <div style={layoutStyle}>
        <Sidebar onNavigate={onNavigate} currentPage={currentPage} />

        <section style={contentStyle}>
          <div style={headerStickyStyle}>
            <h1 id="aup" style={{ marginBottom: 8 }}>Acceptable Use Policy (AUP)</h1>
            <h2 id="relationship" style={{ marginTop: 0, fontSize: 18, fontWeight: 600 }}>Wild Mind AI by Wild Child Studios</h2>
            <p style={{ marginTop: 0 }}><strong>Effective Date:</strong> October 4, 2025</p>
          </div>

      <p>
        This Acceptable Use Policy (AUP) governs the standards of conduct and content for all users of the
        <strong> Wild Mind AI by Wild Child Studios</strong> Service. Violation of this AUP constitutes a
        material breach of the Terms of Service and may result in immediate account suspension or termination.
      </p>
    
          <h3 id="aup-prohibited" style={{ marginTop: 28 }}>1. Prohibited Content (All Media Types)</h3>
      <p>
        You agree not to use the Service to generate, upload, or distribute content that:
      </p>
          <ul>
        <li>
          <strong>Illegal Activities:</strong> Facilitates, encourages, or provides instructions for illegal acts,
          including fraud, harassment, or the unauthorized access to restricted systems.
        </li>
        <li>
          <strong>Violence and Hate Speech:</strong> Incites or promotes violence, self-harm, hate speech,
          harassment, bullying, or the insulting of others based on race, ethnicity, gender, sexual orientation,
          religion, or disability.
        </li>
        <li>
          <strong>Child Exploitation:</strong> Relates to child sexual abuse or exploitation (CSAE).
        </li>
        <li>
          <strong>Illegal Paraphernalia:</strong> Generates or distributes schematics, instructions, or 3D models for
          illegal weapons or controlled substances.
        </li>
        <li>
          <strong>Misinformation:</strong> Systematically generates or disseminates verifiably false or misleading
          information that could interfere with democratic processes or cause imminent public harm.
        </li>
          </ul>

          <h3 id="aup-restrictions" style={{ marginTop: 28 }}>2. Restrictions on Generative Media and Biometric Data</h3>
      <p>
        Due to the sensitive nature of generative AI, the following specific restrictions apply:
      </p>

          <div style={tableContainerStyle}>
            <table style={tableStyle}>
          <thead>
            <tr>
              <th style={cellHeaderStyle}>Prohibited Activity</th>
              <th style={cellHeaderStyle}>Specific Requirement / Restriction</th>
              <th style={cellHeaderStyle}>Underlying Risk / Citation</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={cellStyle}><strong>Non-Consensual Imagery (Deepfakes)</strong></td>
              <td style={cellStyle}>
                Absolute prohibition on generating non-consensual intimate imagery (NCII) or explicit content of
                identifiable individuals without their explicit, verified, and legal consent.
              </td>
              <td style={cellStyle}>Non-Consensual Intimate Imagery (NCII) / Privacy Violation.</td>
            </tr>
            <tr>
              <td style={cellStyle}><strong>Unauthorized Voice Cloning</strong></td>
              <td style={cellStyle}>
                Users must possess and retain documented, explicit, and verifiable consent from the individual whose
                voice is being cloned. The user bears the burden of proof for consent.
              </td>
              <td style={cellStyle}>Biometric Data Privacy Laws (GDPR, CCPA) / Personality Rights.</td>
            </tr>
            <tr>
              <td style={cellStyle}><strong>Sexually Explicit Content</strong></td>
              <td style={cellStyle}>
                Content created for the purpose of pornography or sexual gratification is strictly prohibited.
              </td>
              <td style={cellStyle}>Platform liability for inappropriate content.</td>
            </tr>
            <tr>
              <td style={cellStyle}><strong>Trademark/Logo Generation</strong></td>
              <td style={cellStyle}>
                Generating identifiable corporate logos, registered trademarks, or copyrighted characters is prohibited unless you own or have explicit authorization to use them.
              </td>
              <td style={cellStyle}>Trademark and Copyright Infringement</td>
            </tr>
            <tr>
              <td style={cellStyle}><strong>Copyright Infringement (Style Mimicry)</strong></td>
              <td style={cellStyle}>
                While general artistic style or technique imitation is generally permissible, generating output that copies specific, expressive choices or protectable features of an existing copyrighted work is prohibited and constitutes a violation of this AUP.
              </td>
              <td style={cellStyle}>Copyright Liability / DMCA Safe Harbor.</td>
            </tr>
          </tbody>
            </table>
          </div>

          <h3 id="aup-enforcement" style={{ marginTop: 28 }}>3. Enforcement and Strike System</h3>
      <p>
        Wild Mind AI by Wild Child Studios employs a combination of automated content monitoring systems and human review processes to detect AUP violations.
      </p>

          <h4 style={{ marginTop: 20, marginBottom: 12 }}>Strike System</h4>
          <p>Violations are addressed via a tiered strike system:</p>
          <ul>
        <li><strong>Strike 1:</strong> Formal warning and temporary suspension of generation privileges.</li>
        <li><strong>Strike 2:</strong> Further temporary account suspension (e.g., 7 days).</li>
        <li><strong>Strike 3:</strong> Permanent termination of the account and prohibition from creating new accounts (in line with the Repeat Infringer Policy).</li>
          </ul>

          <h4 id="privacy" style={{ marginTop: 20, marginBottom: 12 }}>Immediate Termination</h4>
          <p>
            Content relating to CSAE or NCII will result in immediate, permanent termination and mandatory reporting to law enforcement, regardless of any prior strike count.
          </p>
          <div id="tos" />
          <div id="thirdparty" />
        </section>
      </div>
    </main>
  );
};

const tableContainerStyle = {
  display: 'flex',
  justifyContent: 'center',
  overflowX: 'auto',
  marginTop: 8,
  marginBottom: 8
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

export default AUPPage;



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

// Sidebar component with active state and smooth scrolling
const Sidebar = ({ onNavigate, currentPage }) => {
  const items = useMemo(() => [
    { id: 'aup', label: 'Acceptable Use Policy (AUP)', page: 'aup' },
    { id: 'api-terms', label: 'API Terms of Use', page: 'api-terms' },
    { id: 'cookie', label: 'Cookie Policy', page: 'cookie' },
    { id: 'dmca', label: 'DMCA Policy', page: 'dmca' },
    { id: 'privacy', label: 'Privacy Policy', page: 'privacy' },
    { id: 'relationship', label: 'Service Relationship & Terms Hierarchy Document', page: 'relationship' },
    { id: 'tos', label: 'Terms of Service (TOS)', page: 'tos' },
    { id: 'thirdparty', label: 'Third-Party Licenses & Attribution Policy', page: 'thirdparty' }
  ], []);

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
