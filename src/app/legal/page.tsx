import LegalLayout from '@/app/view/Legal/components/LegalLayout';
import Link from 'next/link';
import { LEGAL_ROUTES } from '@/routes/routes';

export default function LegalNoticePage() {
  return (
    <LegalLayout currentPage="legal">
      <div className="legal-header">
        <h1>Legal Notice</h1>
        <h2>Wild Mind AI by Wild Child Studios</h2>
        <p><strong>Effective Date:</strong> October 4, 2025</p>
      </div>

      <div className="legal-content">
        <p>
          Welcome to the Wild Mind AI legal documentation portal. This page provides access to all legal documents
          governing your use of our Service. Please review these documents carefully.
        </p>

        <h3>Legal Documents</h3>
        <ul>
          <li>
            <Link href={LEGAL_ROUTES.TERMS} className="text-blue-400 hover:text-blue-300 underline">
              Terms of Service (TOS)
            </Link>
          </li>
          <li>
            <Link href={LEGAL_ROUTES.PRIVACY} className="text-blue-400 hover:text-blue-300 underline">
              Privacy Policy
            </Link>
          </li>
          <li>
            <Link href={LEGAL_ROUTES.COOKIES} className="text-blue-400 hover:text-blue-300 underline">
              Cookie Policy
            </Link>
          </li>
          <li>
            <Link href={LEGAL_ROUTES.AUP} className="text-blue-400 hover:text-blue-300 underline">
              Acceptable Use Policy (AUP)
            </Link>
          </li>
          <li>
            <Link href={LEGAL_ROUTES.DMCA} className="text-blue-400 hover:text-blue-300 underline">
              DMCA Policy
            </Link>
          </li>
          <li>
            <Link href={LEGAL_ROUTES.API_TERMS} className="text-blue-400 hover:text-blue-300 underline">
              API Terms of Use
            </Link>
          </li>
          <li>
            <Link href={LEGAL_ROUTES.RELATIONSHIP} className="text-blue-400 hover:text-blue-300 underline">
              Service Relationship & Terms Hierarchy Document
            </Link>
          </li>
          <li>
            <Link href={LEGAL_ROUTES.THIRD_PARTY} className="text-blue-400 hover:text-blue-300 underline">
              Third-Party Licenses & Attribution Policy
            </Link>
          </li>
        </ul>

        <h3>Contact Information</h3>
        <p>
          For questions regarding these legal documents, please contact us through our support channels.
        </p>
      </div>
    </LegalLayout>
  );
}

