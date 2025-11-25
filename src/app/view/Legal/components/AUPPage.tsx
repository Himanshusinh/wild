'use client';

import React from 'react';
import LegalLayout from './LegalLayout';

const AUPPage: React.FC = () => {
  return (
    <LegalLayout currentPage="aup">
      <div className="legal-header">
        <h1 id="aup">Acceptable Use Policy (AUP)</h1>
        <h2 id="relationship">Wild Mind AI by Wild Child Studios</h2>
        <p><strong>Effective Date:</strong> October 4, 2025</p>
      </div>

      <div className="legal-content">
        <p>
          This Acceptable Use Policy (AUP) governs the standards of conduct and content for all users of the
          <strong> Wild Mind AI by Wild Child Studios</strong> Service. Violation of this AUP constitutes a
          material breach of the Terms of Service and may result in immediate account suspension or termination.
        </p>
    
        <h3 id="aup-prohibited">1. Prohibited Content (All Media Types)</h3>
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

        <h3 id="aup-restrictions">2. Restrictions on Generative Media and Biometric Data</h3>
        <p>
          Due to the sensitive nature of generative AI, the following specific restrictions apply:
        </p>

        <div className="legal-table-container">
          <table className="legal-table">
            <thead>
              <tr>
                <th>Prohibited Activity</th>
                <th>Specific Requirement / Restriction</th>
                <th>Underlying Risk / Citation</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Non-Consensual Imagery (Deepfakes)</strong></td>
                <td>
                  Absolute prohibition on generating non-consensual intimate imagery (NCII) or explicit content of
                  identifiable individuals without their explicit, verified, and legal consent.
                </td>
                <td>Non-Consensual Intimate Imagery (NCII) / Privacy Violation.</td>
              </tr>
              <tr>
                <td><strong>Unauthorized Voice Cloning</strong></td>
                <td>
                  Users must possess and retain documented, explicit, and verifiable consent from the individual whose
                  voice is being cloned. The user bears the burden of proof for consent.
                </td>
                <td>Biometric Data Privacy Laws (GDPR, CCPA) / Personality Rights.</td>
              </tr>
              <tr>
                <td><strong>Sexually Explicit Content</strong></td>
                <td>
                  Content created for the purpose of pornography or sexual gratification is strictly prohibited.
                </td>
                <td>Platform liability for inappropriate content.</td>
              </tr>
              <tr>
                <td><strong>Trademark/Logo Generation</strong></td>
                <td>
                  Generating identifiable corporate logos, registered trademarks, or copyrighted characters is prohibited unless you own or have explicit authorization to use them.
                </td>
                <td>Trademark and Copyright Infringement</td>
              </tr>
              <tr>
                <td><strong>Copyright Infringement (Style Mimicry)</strong></td>
                <td>
                  While general artistic style or technique imitation is generally permissible, generating output that copies specific, expressive choices or protectable features of an existing copyrighted work is prohibited and constitutes a violation of this AUP.
                </td>
                <td>Copyright Liability / DMCA Safe Harbor.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3 id="aup-enforcement">3. Enforcement and Strike System</h3>
        <p>
          Wild Mind AI by Wild Child Studios employs a combination of automated content monitoring systems and human review processes to detect AUP violations.
        </p>

        <p><strong>Strike System:</strong> Violations are addressed via a tiered strike system:</p>
        <ul>
          <li><strong>Strike 1:</strong> Formal warning and temporary suspension of generation privileges.</li>
          <li><strong>Strike 2:</strong> Further temporary account suspension (e.g., 7 days).</li>
          <li><strong>Strike 3:</strong> Permanent termination of the account and prohibition from creating new accounts (in line with the Repeat Infringer Policy).</li>
        </ul>

        <p><strong>Immediate Termination:</strong> Content relating to CSAE or NCII will result in immediate, permanent termination and mandatory reporting to law enforcement, regardless of any prior strike count.</p>
      </div>
    </LegalLayout>
  );
};

export default AUPPage;

