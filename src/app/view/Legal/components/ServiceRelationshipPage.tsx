'use client';

import React from 'react';
import LegalLayout from './LegalLayout';

const ServiceRelationshipPage: React.FC = () => {
  return (
    <LegalLayout currentPage="relationship">
      <div className="legal-header">
        <h1 id="relationship">AI Content Ownership Policy</h1>
        <h2>Wild Mind AI by Wild Child Studios</h2>
        <p>
          <strong>Last Updated:</strong> 29-12-2025
        </p>
      </div>

      <div className="legal-content">
        <h3>1. Introduction</h3>
        <p>
          This AI Content Ownership Policy (“Policy”) sets forth the rights, responsibilities, and ownership structure
          associated with user-generated outputs, prompts, data, and other materials produced through the Wild Mind AI
          platform. This Policy governs the relationship between Wild Mind AI, a product developed by Wild Child
          Studios, and the user (“you,” “your,” or “the user”) with respect to all content created using the platform’s
          artificial intelligence tools, models, and APIs. By generating content, interacting with the platform, or
          accessing any AI functionality, you acknowledge and agree to the terms and conditions set forth in this
          Policy.
        </p>

        <h3>2. Ownership of User-Generated Outputs</h3>
        <p>
          Users retain full ownership rights over all outputs generated using Wild Mind AI, including but not limited to
          images, audio, video, text, and any other media formats produced through the platform. This ownership extends
          to personal use, commercial use, publication and distribution, modification and derivative works, and
          marketing or branding usage. Users have the unrestricted right to use, license, sell, or otherwise exploit the
          content they generate, subject to applicable law and third-party provider terms.
        </p>

        <h3>3. Ownership Rights Retained by Wild Mind AI</h3>
        <p>In addition to the user’s ownership, Wild Mind AI retains the following rights over user-generated content:</p>
        <ul>
          <li>
            <strong>Commercial Rights:</strong> Wild Mind AI maintains the right to commercially use, display,
            publish, market, or otherwise leverage user-generated content for business operations, demonstrations,
            product showcases, and promotional campaigns.
          </li>
          <li>
            <strong>Marketing and Portfolio Use:</strong> The Company may showcase user-generated content on websites,
            social media platforms, product materials, or public exhibitions to demonstrate platform capabilities.
          </li>
          <li>
            <strong>Product and Feature Demonstrations:</strong> The Company may use user outputs in presentations,
            tutorials, documentation, samples, and feature previews.
          </li>
          <li>
            <strong>AI Model Improvement and Training:</strong> The Company may use, review, or analyze generated
            outputs internally to improve AI systems, enhance safety, train models, or evaluate performance, unless an
            opt-out mechanism becomes legally mandated and is made available to users.
          </li>
        </ul>
        <p>
          These rights are non-exclusive, perpetual, worldwide, and royalty-free. They are exercised in a manner
          consistent with the Privacy Policy and applicable regulations.
        </p>

        <h3>4. User Rights to Request Removal</h3>
        <p>
          Users may request the removal of any showcased content that features their generated outputs. Upon
          verification, Wild Mind AI will make reasonable efforts to remove the content from public display, subject to
          technical feasibility, caching, archival systems, and third-party indexing limitations. Requests may be
          submitted to
          {' '}
          <a href="mailto:connect@wildmindai.com">connect@wildmindai.com</a>.
        </p>

        <h3>5. Use of User Prompts, Inputs, and Metadata</h3>
        <p>
          Wild Mind AI may store, analyze, and use user prompts, uploaded assets, and related metadata for platform
          improvement, safety and compliance monitoring, debugging and incident analysis, training and refining internal
          AI systems, and enhancing model accuracy, stability, and reliability. Prompts and related data are handled in
          accordance with the platform’s Privacy Policy and third-party provider requirements.
        </p>

        <h3>6. Subject to Third-Party Provider Agreements</h3>
        <p>
          Some AI output rights may be influenced by the licensing terms of third-party AI providers integrated into
          Wild Mind AI. Accordingly, user ownership rights are subject to the output rights granted by the respective
          third-party AI providers. This may include conditions on allowed use cases, attribution requirements,
          commercial usage rights, and output redistribution rules. Users are responsible for reviewing and complying
          with any additional restrictions imposed by those providers. Wild Mind AI will provide a list of provider
          policies upon request or as required by law.
        </p>

        <h3>7. Prohibited Uses of Generated Content</h3>
        <p>
          Although users own the outputs they create, such content may not be used in ways that violate the AI Usage
          Policy / Acceptable Use Policy, any applicable laws, terms of third-party API providers, intellectual
          property rights of others, or ethical guidelines and platform safety requirements. Users remain fully
          responsible for ensuring that their generated outputs do not infringe upon the rights or safety of any
          individual or entity.
        </p>

        <h3>8. Limitation of Liability</h3>
        <p>
          Wild Mind AI shall not be held responsible for any misuse of generated content by users, legal, ethical, or
          regulatory consequences resulting from how users publish, distribute, or commercialize their outputs, claims
          arising from the user’s improper or unlawful use of generated content, or violations of third-party rights,
          including copyright or privacy rights, arising from user actions. The user assumes full legal responsibility
          for all uses and consequences of their generated outputs.
        </p>

        <h3>9. Modifications to This Policy</h3>
        <p>
          Wild Mind AI may revise, update, or modify this Policy at any time to reflect changes in technology, legal
          requirements, or platform operations. Updated versions will be posted on the platform. Continued use of the
          service constitutes acceptance of the modified Policy.
        </p>

        <h3>10. Contact Information</h3>
        <p>
          For questions, removal requests, or clarification regarding this Policy, users may contact the Wild Mind AI
          Content Rights Team at
          {' '}
          <a href="mailto:connect@wildmindai.com">connect@wildmindai.com</a>.
        </p>
      </div>
    </LegalLayout>
  );
};

export default ServiceRelationshipPage;

