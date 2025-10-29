"use client"
import React from 'react'
import VariableProximity from './VariableProximity'
import { gsap } from 'gsap'

export type FaqItem = {
  question: string
  answer: React.ReactNode
}

interface FAQProps {
  faqs?: FaqItem[]
  maxVisible?: number
  viewMoreDisabled?: boolean
}

const defaultFaqs: FaqItem[] = [
  {
    question: 'What is Wild Mind AI, and how does a multimodal platform work?',
    answer:
      'Wild Mind AI is an all-in-one multimodal AI platform that unifies more than 20 generative tools for creating content across text, images, video, audio, and branding. A multimodal platform integrates diverse data types so it can understand richer context than single‑modality systems; for example, it can generate a video from a text description and an image, producing more accurate, context‑aware, and creative outputs by leveraging the synergy between different inputs.',
  },
  {
    question: "How does Wild Mind AI's credit-based pricing work, and is it affordable?",
    answer:
      'Wild Mind AI uses a flexible, consumption‑based credit model. You only pay for the extra credits you need for the services you actually use, with transparent billing and no heavy markups on underlying model costs compared to typical competitors. This eliminates budget anxiety and lets you scale usage efficiently for each project.',
  },
  {
    question: 'What types of generative tools are included in the platform?',
    answer: (
      <ul className="list-none pl-0 space-y-2">
        <li>
          <span className="font-medium"></span>The Wild Mind AI platform offers a comprehensive suite of tools for diverse creative tasks. This includes robust tools for:
        </li>
        <li>
          <span className="font-medium ml-4">Image Generation:</span> Creating stunning visuals from scratch or enhancing existing designs with models like Stable Diffusion XL, Flux Kontent Pro, and more.
        </li>
        <li>
          <span className="font-medium ml-4">Video Generation:</span> Turning text, images, or concepts into high-quality videos using cutting-edge models like Wan 2.2, Hailu 2.0, and more.
        </li>
        <li>
          <span className="font-medium ml-4">Audio Generation:</span> Composing original music, soundscapes, or generating soundtracks from other media inputs.
        </li>
        <li>
          <span className="font-medium ml-4">Branding & Design:</span> Generating complete branding kits, from logos and mockups to digital ads.
        </li>
        <li>
          <span className="font-medium ml-4">3D Generation:</span> Transforming text and images into high-quality 3D assets for gaming, AR/VR, and product visualization.
        </li>
        <li>
          <span className="font-medium ml-4">Filming Tools:</span> Assisting in scriptwriting, storyboard generation, shot planning, visual pre-visualization, and comic book creation to bring stories from concept to frame.
        </li>
      </ul>
    ),
  },
  {
    question: 'Which AI models does Wild Mind AI use?',
    answer:
      'Wild Mind AI supports a wide range of cutting-edge AI models to give you the best possible output quality. The platform gives you instant access to over 90 AI models without requiring you to manage individual API keys. This includes flagship models from top providers, such as Veo 3 by Google and Flux Krea,    and state-of-the-art models for specific tasks, including Stable Diffusion, Flux Kontext and Playground for images, and Hailu and Kling for video.The ability to compare and use the best model for any given task within a single environment is a key benefit.',
  },
  {
    question: 'How does Wild Mind AI ensure data privacy and security?',
    answer:
      'Wild Mind AI supports a wide range of cutting-edge AI models to give you the best possible output quality. The platform gives you instant access to over 90 AI models without requiring you to manage individual API keys. This includes flagship models from top providers, such as Veo 3 by Google and Flux Krea,    and state-of-the-art models for specific tasks, including Stable Diffusion, Flux Kontext and Playground for images, and Hailu and Kling for video.The ability to compare and use the best model for any given task within a single environment is a key benefit.',
  },
  {
    question: 'Can I use the platform for my business or agency?',
    answer:
      'Yes, Wild Mind AI is designed to support both individual creators and large-scale business operations, including agencies and teams. The platform offers scalable plans with features tailored for commercial use, such as multi-user access, collaboration tools, and API integration for automating workflows. Our business-focused tiers provide the necessary features to manage projects, scale content production, and integrate our powerful tools into your existing systems.',
  },
]

