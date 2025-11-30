'use client';

import React from 'react';
import LegalLayout from './LegalLayout';

const APITermsPage: React.FC = () => {
  return (
    <LegalLayout currentPage="api-terms">
      <div className="legal-header">
        <h1 id="api-terms">Third-Party API Terms & Compliance</h1>
        <h2>Wild Mind AI by Wild Child Studios</h2>
        <p><strong>Effective Date:</strong> October 4, 2025</p>
      </div>

      <div className="legal-content">
        <p>
          This document establishes the user's mandatory compliance obligations related to the third-party foundation models and Application Programming Interfaces (APIs) that Wild Mind AI by Wild Child Studios (the "Company") utilizes to power the Service.
        </p>

        <h3>1. Scope and Relationship to Underlying Providers</h3>
        <p>
          You acknowledge that Wild Mind AI by Wild Child Studios relies upon, integrates, and consumes Application Programming Interfaces (APIs) and foundation models provided by various external, third-party vendors (collectively, the "Underlying Providers") to perform core generative functions and create the Output Content you request.
        </p>
        
        <p>
          <strong>Intermediary Role:</strong> Wild Mind AI acts solely as the technical intermediary and integrator, providing you with access to the outputs of these Underlying Providers. You understand that there is no direct contractual relationship between you and the Underlying Providers.
        </p>
        
        <p>
          <strong>Flow-Down Mandate:</strong> By using the Wild Mind AI Service, you are contractually agreeing to abide by the necessary and applicable compliance requirements, terms of use, and acceptable use policies (AUPs) of the respective Underlying Providers. Your failure to comply with an Underlying Provider's terms constitutes a material breach of your agreement with Wild Mind AI by Wild Child Studios.
        </p>

        <h3>2. Mandatory Compliance with Flow-Down Terms</h3>
        <p>
          Your use of the Service is strictly conditioned upon your compliance with the following obligations, which flow down from the Underlying Providers:
        </p>
        
        <p>
          <strong>Content Restrictions:</strong> You are strictly prohibited from using the Service to generate any content that violates the AUPs of the Underlying Providers. This includes, but is not limited to, content related to child sexual abuse material, non-consensual intimate imagery, hate speech, illegal activities, or severe harassment.
        </p>
        
        <p>
          <strong>Export Control:</strong> You represent and warrant that neither you nor the Output Content generated will violate any applicable U.S. or international export control laws or sanctions lists, as these are strict requirements often mandated by the Underlying Providers.
        </p>
        
        <p>
          <strong>Security and Abuse:</strong> You must not engage in any activity that attempts to circumvent the security or access controls of the Underlying Providers, including unauthorized attempts to reverse-engineer, scrape, or perform denial-of-service attacks against their APIs via the Wild Mind AI platform.
        </p>

        <h3>3. Liability, Disclaimer, and Enforcement</h3>
        <p>
          <strong>Enforcement Right:</strong> Wild Mind AI reserves the right to immediately suspend or terminate your account if an Underlying Provider notifies us that your account or generated content is in violation of their terms or policies. This is a critical action necessary to maintain our operational access to the third-party services.
        </p>
        
        <p>
          <strong>Disclaimer:</strong> Wild Mind AI explicitly disclaims all liability for the acts, omissions, or failures of any Underlying Provider, including model outages, API errors, changes to their terms, or inaccuracies in the data they provide. Your exclusive recourse for service failures remains against Wild Mind AI by Wild Child Studios under the Terms of Service.
        </p>
        
        <p>
          <strong>Strict Standard:</strong> Where a prohibition exists in both the Wild Mind AI Acceptable Use Policy (AUP) and the Underlying Provider's terms, the stricter restriction shall apply to your use of the Service.
        </p>
      </div>
    </LegalLayout>
  );
};

export default APITermsPage;

