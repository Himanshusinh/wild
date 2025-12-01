'use client';

import React from 'react';
import LegalLayout from './LegalLayout';

const AUPPage: React.FC = () => {
  return (
    <LegalLayout currentPage="aup">
      <div className="legal-header">
        <h1 id="aup">AI Usage Policy / Acceptable Use Policy (AUP)</h1>
        <h2>Wild Mind AI by Wild Child Studios</h2>
        <p>
          <strong>Last Updated:</strong> 29-12-2025
        </p>
      </div>

      <div className="legal-content">
        <h3>1. Introduction</h3>
        <p>
          This AI Usage Policy, also referred to as the Acceptable Use Policy (AUP), governs how users may access and
          utilize the artificial intelligence tools, APIs, and generation capabilities offered by Wild Mind AI, a
          product developed by Wild Child Studios. The purpose of this Policy is to ensure lawful, responsible,
          ethical, and safe use of AI technologies and to protect the platform, its users, and the broader public from
          misuse.
        </p>
        <p>
          By creating an account, generating content, interacting with AI models, or accessing any functionality of the
          platform, you agree to comply with this AUP in full. Violation of this Policy may result in immediate account
          action as described in this document.
        </p>

        <h3>2. General Standards of Use</h3>
        <p>
          Users must conduct themselves in a manner that is lawful, ethical, respectful, and compliant with all
          applicable regulations, industry standards, and provider safety policies. Users are responsible for all
          content they create and all actions taken through their account or API key. All users must adhere to the
          policies of third-party AI providers integrated into Wild Mind AI.
        </p>

        <h3>3. Prohibited Content</h3>
        <p>
          The creation, upload, distribution, or promotion of the following categories of content is strictly forbidden
          on Wild Mind AI:
        </p>
        <ul>
          <li>
            <strong>Illegal Content:</strong> Any content that violates the laws of India, international regulations,
            or the jurisdiction of the user.
          </li>
          <li>
            <strong>Violence or Gore:</strong> Graphic, harmful, or traumatizing depictions of violence or injury.
          </li>
          <li>
            <strong>Hate Speech:</strong> Content targeting individuals or groups based on race, gender, nationality,
            religion, orientation, or other protected attributes.
          </li>
          <li>
            <strong>Harassment or Bullying:</strong> Content intended to intimidate, threaten, belittle, or cause
            psychological harm.
          </li>
          <li>
            <strong>NSFW or Adult Content:</strong> Explicit sexual content, pornography, sexualized imagery, or fetish
            material.
          </li>
          <li>
            <strong>Child Sexual Abuse Material (CSAM):</strong> Absolutely prohibited under all circumstances. Any
            attempt to generate such content will result in immediate and permanent account termination and reporting to
            authorities.
          </li>
          <li>
            <strong>Malware or Hacking Content:</strong> Content that facilitates the creation, execution, or
            distribution of malicious software, exploits, or unauthorized access tools.
          </li>
          <li>
            <strong>Medical or Legal Advice:</strong> Content representing itself as professional medical, legal, or
            regulated advice.
          </li>
          <li>
            <strong>Biometric Identification:</strong> Content used for face matching, identity verification, or
            biometric recognition.
          </li>
          <li>
            <strong>Fraud or Scam Content:</strong> Content intended to deceive, defraud, or manipulate individuals for
            personal or financial gain.
          </li>
          <li>
            <strong>Religious Extremism:</strong> Content that promotes or glorifies extremist ideologies or harmful
            religious activities.
          </li>
          <li>
            <strong>Weapons Manufacturing Instructions:</strong> Information enabling construction, procurement, or
            usage of weapons.
          </li>
          <li>
            <strong>Financial Manipulation or &quot;Get-Rich&quot; Schemes:</strong> Content promising unrealistic
            financial returns or encouraging irresponsible investment behavior.
          </li>
        </ul>

        <h3>4. Restricted Content Categories</h3>
        <p>Certain content categories are sensitive but permitted under limited conditions:</p>
        <ul>
          <li>
            <strong>Deepfakes of Private Individuals:</strong> Allowed only if the user has explicit consent from the
            person being depicted. The user assumes full responsibility for compliance.
          </li>
          <li>
            <strong>Political Content and Election Influence:</strong> Informational or artistic political content is
            permitted. Attempts to influence elections or political outcomes are prohibited.
          </li>
          <li>
            <strong>Identity Impersonation:</strong> Allowed only when used for fictional, creative, or satirical
            purposes and not intended to deceive, defraud, or mislead real individuals.
          </li>
        </ul>
        <p>
          Users generating such content must ensure compliance with all legal and ethical standards. The platform
          reserves the right to restrict content that crosses sensitive boundaries.
        </p>

        <h3>5. Disallowed User Behavior</h3>
        <p>Users are strictly prohibited from:</p>
        <ul>
          <li>Attempting to bypass safety systems, filters, or restrictions.</li>
          <li>Reverse engineering, extracting, or analyzing AI model weights, prompts, or datasets.</li>
          <li>Using the platform to train competing AI models or datasets.</li>
          <li>Selling, sublicensing, or redistributing API access, credits, or output rights.</li>
          <li>
            Generating misleading, deceptive, or harmful content intended to misinform or manipulate individuals or the
            public.
          </li>
          <li>
            Any attempt to evade, exploit, or undermine platform safeguards will be treated as a serious violation.
          </li>
        </ul>

        <h3>6. User Age Requirements</h3>
        <p>
          Users aged 11 years and above may access and use generation features. Users aged 16 years and above may
          engage in financial transactions, including subscriptions and credit purchases. Users below the required age
          thresholds must not use the platform unless legally permitted under verified guardian supervision.
        </p>

        <h3>7. Responsible Use of Generated Content</h3>
        <p>
          Users bear full responsibility for how they use content produced by the platform. While Wild Mind AI allows
          commercial use of outputs, such use must remain compliant with this AUP, applicable laws, intellectual
          property rights, ethical and safety standards, and provider policies. Wild Mind AI disclaims responsibility
          for misuse or misrepresentation of user-generated outputs.
        </p>

        <h3>8. Ownership of Generated Content</h3>
        <p>
          Users retain full ownership rights over the content they generate, subject to the AI Content Ownership Policy.
          Users must ensure that generated content is used legally, ethically, and in accordance with this AUP.
        </p>

        <h3>9. Compliance with Third-Party AI Provider Policies</h3>
        <p>
          Wild Mind AI integrates multiple third-party AI systems. By using the platform, users automatically agree to
          all applicable provider usage, safety, and content policies documented in the Company’s internal API provider
          sheet. Any violation of third-party provider rules constitutes a violation of this AUP. The Company reserves
          the right to enforce immediate account suspension for breaches of provider policies. Users are responsible for
          reviewing and adhering to associated restrictions.
        </p>

        <h3>10. Enforcement and Penalties</h3>
        <p>
          To maintain platform safety and legal compliance, Wild Mind AI may take any of the following actions in
          response to violations of this Policy:
        </p>
        <ul>
          <li>Temporary suspension of account or API access.</li>
          <li>Permanent ban for severe or repeated violations.</li>
          <li>Loss or forfeiture of credits.</li>
          <li>
            Reporting illegal, harmful, or criminal content or behavior to law enforcement without prior notice where
            required.
          </li>
        </ul>
        <p>
          Wild Mind AI may take additional actions deemed necessary to ensure platform integrity and user safety. Users
          are encouraged to report any content or behavior that appears to violate this Policy to
          {' '}
          <a href="mailto:connect@wildmindai.com">connect@wildmindai.com</a>.
        </p>
      </div>
    </LegalLayout>
  );
};

export default AUPPage;

