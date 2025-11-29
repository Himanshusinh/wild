'use client';

import React from 'react';
import LegalLayout from './LegalLayout';

const PrivacyPolicyPage: React.FC = () => {
  return (
    <LegalLayout currentPage="privacy">
      <div className="legal-header">
        <h1 id="privacy">Privacy Policy</h1>
        <h2>Wild Mind AI by Wild Child Studios</h2>
        <p><strong>Effective Date:</strong> October 4, 2025</p>
      </div>

      <div className="legal-content">
        <p>
          This Privacy Policy (PP) describes how Wild Mind AI by Wild Child Studios ("we," "us," or "our") collects, uses, secures, and discloses your personal information, designed to comply with global data protection standards (GDPR, CCPA/CPRA, etc.).
        </p>

        <h3>1. Data Collection and Categories</h3>
        <p>
          We collect the following categories of data directly from you:
        </p>
        
        <div className="legal-table-container">
          <table className="legal-table">
            <thead>
              <tr>
                <th>Data Category</th>
                <th>Examples of Data Collected</th>
                <th>Lawful Basis for Processing</th>
                <th>Retention Period</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Account & Billing Data</strong></td>
                <td>Name, email address, password (hashed), subscription tier, payment information (via secure processor).</td>
                <td>Contractual Necessity, Legitimate Interest.</td>
                <td>As long as account is active, plus legal/audit periods.</td>
              </tr>
              <tr>
                <td><strong>Input Data (Prompts)</strong></td>
                <td>Text prompts, parameters, reference URLs, and associated generation settings.</td>
                <td>Contractual Necessity (Service Delivery), Legitimate Interest (Service Improvement).</td>
                <td>90 days (de-identified).[4]</td>
              </tr>
              <tr>
                <td><strong>Sensitive Data (Biometrics)</strong></td>
                <td>Raw Voice Samples, facial reference images used for cloning/deepfake generation.</td>
                <td>Explicit, Verifiable Consent.</td>
                <td>Deleted 7 days post-verification/generation, unless ongoing consent is provided for model training.</td>
              </tr>
              <tr>
                <td><strong>Usage & Analytics Data</strong></td>
                <td>IP address, device type, generation requests, API consumption rates, AUP audit logs.</td>
                <td>Legitimate Interest (Security, Compliance, Service Maintenance).</td>
                <td>12 months (for security/audit logs).</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3>2. Explicit Consent for Sensitive Data Processing</h3>
        <p>
          We classify user-provided voice samples and related biometric data as Sensitive Personal Information. Processing this data requires your express, documented, and verifiable consent, separate from the general acceptance of these terms. You have the right to withdraw this consent at any time.
        </p>

        <h3>3. Third-Party API Data Sharing Matrix</h3>
        <p>
          We utilize various third-party generative models and services to provide the Service. Your Input Data is shared with these partners strictly under contractual Data Processing Agreements (DPAs) and for the sole purpose of generating the requested Output Content.
        </p>
        
        <div className="legal-table-container">
          <table className="legal-table">
            <thead>
              <tr>
                <th>Data Category Shared</th>
                <th>Third-Party Partner Type</th>
                <th>Purpose of Sharing</th>
                <th>Transfer Mechanism (EEA/UK)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>User Input Prompts (Text)</strong></td>
                <td>Core Generative Model Provider</td>
                <td>Model Inference and Content Generation.</td>
                <td>Standard Contractual Clauses (SCCs).</td>
              </tr>
              <tr>
                <td><strong>Reference Images/Voice Samples</strong></td>
                <td>Biometric/Cloning Model Provider</td>
                <td>Verification of identity, creation of target model.</td>
                <td>Standard Contractual Clauses (SCCs).</td>
              </tr>
              <tr>
                <td><strong>Payment Information</strong></td>
                <td>Payment Processor (e.g., Stripe)</td>
                <td>Transaction Processing and Fraud Prevention.</td>
                <td>Necessary for Contractual Performance.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p>
          We commit to implementing the most restrictive data protection standards (e.g., GDPR) across all third-party vendors to ensure consistent data protection globally.
        </p>

        <h3>4. Global Privacy Rights and Requests</h3>
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

        <h3>5. Cross-Border Data Transfers</h3>
        <p>
          Your data may be stored and processed in jurisdictions outside your country of residence (e.g., the United States). For international transfers of data originating from the EEA, the UK, or Switzerland, we rely on established legal mechanisms, primarily the execution of Standard Contractual Clauses (SCCs) or other recognized adequacy decisions, to ensure data remains protected to an equivalent standard.
        </p>

        <h3>6. Contact Information</h3>
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
      </div>
    </LegalLayout>
  );
};

export default PrivacyPolicyPage;

