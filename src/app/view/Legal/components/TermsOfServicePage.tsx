'use client';

import React from 'react';
import LegalLayout from './LegalLayout';

const TermsOfServicePage: React.FC = () => {
  return (
    <LegalLayout currentPage="tos">
      <div className="legal-header">
        <h1 id="tos">Terms and Conditions of Use</h1>
        <h2>Wild Mind AI by Wild Child Studios</h2>
        <p>
          <strong>Last Updated:</strong> 29-11-2025
        </p>
      </div>

      <div className="legal-content">
        <h3>1. Introduction</h3>
        <p>
          These Terms and Conditions (“Terms”) constitute a legally binding agreement between the user (“you,” “your,”
          or “the user”) and Wild Mind AI, a product developed and operated by Wild Child Studios, located at 511,
          Satyamev Eminence, Sola, Ahmedabad, Gujarat 380060 (“Company,” “we,” or “us”). These Terms govern your access
          to and use of the Wild Mind AI platform, including all features, services, API endpoints, credit systems,
          subscription plans, and any digital content generated through or accessed via the platform.
        </p>
        <p>
          By creating an account, accessing the website or API, purchasing credits or subscriptions, or using any
          service provided by Wild Mind AI, you acknowledge that you have read, understood, and agreed to be bound by
          these Terms. If you do not agree with any portion of these Terms, you must immediately discontinue the use of
          Wild Mind AI.
        </p>

        <h3>2. Description of Services</h3>
        <p>
          Wild Mind AI provides advanced artificial intelligence generation systems, which include image generation
          (text to image and image to image), audio generation (text to music, text to audio, text to speech), and
          video generation (text to video, image to video, speech to video, and video to video). All services are
          delivered digitally and are primarily accessed through APIs, credit-based usage models, and subscription
          plans.
        </p>
        <p>
          Access to these services becomes available instantly upon account creation, subject to platform verification
          measures where applicable. The Company may expand, modify, restrict, or discontinue services at its sole
          discretion in accordance with the requirements of service providers, infrastructure, safety, and legal
          compliance.
        </p>

        <h3>3. Eligibility</h3>
        <p>
          Use of the platform is permitted to individuals aged eleven (11) years or older for general AI generation and
          platform interaction. However, the ability to make financial transactions, including purchasing credits or
          subscribing to paid plans, is restricted to individuals aged sixteen (16) years or older, or younger users
          operating under verified legal guardian supervision.
        </p>
        <p>
          By accessing the platform, you confirm that you meet the applicable age requirements and are legally
          competent to enter into this agreement.
        </p>

        <h3>4. Account Registration and User Responsibilities</h3>
        <p>
          You agree to provide accurate, complete, and current information when creating an account. You are solely
          responsible for maintaining the confidentiality of your login credentials and for all activities conducted
          under your account.
        </p>
        <p>
          You agree not to share, sell, transfer, or otherwise permit unauthorized access to your account. The Company
          may suspend or terminate accounts involved in fraudulent activity, unauthorized sharing, suspicious usage
          patterns, or violations of these Terms or applicable laws.
        </p>

        <h3>5. Compliance with Third-Party Provider Policies</h3>
        <p>
          Wild Mind AI relies on multiple third-party artificial intelligence providers. By using the platform, you
          expressly acknowledge and agree to comply with all applicable policies, restrictions, model guidelines, and
          usage standards established by these providers. Acceptance of these Terms constitutes acceptance of all
          relevant provider policies.
        </p>
        <p>
          Violations of such provider rules may result in restriction or permanent termination of your access to the
          platform.
        </p>

        <h3>6. Acceptable Use Policy</h3>
        <p>
          You agree that the platform shall not be used for any activities or purposes that violate applicable laws,
          ethical standards, or third-party rights. Prohibited uses include, without limitation, the creation,
          distribution, or promotion of:
        </p>
        <ul>
          <li>Illegal, harmful, exploitative, or fraudulent content.</li>
          <li>Hate-based, violent, discriminatory, or abusive material.</li>
          <li>Non-consensual deepfakes or impersonations.</li>
          <li>
            Child sexual abuse material or any exploitation of minors (which will result in immediate and permanent
            account termination and potential reporting to authorities).
          </li>
          <li>Explicit sexual content.</li>
          <li>Politically manipulative, deceptive, or election-influencing content.</li>
          <li>Malware, harmful code, or technological abuse.</li>
          <li>Misleading, deceptive, or manipulated media intended to harm individuals or organizations.</li>
          <li>Content that violates safety limitations imposed by AI providers.</li>
        </ul>
        <p>
          The Company reserves the right to determine whether conduct violates this Acceptable Use Policy. For the full
          AUP, please refer to the dedicated AI Usage / Acceptable Use Policy document.
        </p>

        <h3>7. Ownership of Generated Content</h3>
        <p>
          All content generated by you through the use of Wild Mind AI’s tools and APIs is considered user-generated
          content, and ownership of such output is fully granted to you, subject to the restrictions of these Terms and
          any third-party intellectual property limitations.
        </p>
        <p>
          However, by using the platform, you grant Wild Mind AI a perpetual, non-exclusive, worldwide, royalty-free
          license to display any user-generated content for purposes including marketing, portfolio display,
          demonstrations, platform examples, and advertising. You further grant the Company the right to use generated
          content for the improvement, refinement, research, and training of systems unless an opt-out mechanism is
          legally required and provided.
        </p>
        <p>
          You may request removal of publicly showcased content through a formal written request to the support email,
          and compliance shall be subject to verification and reasonable timeframes.
        </p>

        <h3>8. Payments, Credits, Billing, and Auto-Renewal</h3>
        <p>
          Wild Mind AI offers one-time credit purchases, monthly subscription plans, annual subscription plans, and
          usage-based API billing. All financial transactions are processed digitally through approved payment
          gateways.
        </p>
        <p>
          All subscription plans renew automatically at the end of each billing cycle unless canceled by the user prior
          to renewal. You authorize the Company and its payment gateway partners to charge your selected payment method
          for recurring payments.
        </p>
        <p>
          If a transaction fails or is declined, access to certain features or credits may be temporarily suspended
          until payment issues are resolved. Applicable taxes, including GST or others as per regional laws, shall be
          added to the final billing amount.
        </p>

        <h3>9. Refund and Cancellation Terms</h3>
        <p>
          Refunds are governed strictly by the Wild Mind AI Refund and Cancellation Policy. In general, refunds are not
          issued for credits already used, subscription cycles that have already commenced, or cases where services have
          been delivered successfully.
        </p>
        <p>
          Refunds may be granted in exceptional cases such as duplicate billing, technical malfunctions, or other
          scenarios outlined in the official policy. Cancellation of a subscription halts future billing but does not
          entitle the user to a refund of past payments.
        </p>

        <h3>10. Digital Delivery of Services</h3>
        <p>
          Wild Mind AI provides exclusively digital services. No physical product or shipment is involved at any stage.
          Delivery is defined as the successful activation of your account, the allocation of credits, the activation of
          subscription benefits, or access to API endpoints. All services are considered delivered upon system
          confirmation of activation.
        </p>

        <h3>11. API Access and Usage Requirements</h3>
        <p>
          To utilize the API services, users must obtain and maintain a valid API key. You are responsible for keeping
          your API key confidential. Any activity conducted via your API key shall be deemed activity conducted by you.
        </p>
        <p>
          You agree to obey rate limits, safety restrictions, and all technical parameters specified by Wild Mind AI.
          The Company may revoke or suspend API access in cases of unsafe usage, excessive error rates, abuse of
          credits, or violation of provider policies.
        </p>

        <h3>12. Prohibited Conduct</h3>
        <p>
          You shall not attempt to reverse engineer, extract model weights, circumvent credit systems, scrape platform
          data, or perform any form of unauthorized analysis or interference with the platform or its underlying
          models.
        </p>

        <h3>13. Disclaimer of Warranties</h3>
        <p>
          The platform and all services are provided on an “as-is” and “as-available” basis. The Company does not
          warrant that generated content will be accurate, free of bias, reliable, safe, or suitable for your specific
          use case. You acknowledge that artificial intelligence systems may produce unexpected, erroneous, or
          inappropriate outputs, and you assume all responsibility for reviewing, evaluating, and verifying such outputs
          before use.
        </p>

        <h3>14. Limitation of Liability</h3>
        <p>
          To the maximum extent permissible under applicable law, Wild Mind AI and Wild Child Studios shall not be
          liable for any indirect, incidental, special, consequential, or punitive damages arising from your use or
          inability to use the platform. The Company’s cumulative liability shall not exceed the total amount paid by
          you to the Company in the three months preceding the event giving rise to the claim.
        </p>

        <h3>15. Termination of Access</h3>
        <p>
          The Company reserves the right to suspend or permanently revoke access to any user account or API key that
          violates these Terms, engages in fraudulent or harmful activity, or interferes with the safety, integrity, or
          proper functioning of the platform.
        </p>
        <p>
          You may terminate your account at any time by contacting customer support or using platform settings where
          available.
        </p>

        <h3>16. Governing Law</h3>
        <p>
          These Terms shall be governed by and interpreted in accordance with the laws of India, and all disputes shall
          be subject to the exclusive jurisdiction of the courts located in Delhi, India.
        </p>

        <h3>17. Modifications to Terms</h3>
        <p>
          The Company may revise or update these Terms periodically. Continued use of the platform following posted
          revisions constitutes acceptance of the updated Terms. Significant changes may be communicated through email
          or platform notifications.
        </p>

        <h3>18. Contact Information</h3>
        <p>For any questions regarding these Terms or any aspect of Wild Mind AI, you may contact:</p>
        <p>
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

export default TermsOfServicePage;