const FAQ: React.FC<FAQProps> = ({ faqs = defaultFaqs, maxVisible = 6, viewMoreDisabled = true }) => {
  const [openSet, setOpenSet] = React.useState<Set<number>>(new Set())
  const visibleFaqs = faqs.slice(0, Math.max(0, maxVisible))

  const headerRef = React.useRef<HTMLDivElement | null>(null)

  return (
    <div className="w-full max-w-8xl mx-auto">
      {/* Keep header as-is (centered) with VariableProximity effect */}
      <div className="text-center" ref={headerRef}>
        <h2 className="text-white inline-block font-bold font-popins text-[2rem] md:text-[2rem] lg:text-[2.3rem] mb-8 md:mb-6 lg:mb-8">
          <VariableProximity
            label={'Frequently Asked Questions'}
            className={''}
            fromFontVariationSettings="'wght' 400"
            toFontVariationSettings="'wght' 900"
            containerRef={headerRef}
            radius={140}
            falloff='linear'
          />
        </h2>
      </div>

      {/* Divider-style list */}
      <div className="border-t border-white/10 divide-y divide-white/10">
        {visibleFaqs.map((item, idx) => (
          <FaqRow
            key={item.question}
            question={item.question}
            isOpen={openSet.has(idx)}
            disableHover={openSet.has(idx)}
            onToggle={() =>
              setOpenSet(prev => {
                const next = new Set(prev)
                if (next.has(idx)) next.delete(idx)
                else next.add(idx)
                return next
              })
            }
          >
            {item.answer}
          </FaqRow>
        ))}
      </div>

      <div className="flex justify-center mt-8">
        <button
          type="button"
          disabled={viewMoreDisabled}
          className="text-white/80 underline underline-offset-4 decoration-white/60 hover:text-white hover:decoration-white transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
        >
          View more
        </button>
      </div>

    </div>
  )
}

export default FAQ

// --- FaqRow with FlowingMenu-like hover overlay ---
interface FaqRowProps {
  question: string
  isOpen: boolean
  disableHover?: boolean
  onToggle: () => void
  children: React.ReactNode
}

