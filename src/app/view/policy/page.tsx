'use client'

import React, { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import AUPPage from './components/AUPPage'
import APITermsPage from './components/APITermsPage'
import CookiePolicyPage from './components/CookiePolicyPage'
import DMCAPolicyPage from './components/DMCAPolicyPage'
import PrivacyPolicyPage from './components/PrivacyPolicyPage'
import ServiceRelationshipPage from './components/ServiceRelationshipPage'
import TermsOfServicePage from './components/TermsOfServicePage'
import ThirdPartyLicensesPage from './components/ThirdPartyLicensesPage'

const PolicyPageContent = () => {
  const searchParams = useSearchParams()
  const router = useRouter()
  const currentPage = searchParams.get('page') || 'aup'

  const handleNavigate = (page: string) => {
    router.push(`/view/policy?page=${page}`)
  }

  switch (currentPage) {
    case 'api-terms':
      return <APITermsPage onNavigate={handleNavigate} currentPage={currentPage} />
    case 'cookie':
      return <CookiePolicyPage onNavigate={handleNavigate} currentPage={currentPage} />
    case 'dmca':
      return <DMCAPolicyPage onNavigate={handleNavigate} currentPage={currentPage} />
    case 'privacy':
      return <PrivacyPolicyPage onNavigate={handleNavigate} currentPage={currentPage} />
    case 'relationship':
      return <ServiceRelationshipPage onNavigate={handleNavigate} currentPage={currentPage} />
    case 'tos':
      return <TermsOfServicePage onNavigate={handleNavigate} currentPage={currentPage} />
    case 'thirdparty':
      return <ThirdPartyLicensesPage onNavigate={handleNavigate} currentPage={currentPage} />
    case 'aup':
    default:
      return <AUPPage onNavigate={handleNavigate} currentPage={currentPage} />
  }
}

export default function PolicyPage() {
  return (
    <div style={{ backgroundColor: '#000000', minHeight: '100vh' }}>
      <Suspense fallback={<div className="text-white/70 p-6">Loading policy...</div>}>
        <PolicyPageContent />
      </Suspense>
    </div>
  )
}

