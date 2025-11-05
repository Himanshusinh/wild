'use client'

import React, { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { getImageUrl } from '@/routes/imageroute'
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

const PolicyHeader = () => {
  return (
    <header style={{
      backgroundColor: '#000000',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      padding: '20px 24px',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      backdropFilter: 'blur(10px)',
      background: 'rgba(0, 0, 0, 0.9)'
    }}>
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative'
      }}>
        {/* Logo and WildMind on the left */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image
            src={getImageUrl("core", "logo") || "/placeholder.svg"}
            alt="WildMind Logo"
            width={40}
            height={40}
            style={{ width: '40px', height: '40px', objectFit: 'contain' }}
          />
          <h1 style={{
            margin: 0,
            fontSize: '24px',
            fontWeight: 700,
            color: '#ffffff',
            lineHeight: 1.2
          }}>
            WildMind
          </h1>
        </div>
        
        {/* Company Legal Hub centered */}
        <p style={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          margin: 0,
          fontSize: '30px',
          color: 'rgba(255, 255, 255, 0.7)',
          fontWeight: 400,
          lineHeight: 1.2
        }}>
          Company Legal Hub
        </p>
        
        {/* Spacer to balance the layout */}
        <div style={{ width: '140px' }}></div>
      </div>
    </header>
  )
}

export default function PolicyPage() {
  return (
    <div style={{ backgroundColor: '#000000', minHeight: '100vh' }}>
      <PolicyHeader />
      <Suspense fallback={<div className="text-white/70 p-6">Loading policy...</div>}>
        <PolicyPageContent />
      </Suspense>
    </div>
  )
}

