'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Image as ImageIcon, Video, Scissors, Crop, Maximize, Mic, Smartphone, User, Sparkles, Wand2 } from 'lucide-react';
import { ROUTES } from '@/routes/routes';

type Category = 'explore' | 'image' | 'video' | 'edit';

interface FeatureItem {
    id: string;
    title: string;
    href: string;
    videoSrc?: string;
    poster?: string;
    imageSrc?: string;
    icon: React.ReactNode;
    categories: Category[];
}

const FEATURES: FeatureItem[] = [
    {
        id: 'create-image',
        title: 'Create Image',
        href: ROUTES.TEXT_TO_IMAGE,
        videoSrc: "https://imagine.animagic.art/imagine-one/home/all-features/videos/create-image-dark.mp4",
        poster: "https://imagine.animagic.art/imagine-one/home/all-features/first-frames/create-image.png",
        icon: <Wand2 className="size-4.5" />,
        categories: ['explore', 'image']
    },
    {
        id: 'create-video',
        title: 'Create Video',
        href: ROUTES.TEXT_TO_VIDEO,
        videoSrc: "https://imagine.animagic.art/imagine-one/home/all-features/videos/create-video-dark.mp4",
        poster: "https://imagine.animagic.art/imagine-one/home/all-features/first-frames/create-video.png",
        icon: <Video className="size-4.5" />,
        categories: ['explore', 'video']
    },
    {
        id: 'edit-image',
        title: 'Edit Image',
        href: "/view/EditImage",
        imageSrc: "https://imagine.animagic.art/imagine-one/home/all-features/edit_image1.png",
        icon: <Crop className="size-4.5" />,
        categories: ['explore', 'image', 'edit']
    },
    {
        id: 'upscale',
        title: 'Upscale',
        href: "/view/EditImage?feature=upscale",
        imageSrc: "https://imagine.animagic.art/imagine-one/home/all-features/upscale_image.png",
        icon: <Maximize className="size-4.5" />,
        categories: ['explore', 'image', 'edit']
    },
    {
        id: 'edit-videos',
        title: 'Edit Videos',
        href: "/view/EditVideo",
        imageSrc: "https://imagine.animagic.art/imagine-one/home/all-features/edit_video.png",
        icon: <Scissors className="size-4.5" />,
        categories: ['explore', 'video', 'edit']
    },
    {
        id: 'apps',
        title: 'Apps',
        href: "/view/workflows",
        imageSrc: "https://imagine.animagic.art/imagine-one/home/all-features/apps.png",
        icon: <Smartphone className="size-4.5" />,
        categories: ['explore']
    },
    {
        id: 'remove-background',
        title: 'Remove Background',
        href: "/view/EditImage?feature=remove-bg",
        imageSrc: "https://imagine.animagic.art/imagine-one/home/all-features/remove_bg.png",
        icon: <Scissors className="size-4.5" />,
        categories: ['explore', 'image', 'edit']
    },
    {
        id: 'product-placement',
        title: 'Product Placement',
        href: ROUTES.PRODUCT_GENERATION,
        imageSrc: "https://imagine.animagic.art/imagine-one/home/all-features/product_placement.png",
        icon: <Sparkles className="size-4.5" />,
        categories: ['image']
    },
    {
        id: 'lipsync-studio',
        title: 'Lipsync Studio',
        href: ROUTES.TEXT_TO_VIDEO + "?feature=lipsync",
        imageSrc: "https://imagine.animagic.art/imagine-one/home/all-features/lipsync.png",
        icon: <Mic className="size-4.5" />,
        categories: ['video', 'edit']
    },
    {
        id: 'image-to-video',
        title: 'Image to Video',
        href: ROUTES.TEXT_TO_VIDEO,
        videoSrc: "https://imagine.animagic.art/imagine-one/home/all-features/videos/i2v-dark.mp4",
        poster: "https://imagine.animagic.art/imagine-one/home/all-features/first-frames/i2v.png",
        icon: <Video className="size-4.5" />,
        categories: ['video']
    }
];

export default function AllFeatures() {
    const [activeTab, setActiveTab] = useState<Category>('explore');
    const router = useRouter();

    const filteredFeatures = FEATURES.filter(feature => feature.categories.includes(activeTab));

    return (
        <div className="desktop:px-10 tablet:px-16 px-6 py-6">
            <div className="flex w-full flex-col gap-6">
                {/* Header and Tabs */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <h2 className="text-2xl text-white font-medium">All features</h2>

                    <div dir="ltr" className="mx-auto md:mx-0 w-fit">
                        <div role="tablist" className="inline-flex items-center justify-start gap-2 bg-zinc-900/50 p-1 rounded-xl border border-white/5">
                            <TabButton
                                active={activeTab === 'explore'}
                                onClick={() => setActiveTab('explore')}
                                icon={<Search size={14} />}
                                label="Explore"
                            />
                            <TabButton
                                active={activeTab === 'image'}
                                onClick={() => setActiveTab('image')}
                                icon={<ImageIcon size={14} />}
                                label="Image"
                            />
                            <TabButton
                                active={activeTab === 'video'}
                                onClick={() => setActiveTab('video')}
                                icon={<Video size={14} />}
                                label="Video"
                            />
                            <TabButton
                                active={activeTab === 'edit'}
                                onClick={() => setActiveTab('edit')}
                                icon={<Crop size={14} />}
                                label="Edit"
                            />
                        </div>
                    </div>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {filteredFeatures.map((feature) => (
                        <Link
                            key={feature.id}
                            href={feature.href}
                            className="group relative isolate flex flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/40 transition-all hover:bg-zinc-800/60 hover:border-white/20 aspect-video md:aspect-auto md:h-52"
                        >
                            <div className="flex flex-col justify-between h-full p-4 z-10">
                                <div className="text-white/70 group-hover:text-white transition-colors">
                                    {feature.icon}
                                </div>
                                <p className="text-sm font-medium text-white">{feature.title}</p>
                            </div>

                            {/* Background Media */}
                            <div className="absolute right-0 bottom-0 -z-1 aspect-square w-[70%] overflow-hidden pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity">
                                {feature.videoSrc ? (
                                    <video
                                        src={feature.videoSrc}
                                        poster={feature.poster}
                                        playsInline
                                        autoPlay
                                        muted
                                        loop
                                        className="size-full object-cover object-center"
                                    />
                                ) : feature.imageSrc ? (
                                    <img
                                        src={feature.imageSrc}
                                        alt={feature.title}
                                        className="size-full object-cover object-center"
                                    />
                                ) : null}
                            </div>

                            {/* Overlay Gradient */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
    return (
        <button
            type="button"
            role="tab"
            aria-selected={active}
            onClick={onClick}
            className={`
        group relative flex items-center justify-center h-8 px-4 gap-2 text-sm font-medium rounded-lg transition-all
        ${active
                    ? 'bg-zinc-700 text-white shadow-lg'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                }
      `}
        >
            {icon}
            <span>{label}</span>
        </button>
    );
}
