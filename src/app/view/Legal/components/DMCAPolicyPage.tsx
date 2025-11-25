'use client';

import React from 'react';
import LegalLayout from './LegalLayout';

const DMCAPolicyPage: React.FC = () => {
  return (
    <LegalLayout currentPage="dmca">
      <div className="legal-header">
        <h1 id="dmca">DMCA Policy</h1>
        <h2>Designated Agent for Wild Mind AI by Wild Child Studios</h2>
        <p><strong>Effective Date:</strong> October 4, 2025</p>
      </div>

      <div className="legal-content">
        <p>
          This Digital Millennium Copyright Act (DMCA) Policy is established by Wild Mind AI by Wild Child Studios to comply with 17 U.S.C. § 512 and to protect our status as a Service Provider eligible for "safe harbor" liability limitations for user-generated content.
        </p>

        <h3>1. Designated Agent Contact Information</h3>
        <p>
          The Company's Designated Agent to receive notifications of claimed infringement is:
        </p>
        
        <div>
          <p><strong>Designated Agent</strong></p>
          <p>Wild Mind AI DMCA Agent</p>
          <p><strong>Email Address</strong></p>
          <p>info@wildchildstudios.com</p>
          <p><strong>Physical Address</strong></p>
          <p>
            511 Satyamev Eminence,<br />
            Science City Road,<br />
            Sola, Ahmedabad 380 060<br />
            Gujarat, India<br />
            [Head Office]
          </p>
        </div>

        <p>
          <strong>Note:</strong> This information is published for informational purposes. The Company will complete the formal registration of the Designated Agent with the U.S. Copyright Office immediately upon entity registration, as legally required to maintain Safe Harbor status.
        </p>

        <h3>2. Requirements for a Valid Takedown Notice</h3>
        <p>
          To be effective, a notification of claimed infringement (a "Takedown Notice") must be a written communication provided to the Designated Agent and must substantially include all of the following elements:
        </p>
        
        <ul>
          <li>
            <strong>Signature:</strong> A physical or electronic signature of a person authorized to act on behalf of the owner of an exclusive right that is allegedly infringed.
          </li>
          <li>
            <strong>Identification of Work:</strong> Identification of the copyrighted work claimed to have been infringed, or, if multiple copyrighted works are covered by a single notification, a representative list of such works.
          </li>
          <li>
            <strong>Identification of Infringement:</strong> Identification of the specific AI-generated material that is claimed to be infringing (e.g., specific Output Content URL, Job ID, or unique identifier) and information reasonably sufficient to permit the Service Provider to locate the material.
          </li>
          <li>
            <strong>Contact Information:</strong> Contact information sufficient to allow the Service Provider to contact the complaining party.
          </li>
          <li>
            <strong>Good Faith Statement:</strong> A statement that the complaining party has a good faith belief that use of the material in the manner complained of is not authorized by the copyright owner, its agent, or the law.
          </li>
          <li>
            <strong>Accuracy/Perjury Statement:</strong> A statement that the information in the notification is accurate, and under penalty of perjury, that the complaining party is authorized to act on behalf of the owner of an exclusive right that is allegedly infringed.
          </li>
        </ul>

        <h3>3. Takedown and Counter-Notice Procedure</h3>
        <ul>
          <li>
            <strong>Action upon Notice:</strong> Upon receipt of a valid Takedown Notice, the Company will act expeditiously to remove or disable access to the identified infringing material.
          </li>
          <li>
            <strong>Counter-Notice:</strong> The user who posted the material may submit a counter-notice. The counter-notice must include a sworn statement, under penalty of perjury, asserting that the material was removed or disabled as a result of mistake or misidentification.
          </li>
          <li>
            <strong>Restoration:</strong> Upon receipt of a valid counter-notice, the Company will send a copy to the original complaining party. Unless the Designated Agent is informed within ten (10) to fourteen (14) business days that the complaining party has filed an action seeking a court order restraining the user from engaging in the infringing activity, the Company may restore the removed content.
          </li>
        </ul>

        <h3>4. Repeat Infringer Policy</h3>
        <p>
          The Company has adopted a mandatory policy that provides for the immediate termination of the accounts of users who are determined to be repeat copyright infringers across any type of generated content (image, video, audio). This policy is enforced via the AUP's tiered strike system.
        </p>
      </div>
    </LegalLayout>
  );
};

export default DMCAPolicyPage;

