"use client";
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { X, Plus, Loader2, FolderOpen } from 'lucide-react';
import { CanvasProject } from '@/types/canvasTypes';
import { fetchCanvasProjects } from '@/lib/canvasApi';

interface WildCanvasProjectsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const WildCanvasProjectsModal: React.FC<WildCanvasProjectsModalProps> = ({ isOpen, onClose }) => {
    const [projects, setProjects] = useState<CanvasProject[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Determine canvas URL based on environment
    const getCanvasUrl = () => {
        if (typeof window === 'undefined') return '';
        const isProd = window.location.hostname === 'wildmindai.com' ||
            window.location.hostname === 'www.wildmindai.com';
        return isProd ? 'https://studio.wildmindai.com' : 'http://localhost:3001';
    };

    const canvasUrl = getCanvasUrl();

    useEffect(() => {
        if (isOpen) {
            loadProjects();
        }
    }, [isOpen]);

    const loadProjects = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetchCanvasProjects();
            setProjects(response.projects || []);
        } catch (err) {
            console.error('Failed to load canvas projects:', err);
            setError('Failed to load projects. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateNewProject = () => {
        window.open(`${canvasUrl}?projectId=new`, '_blank', 'noopener,noreferrer');
        onClose();
    };

    const handleOpenProject = (projectId: string) => {
        window.open(`${canvasUrl}?projectId=${projectId}`, '_blank', 'noopener,noreferrer');
        onClose();
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
                <div
                    className="bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[85vh] overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-white/10">
                        <div className="flex items-center gap-3">
                            <Image
                                src="/icons/canvas.svg"
                                alt="WildCanvas"
                                width={32}
                                height={32}
                                className="w-8 h-8"
                                unoptimized
                            />
                            <h2 className="text-2xl font-semibold text-white">WildCanvas Projects</h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            aria-label="Close modal"
                        >
                            <X className="w-5 h-5 text-white/70" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 overflow-y-auto max-h-[calc(85vh-88px)]">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20">
                                <Loader2 className="w-12 h-12 text-white/50 animate-spin mb-4" />
                                <p className="text-white/70">Loading your projects...</p>
                            </div>
                        ) : error ? (
                            <div className="flex flex-col items-center justify-center py-20">
                                <div className="text-red-400 mb-4">⚠️ {error}</div>
                                <button
                                    onClick={loadProjects}
                                    className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
                                >
                                    Try Again
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {/* Create New Project Card */}
                                <button
                                    onClick={handleCreateNewProject}
                                    className="group relative aspect-video bg-gradient-to-br from-purple-500/20 to-blue-500/20 hover:from-purple-500/30 hover:to-blue-500/30 border-2 border-dashed border-white/20 hover:border-white/40 rounded-xl transition-all duration-300 flex flex-col items-center justify-center gap-3"
                                >
                                    <div className="w-16 h-16 rounded-full bg-white/10 group-hover:bg-white/20 flex items-center justify-center transition-colors">
                                        <Plus className="w-8 h-8 text-white" />
                                    </div>
                                    <span className="text-white font-medium text-lg">Create New Project</span>
                                    <span className="text-white/60 text-sm">Start from scratch</span>
                                </button>

                                {/* Existing Projects */}
                                {projects.length === 0 ? (
                                    <div className="col-span-full flex flex-col items-center justify-center py-12 text-white/50">
                                        <FolderOpen className="w-16 h-16 mb-4" />
                                        <p className="text-lg">No projects yet</p>
                                        <p className="text-sm">Create your first project to get started!</p>
                                    </div>
                                ) : (
                                    projects.map((project) => (
                                        <button
                                            key={project.id}
                                            onClick={() => handleOpenProject(project.id)}
                                            className="group relative aspect-video bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/30 rounded-xl transition-all duration-300 overflow-hidden"
                                        >
                                            {/* Thumbnail */}
                                            {project.thumbnail ? (
                                                <div className="absolute inset-0">
                                                    <Image
                                                        src={project.thumbnail}
                                                        alt={project.name}
                                                        fill
                                                        className="object-cover"
                                                        unoptimized
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                                </div>
                                            ) : (
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <Image
                                                        src="/icons/canvas.svg"
                                                        alt="Canvas"
                                                        width={64}
                                                        height={64}
                                                        className="w-16 h-16 opacity-20"
                                                        unoptimized
                                                    />
                                                </div>
                                            )}

                                            {/* Project Info */}
                                            <div className="absolute bottom-0 left-0 right-0 p-4">
                                                <h3 className="text-white font-medium text-left mb-1 truncate">
                                                    {project.name}
                                                </h3>
                                                <p className="text-white/60 text-sm text-left">
                                                    {formatDate(project.updatedAt)}
                                                </p>
                                            </div>

                                            {/* Hover Overlay */}
                                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-blue-500/0 group-hover:from-purple-500/20 group-hover:to-blue-500/20 transition-all duration-300" />
                                        </button>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default WildCanvasProjectsModal;
