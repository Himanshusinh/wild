import React from 'react';

const TermsOfServicePage = ({ onNavigate, currentPage }) => {
  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px', lineHeight: 1.7, textAlign: 'left', backgroundColor: '#000000', color: '#ffffff', minHeight: '100vh' }}>
      <div style={layoutStyle}>
        <Sidebar onNavigate={onNavigate} currentPage={currentPage} />

        <section style={contentStyle}>
          <div style={headerStickyStyle}>
            <h1 id="tos" style={{ marginBottom: 8 }}>Terms of Service (TOS)</h1>
            <h2 style={{ marginTop: 0, fontSize: 18, fontWeight: 600 }}>Wild Mind AI by Wild Child Studios</h2>
            <p style={{ marginTop: 0 }}><strong>Effective Date:</strong> October 4, 2025</p>
          </div>

          <h3 style={{ marginTop: 28 }}>1. Acceptance of Terms</h3>
          <p>
            These Terms of Service (TOS) constitute a legally binding agreement between you ("User" or "you") and Wild Mind AI by Wild Child Studios (the "Company") governing your access to and use of our generative AI software and services (the "Service"). By creating an account or using the Service, you confirm that you have read, understood, and agree to be bound by these TOS and all incorporated documents.
          </p>

          <h3 style={{ marginTop: 28 }}>2. User Eligibility and Representations</h3>
          <p>
            You represent and warrant that you are at least eighteen (18) years of age, or the age of legal majority in your jurisdiction, and have the full legal capacity to enter into this agreement. If you are accepting these terms on behalf of a company or other legal entity, you represent that you have the authority to bind that entity to these TOS.
          </p>

          <h3 style={{ marginTop: 28 }}>3. Platform as Intermediary Disclaimer</h3>
          <p>
            You acknowledge and agree that Wild Mind AI by Wild Child Studios operates as a technology service provider and an intermediary platform (SaaS). The Service provides tools that facilitate the creation of user-generated content using third-party AI models and proprietary technology. We are not the author, creator, or publisher of the AI-generated outputs, which are solely the product of the underlying models as directed by your inputs (prompts, reference data).
          </p>
          <p>
            The Service is provided "AS IS." The Company disclaims all warranties, express or implied, including, but not limited to, warranties of merchantability, fitness for a particular purpose, non-infringement, and quality or accuracy of any AI-generated content.
          </p>

          <h3 style={{ marginTop: 28 }}>4. Intellectual Property Rights</h3>
          <h4 style={{ marginTop: 14 }}>4.1. Input Data Ownership</h4>
          <p>
            You retain all ownership rights to the data, content, and materials you upload, input, or provide to the Service ("Input Data"), including text prompts, reference images, and voice samples. You grant the Company a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, and process the Input Data solely for the purpose of operating, maintaining, improving, and developing the Service and underlying models, subject to the limitations set forth in the Privacy Policy.
          </p>
          <h4 style={{ marginTop: 14 }}>4.2. Output Content Ownership</h4>
          <p>
            Subject to your full compliance with these TOS, the Acceptable Use Policy (AUP), and the payment of all applicable fees, you own the content generated for you by the Service based on your Input Data ("Output Content"). This ownership is, however, subject to any required compliance with third-party model licenses and attribution requirements detailed in the Third-Party Licenses & Attribution Policy.
          </p>

          <h3 style={{ marginTop: 28 }}>5. Subscription Tiers, Billing, and Fees</h3>
          <p>
            Access to the Service may be offered under tiered subscription plans (B2C) or custom Enterprise Service Agreements (B2B). All subscriptions are based on a recurring payment model. You are responsible for all applicable taxes and agree to the specific usage limits and credit consumption rates defined for your tier or in your ESA. All sales of digital credits or subscriptions are final, and the Company is generally not required to provide refunds.
          </p>

          <h3 style={{ marginTop: 28 }}>6. Indemnification</h3>
          <p>
            You agree to indemnify, defend, and hold harmless Wild Mind AI by Wild Child Studios, its parent entity Wild Child Studios, and their officers, directors, and employees, from and against any and all claims, liabilities, damages, losses, and expenses (including reasonable legal fees) arising out of or relating to:
          </p>
          <ul>
            <li>Your use of the Service in breach of these TOS or the AUP.</li>
            <li>Any claim by a third party that your Input Data or Output Content (including deepfakes, unauthorized voice clones, or copyright infringement) violates their intellectual property, privacy, or other rights.</li>
            <li>Any claim that you failed to obtain the legally required consent (e.g., biometric consent) for any Input Data or Output Content.</li>
          </ul>

          <h3 style={{ marginTop: 28 }}>7. Limitation of Liability</h3>
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL <strong>WILD MIND AI BY WILD CHILD STUDIOS</strong> BE LIABLE FOR ANY CONSEQUENTIAL, INCIDENTAL, INDIRECT, SPECIAL, PUNITIVE, OR EXEMPLARY DAMAGES, including lost profits or lost data.
          </p>
          <p>
            THE COMPANY'S TOTAL CUMULATIVE LIABILITY TO YOU FOR ANY AND ALL CLAIMS ARISING OUT OF OR RELATING TO THE SERVICE OR THESE TOS SHALL BE LIMITED TO THE GREATER OF (A) THE AMOUNT OF FEES PAID BY YOU TO THE COMPANY IN THE TWELVE (12) MONTHS IMMEDIATELY PRECEDING THE EVENT GIVING RISE TO THE CLAIM OR (B) FIFTY US DOLLARS ($50.00).
          </p>

          <h3 style={{ marginTop: 28 }}>8. Termination and Suspension</h3>
          <p>
            The Company reserves the right to suspend or terminate your account and access to the Service immediately, without prior notice, if you breach the AUP or materially breach any other provision of these TOS. Upon termination, all licenses granted to you shall immediately cease. The Company shall, in compliance with the Privacy Policy, permanently delete your Input Data and Output Content after a brief retention period (e.g., thirty (30) days) to facilitate data retrieval requests.
          </p>

          <h3 style={{ marginTop: 28 }}>9. Governing Law and Dispute Resolution</h3>
          <p>
            These TOS shall be governed by the laws of the State of Delaware, without regard to its conflict of law principles. Any dispute arising out of or relating to these TOS will be resolved exclusively through binding arbitration in Delaware, in accordance with the rules of the American Arbitration Association (AAA), unless the claim is eligible for small claims court. You waive any right to participate in a class-action lawsuit or class-wide arbitration.
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

export default TermsOfServicePage;


