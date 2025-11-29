'use client';

import React from 'react';
import LegalLayout from './LegalLayout';

const ServiceRelationshipPage: React.FC = () => {
  return (
    <LegalLayout currentPage="relationship">
      <div className="legal-header">
        <h1 id="relationship">Service Relationship & Terms Hierarchy Document</h1>
        <h2>Wild Mind AI by Wild Child Studios</h2>
        <p><strong>Effective Date:</strong> October 4, 2025</p>
      </div>

      <div className="legal-content">
        <p>
          This document establishes the binding legal relationship between the user and Wild Mind AI by Wild Child Studios (the "Company," "we," "us," or "our") and defines the definitive order of precedence for all governing legal agreements.
        </p>

        <h3>1. Legal Entity and Relationship</h3>
        <p>
          The user acknowledges and agrees that Wild Mind AI is a product and service offered under the corporate structure of Wild Child Studios. By agreeing to any of the Wild Mind AI Terms and Policies listed below, the user is concurrently agreeing to and bound by the foundational legal terms of Wild Child Studios, including any relevant Master Entity Agreement or General Business Terms, which are incorporated by reference. The policies listed herein are supplementary to, and governed by, the Wild Child Studios corporate structure.
        </p>

        <h3>2. Agreement Components and Nature</h3>
        <p>
          The legal relationship between the Company and the user is governed by the following documents, which are incorporated by reference. Each document applies to specific aspects of the user's interaction with the Service, and all are legally binding.
        </p>

        <div className="legal-table-container">
          <table className="legal-table">
            <thead>
              <tr>
                <th>Document Name</th>
                <th>Purpose</th>
                <th>Scope of Application</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Terms of Service (TOS)</strong></td>
                <td>The Master Agreement governing general access, account creation, billing, IP assignment, and dispute resolution.</td>
                <td>All users (B2C and B2B) accessing the web platform or general services.</td>
              </tr>
              <tr>
                <td><strong>Third-Party API Terms & Compliance</strong></td>
                <td>Governs the user's mandatory compliance obligations flowing down from the underlying third-party generative models and APIs utilized by Wild Mind AI.</td>
                <td>All users consuming services that rely on third-party generative models.</td>
              </tr>
              <tr>
                <td><strong>Acceptable Use Policy (AUP)</strong></td>
                <td>Details specific content restrictions, behavioral guidelines, and enforcement actions (e.g., deepfakes, copyright, violence).</td>
                <td>All user inputs, outputs, and behaviors on the Service.</td>
              </tr>
              <tr>
                <td><strong>Privacy Policy (PP)</strong></td>
                <td>Governs the collection, use, security, and storage of user personal data (including biometric identifiers).</td>
                <td>All users providing Personal Information or sensitive data to the Service.</td>
              </tr>
              <tr>
                <td><strong>DMCA Policy</strong></td>
                <td>Outlines procedures for copyright infringement claims and safe harbor protections.</td>
                <td>All user-generated AI content and material where copyright is asserted.</td>
              </tr>
              <tr>
                <td><strong>Cookie Policy (CP)</strong></td>
                <td>Details the use of cookies and tracking technologies, and the mechanism for consent management.</td>
                <td>All visitors to the Wild Mind AI website interface.</td>
              </tr>
              <tr>
                <td><strong>Third-Party Licenses & Attribution</strong></td>
                <td>Specifies compliance obligations for open-source components, models, and required user attributions.</td>
                <td>All commercial and public sharing of AI-generated output derived from the Service.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3>3. Order of Precedence (Conflict Resolution)</h3>
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

        <h3>4. Version Control and Updates</h3>
        <ul>
          <li>
            <strong>Non-Material Changes:</strong> Changes deemed non-material (e.g., clarification or minor edits) are effective upon posting the revised version.
          </li>
          <li>
            <strong>Material Changes:</strong> For material changes that substantively alter the user's rights, obligations, or data handling (e.g., changes to the Limitation of Liability or data sharing practices), the Company shall provide the user with at least thirty (30) days' prior written notice (via email or in-service notification) before the changes take effect.
          </li>
          <li>
            <strong>Archival:</strong> The Company shall maintain a publicly accessible archive of all previous document versions.
          </li>
        </ul>
      </div>
    </LegalLayout>
  );
};

export default ServiceRelationshipPage;

