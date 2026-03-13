import SignInForm from "./sign-up-form"
import RightImageGallery from "./components/RightImageGallery"
import { getSignupImages } from "@/lib/showcase-cache"

const DEFAULT_IMAGE_URL =
  "https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Fsignup%2F3.png?alt=media&token=e67afc08-10e0-4710-b251-d9031ef14026"

async function getInitialSignupGallery() {
  try {
    const items = await getSignupImages()
    return (Array.isArray(items) ? items : [])
      .map((item) => ({
        imageUrl: item?.images?.[0]?.url || item?.images?.[0]?.originalUrl || DEFAULT_IMAGE_URL,
        prompt: item?.prompt || "Featured creation",
        generationId: item?.id,
        creator: item?.createdBy,
      }))
      .filter((item) => !!item.imageUrl)
      .slice(0, 50)
  } catch {
    return []
  }
}

export default async function SignUp() {
  const initialImages = await getInitialSignupGallery()

  return (
    <main className="flex min-h-screen lg:h-screen lg:overflow-hidden bg-[#1C1C20] w-full">
      {/* Left Side - Form - Full width on mobile/tablet, 50% on desktop; fixed height on desktop to prevent layout shift */}
      <div className="w-full lg:w-[50%] min-h-screen lg:h-full lg:min-h-0 lg:overflow-hidden relative z-20 bg-[#1C1C20] flex flex-col">
        <SignInForm />
      </div>

      {/* Right Side - 3-column scrolling image gallery (desktop only) */}
      <div className="hidden lg:flex flex-1 lg:h-full lg:min-h-0 min-h-screen relative bg-transparent w-[50%] z-10">
        <RightImageGallery initialImages={initialImages} />
      </div>
    </main>
  )
}
