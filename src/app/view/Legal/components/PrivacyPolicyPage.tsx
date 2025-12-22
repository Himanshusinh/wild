'use client';

import React from 'react';
import LegalLayout from './LegalLayout';

const PrivacyPolicyPage: React.FC = () => {
  return (
    <LegalLayout currentPage="privacy">
      <div className="legal-header">
        <h1 id="privacy">Privacy Policy</h1>
        <h2>Wild Mind AI by Wild Child Studios</h2>
        <p>
          <strong>Last Updated:</strong> 29-11-2025
        </p>
      </div>

      <div className="legal-content">
        <h3>1. Introduction</h3>
        <p>
          This Privacy Policy describes how Wild Mind AI, a product developed by Wild Child Studios, located at 511,
          Satyamev Eminence, Sola, Ahmedabad, Gujarat 380060, collects, processes, stores, uses, shares, and protects
          personal information obtained through the Wild Mind AI platform, APIs, and associated digital services.
        </p>
        <p>
          By creating an account, accessing the platform, interacting with AI models, submitting prompts, generating
          content, or using any functionality of Wild Mind AI, the user (“you,” “your,” or “the user”) consents to the
          practices described in this Privacy Policy. Wild Mind AI is committed to ensuring your privacy, maintaining
          transparency, and safeguarding all user information in accordance with applicable laws, industry standards,
          and responsible AI principles.
        </p>

        <h3>2. Information We Collect</h3>
        <p>Wild Mind AI collects only the information necessary for the operation, security, billing, personalization, and improvement of its services. The following categories of information are collected:</p>
        <ul>
          <li>
            <strong>Identification and Account Data:</strong> Name or username, email address, and encrypted password.
          </li>
          <li>
            <strong>Billing and Payment Data:</strong> Billing address and payment-related information. Payment
            information is processed directly by third-party gateways and is not stored by Wild Mind AI.
          </li>
          <li>
            <strong>Technical and Device Data:</strong> IP address, device identifiers, browser information, and system
            metadata collected through automated methods.
          </li>
          <li>
            <strong>Analytics Data:</strong> Information collected by Google Analytics, Meta Pixel, and similar analytic
            tools, including user behavior, session data, navigation patterns, and interaction metrics.
          </li>
          <li>
            <strong>User-Generated Inputs and Outputs:</strong> User prompts, uploaded content, and all AI-generated
            outputs produced through the platform.
          </li>
        </ul>
        <p>
          The information collected enables secure operation, service enhancement, fraud prevention, and compliance with
          safety standards and provider policies.
        </p>

        <h3>3. Third-Party Services and Integrations</h3>
        <p>
          Wild Mind AI integrates with several third-party services essential to its operation. By using the platform,
          you acknowledge that your data may be processed through these providers solely for the purposes described.
        </p>
        <ul>
          <li>
            <strong>Artificial Intelligence Providers:</strong> External AI providers process user prompts and generate
            outputs according to their respective model guidelines, safety rules, and data-handling practices.
          </li>
          <li>
            <strong>Payment Gateway:</strong> Payments are handled through Razorpay, which directly processes payment
            credentials in accordance with secure industry standards. Wild Mind AI does not store card details or
            sensitive payment information.
          </li>
          <li>
            <strong>Analytics Services:</strong> Google Analytics and Meta Pixel collect behavioral and interaction
            data to help improve the platform experience.
          </li>
          <li>
            <strong>Cloud and Hosting Services:</strong> Front-end hosting (e.g., Vercel), back-end hosting (e.g.,
            Render), and DNS/domain management (e.g., IONOS).
          </li>
          <li>
            <strong>Authentication Services:</strong> Account authentication and credential management are conducted
            through Firebase.
          </li>
          <li>
            <strong>Storage Services:</strong> Data, media files, and generation-related artifacts may be stored using
            ZATA/AI, Neev Cloud, or equivalent provider infrastructure.
          </li>
        </ul>
        <p>
          These providers process data strictly for technical, operational, or analytic purposes, and each service is
          governed by its own privacy policy.
        </p>

        <h3>4. How We Use Your Information</h3>
        <p>The information collected by Wild Mind AI is used strictly for legitimate operational purposes, including but not limited to:</p>
        <ul>
          <li>Creating and managing user accounts.</li>
          <li>Providing access to AI models, APIs, and platform tools.</li>
          <li>Processing payments, subscriptions, and credit-based usage.</li>
          <li>Monitoring security, preventing fraud, and ensuring responsible usage.</li>
          <li>Generating personalized recommendations and improving user experience.</li>
          <li>Communicating updates, billing alerts, security notices, or service-related announcements.</li>
          <li>Ensuring compliance with third-party API providers’ policies and safety standards.</li>
          <li>Conducting analytics, diagnostics, and performance monitoring.</li>
          <li>Improving, training, refining, and evaluating AI systems (as described in Section 7).</li>
        </ul>
        <p>Wild Mind AI does not sell, rent, or trade user data to third parties.</p>

        <h3>5. Legal Basis for Processing</h3>
        <p>Where applicable, Wild Mind AI processes personal data under the following legal bases:</p>
        <ul>
          <li>
            <strong>Consent:</strong> When the user voluntarily provides information or interacts with the platform.
          </li>
          <li>
            <strong>Contractual necessity:</strong> For account creation, service delivery, billing, and API usage.
          </li>
          <li>
            <strong>Legitimate interest:</strong> For analytics, security, fraud prevention, research, and platform
            improvement.
          </li>
          <li>
            <strong>Compliance with legal obligations:</strong> Including data retention and governance requirements.
          </li>
        </ul>

        <h3>6. Storage, Retention, and Deletion</h3>
        <p>Wild Mind AI retains data according to the following policies:</p>
        <ul>
          <li>User-generated outputs are retained indefinitely, unless removal is specifically requested and technically feasible.</li>
          <li>User identification and account information is retained until the user deletes their account.</li>
          <li>Billing records are retained in accordance with legal and financial compliance requirements.</li>
        </ul>
        <p>
          Users may request account deletion by contacting support at
          {' '}
          <a href="mailto:connect@wildmindai.com">connect@wildmindai.com</a>. Upon receiving such a request, the Company
          will verify the user’s identity and process the deletion within a reasonable time frame.
        </p>

        <h3>7. Use of Prompts and Generated Content for Model Improvement</h3>
        <p>
          You acknowledge and agree that Wild Mind AI may use anonymized prompts, generated outputs, and related
          metadata to improve, refine, audit, or train AI models. This may involve internal model updates, quality
          evaluations, bias detection, dataset enhancement, and research. If a legally required opt-out mechanism
          becomes applicable in your jurisdiction, the Company shall implement an appropriate process to respect user
          choices.
        </p>

        <h3>8. Data of Minors</h3>
        <p>
          Wild Mind AI is accessible to users aged eleven (11) and above. The platform does not knowingly collect
          personal information from children below the legally permissible digital consent age without parental or
          guardian authorization. Any data identified as belonging to users under the required age will be removed upon
          verification.
        </p>

        <h3>9. Sharing of Information</h3>
        <p>Wild Mind AI does not share personal information except under the following limited circumstances:</p>
        <ul>
          <li>
            With service providers required for platform operation, such as hosting providers, authentication services,
            analytics platforms, and AI model providers.
          </li>
          <li>With payment processors solely for transaction processing and fraud prevention.</li>
          <li>When required by law, regulation, subpoena, or court order.</li>
          <li>To enforce platform policies, protect platform integrity, and prevent harm.</li>
        </ul>
        <p>No personal data is shared for marketing purposes or sold to third parties.</p>

        <h3>10. Security Measures</h3>
        <p>
          Wild Mind AI employs robust technical, organizational, and administrative measures to safeguard data,
          including encryption, access control, monitoring systems, and secure storage practices. Although no method of
          digital transmission or storage can guarantee absolute security, the Company continuously updates its
          protective measures in accordance with industry best practices.
        </p>

        <h3>11. International Data Practices and Compliance</h3>
        <p>
          Wild Mind AI may process and store data across multiple geographic locations depending on provider
          infrastructure. Users outside India acknowledge that their data may be transferred to and processed in India
          or other jurisdictions. The platform aims to align with the principles of the General Data Protection
          Regulation (GDPR) and the California Consumer Privacy Act (CCPA) to the extent practicable for a growing
          startup. Users may request access, correction, portability, or deletion of their personal data in accordance
          with these principles.
        </p>

        <h3>12. User Rights</h3>
        <p>
          Depending on your jurisdiction, you may have rights including access to personal data, correction of
          inaccuracies, deletion of data, portability, withdrawal of consent, or objection to specific types of
          processing. Requests can be made by contacting our Data Protection team at
          {' '}
          <a href="mailto:connect@wildmindai.com">connect@wildmindai.com</a>. Verification of identity may be required
          to process sensitive requests.
        </p>

        <h3>13. Changes to This Privacy Policy</h3>
        <p>
          The Company may update or revise this Privacy Policy from time to time. Updates will be posted on the
          platform, and significant changes may be communicated through email or notifications. Continued use of the
          platform constitutes acceptance of updated terms.
        </p>

        <h3>14. Contact Information</h3>
        <p>For questions regarding this Privacy Policy or your personal data, you may contact:</p>
        <p>
          <strong>Data Protection Team</strong>
          <br />
          Wild Mind AI by Wild Child Studios
          <br />
          511, Satyamev Eminence, Sola, Ahmedabad, Gujarat 380060
          <br />
          Email:
          {' '}
          <a href="mailto:connect@wildmindai.com">connect@wildmindai.com</a>
        </p>
      </div>
    </LegalLayout>
  );
};

export default PrivacyPolicyPage;