const FaqRow: React.FC<FaqRowProps> = ({ question, isOpen, disableHover = false, onToggle, children }) => {
  const itemRef = React.useRef<HTMLDivElement | null>(null)
  const overlayRef = React.useRef<HTMLDivElement | null>(null)
  const overlayInnerRef = React.useRef<HTMLDivElement | null>(null)
  const marqueeTweenRef = React.useRef<gsap.core.Tween | null>(null)
  const contentRef = React.useRef<HTMLDivElement | null>(null)

  const animationDefaults = { duration: 0.6, ease: 'expo' as any }

  const findClosestEdge = (
    mouseX: number,
    mouseY: number,
    width: number,
    height: number
  ): 'top' | 'bottom' => {
    const topEdgeDist = Math.pow(mouseX - width / 2, 2) + Math.pow(mouseY, 2)
    const bottomEdgeDist = Math.pow(mouseX - width / 2, 2) + Math.pow(mouseY - height, 2)
    return topEdgeDist < bottomEdgeDist ? 'top' : 'bottom'
  }

  const onEnter = (ev: React.MouseEvent<HTMLButtonElement>) => {
    if (disableHover || isOpen) return
    if (!itemRef.current || !overlayRef.current || !overlayInnerRef.current) return
    const rect = itemRef.current.getBoundingClientRect()
    const edge = findClosestEdge(ev.clientX - rect.left, ev.clientY - rect.top, rect.width, rect.height)
    const tl = gsap.timeline({ defaults: animationDefaults })
    tl.set(overlayRef.current, { y: edge === 'top' ? '-101%' : '101%' })
      .set(overlayInnerRef.current, { y: edge === 'top' ? '101%' : '-101%', xPercent: 0 })
      .to([overlayRef.current, overlayInnerRef.current], { y: '0%' })

    // start horizontal flowing text (seamless with 200% width content)
    marqueeTweenRef.current?.kill()
    marqueeTweenRef.current = gsap.to(overlayInnerRef.current, {
      xPercent: -50,
      duration: 15,
      ease: 'none',
      repeat: -1,
    })
  }

  const onLeave = (ev: React.MouseEvent<HTMLButtonElement>) => {
    if (!itemRef.current || !overlayRef.current || !overlayInnerRef.current) return
    const rect = itemRef.current.getBoundingClientRect()
    const edge = findClosestEdge(ev.clientX - rect.left, ev.clientY - rect.top, rect.width, rect.height)
    const tl = gsap.timeline({ defaults: animationDefaults })
    tl.to(overlayRef.current, { y: edge === 'top' ? '-101%' : '101%' })
      .to(overlayInnerRef.current, { y: edge === 'top' ? '101%' : '-101%' }, '<')

    // stop marquee and reset position for next hover
    marqueeTweenRef.current?.kill()
    marqueeTweenRef.current = null
    gsap.set(overlayInnerRef.current, { xPercent: 0 })
  }

  // Instantly hide hover overlay when user initiates click so it doesn't show during expand
  const onPress = () => {
    if (!overlayRef.current || !overlayInnerRef.current) return
    marqueeTweenRef.current?.kill()
    marqueeTweenRef.current = null
    gsap.set(overlayRef.current, { y: '101%' })
    gsap.set(overlayInnerRef.current, { y: '-101%', xPercent: 0 })
  }

  // When row is opened, hide overlay and stop marquee; re-enable after closed
  React.useEffect(() => {
    if (isOpen) {
      marqueeTweenRef.current?.kill()
      marqueeTweenRef.current = null
      if (overlayRef.current && overlayInnerRef.current) {
        gsap.set(overlayRef.current, { y: '101%' })
        gsap.set(overlayInnerRef.current, { y: '-101%', xPercent: 0 })
      }
    }
  }, [isOpen])

  // Smooth expand/collapse for the answer area (auto height animation)
  React.useEffect(() => {
    if (!contentRef.current) return
    const el = contentRef.current
    gsap.killTweensOf(el)
    if (isOpen) {
      gsap.fromTo(
        el,
        { height: 0, opacity: 0 },
        { height: 'auto', opacity: 1, duration: 0.42, ease: 'power2.inOut', clearProps: 'height' }
      )
    } else {
      // ensure we start from the current content height for a perfectly smooth collapse
      gsap.fromTo(
        el,
        { height: el.scrollHeight, opacity: 1 },
        { height: 0, opacity: 0, duration: 0.42, ease: 'power2.inOut' }
      )
    }
  }, [isOpen])

  return (
    <div ref={itemRef} className="relative overflow-hidden">
      {/* Hover overlay with repeating FAQ text */}
      <div
        ref={overlayRef}
        className={`absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none bg-white translate-y-[101%] ${isOpen ? 'hidden' : ''}`}
      >
        <div ref={overlayInnerRef} className="h-full w-[200%] flex will-change-transform">
          {/* two identical strips so the loop is seamless at 50% shift */}
          <div className="flex items-center h-full w-1/2 shrink-0">
            {Array.from({ length: 12 }).map((_, i) => (
              <span key={`a-${i}`} className="text-[#060010] uppercase font-semibold text-base md:text-lg px-8">FAQ</span>
            ))}
          </div>
          <div className="flex items-center h-full w-1/2 shrink-0">
            {Array.from({ length: 13 }).map((_, i) => (
              <span key={`b-${i}`} className="text-[#060010] uppercase font-semibold text-base md:text-lg px-8">FAQ</span>
            ))}
          </div>
        </div>
      </div>

      <button
        type="button"
        onMouseDown={onPress}
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
        onClick={onToggle}
        aria-expanded={isOpen}
        className="w-full flex items-center justify-between text-left py-5"
      >
        <span className="text-white text-base md:text-lg">{question}</span>
        <svg
          className={`h-5 w-5 text-white transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 5v14" />
          <path d="M5 12h14" />
        </svg>
      </button>

      <div
        ref={contentRef}
        className="overflow-hidden pr-6"
        aria-hidden={!isOpen}
        style={{ height: isOpen ? ('auto' as any) : 0, opacity: isOpen ? 1 : 0 }}
      >
        <div className="pb-6 -mt-1 text-neutral-300 text-sm leading-relaxed text-justify">{children}</div>
      </div>
    </div>
  )
}
