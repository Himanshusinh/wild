"use client";
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Plus, Loader2, FolderOpen, Trash2 } from 'lucide-react';
import { CanvasProject } from '@/types/canvasTypes';
import { fetchCanvasProjects } from '@/lib/canvasApi';

const CanvasProjectsPage = () => {
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
        loadProjects();
    }, []);

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

    const [isCreatingProject, setIsCreatingProject] = useState(false);

    const handleCreateNewProject = async () => {
        if (isCreatingProject) return; // Prevent double-clicks

        setIsCreatingProject(true);
        try {
            console.log('[Canvas Projects] Creating new project...');

            // Import the createProject function
            const { createProject } = await import('@/lib/canvasApi');

            // Create a new project with a default name
            const newProject = await createProject('Untitled Project');

            console.log('[Canvas Projects] New project created:', newProject);

            // Open the newly created project in a new tab
            if (newProject && newProject.id) {
                const url = `${canvasUrl}?projectId=${newProject.id}`;
                console.log('[Canvas Projects] Opening project:', url);
                window.open(url, '_blank', 'noopener,noreferrer');

                // Refresh the projects list to show the new project
                setTimeout(() => {
                    loadProjects();
                }, 500);
            } else {
                console.error('[Canvas Projects] No project ID returned:', newProject);
                throw new Error('No project ID returned from API');
            }
        } catch (error) {
            console.error('[Canvas Projects] Failed to create new project:', error);
            // Fallback: open with 'new' parameter if API fails
            alert('Failed to create new project. Please try again.');
        } finally {
            setIsCreatingProject(false);
        }
    };

    const handleOpenProject = (projectId: string) => {
        window.open(`${canvasUrl}?projectId=${projectId}`, '_blank', 'noopener,noreferrer');
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

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#111111] to-[#0a0a0a] text-white pt-20 pb-12 pr-8 pl-24 md:pl-80">
            <div className="max-w-[1800px] mx-auto">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32">
                        <Loader2 className="w-16 h-16 text-white/50 animate-spin mb-6" />
                        <p className="text-white/70 text-lg">Loading your projects...</p>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center py-32">
                        <div className="text-red-400 text-lg mb-6">⚠️ {error}</div>
                        <button
                            onClick={loadProjects}
                            className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-medium transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {/* Create New Project Card */}
                        <button
                            onClick={handleCreateNewProject}
                            className="group relative bg-gradient-to-br from-purple-500/10 to-blue-500/10 hover:from-purple-500/20 hover:to-blue-500/20 border-2 border-dashed border-white/20 hover:border-white/40 rounded-2xl transition-all duration-300 flex flex-col items-center justify-center gap-4 aspect-[3/2] p-8"
                        >
                            <div className="w-16 h-16 rounded-full bg-white/10 group-hover:bg-white/20 flex items-center justify-center transition-colors">
                                <Plus className="w-8 h-8 text-white" />
                            </div>
                            <div className="text-center">
                                <span className="text-white font-semibold text-base block mb-1">Create New Project</span>
                                <span className="text-white/60 text-sm">Start from scratch</span>
                            </div>
                        </button>

                        {/* Existing Projects */}
                        {projects.length === 0 ? (
                            <div className="col-span-full flex flex-col items-center justify-center py-20 text-white/50">
                                <FolderOpen className="w-20 h-20 mb-6" />
                                <p className="text-xl mb-2">No projects yet</p>
                                <p className="text-sm">Create your first project to get started!</p>
                            </div>
                        ) : (
                            projects.map((project) => (
                                <button
                                    key={project.id}
                                    onClick={() => handleOpenProject(project.id)}
                                    className="group relative bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/30 rounded-2xl transition-all duration-300 overflow-hidden aspect-[3/2]"
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
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                                        </div>
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800/30 to-gray-900/30">
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
                                        <h3 className="text-white font-semibold text-left mb-1 truncate text-base">
                                            {project.name}
                                        </h3>
                                        <p className="text-white/60 text-sm text-left">
                                            {formatDate(project.updatedAt)}
                                        </p>
                                    </div>

                                    {/* Hover Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-blue-500/0 group-hover:from-purple-500/20 group-hover:to-blue-500/20 transition-all duration-300" />

                                    {/* Delete Button - Visible on Hover */}
                                    <div
                                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
                                        onClick={async (e) => {
                                            e.stopPropagation();
                                            if (confirm('Are you sure you want to delete this project?')) {
                                                try {
                                                    const { deleteProject } = await import('@/lib/canvasApi');
                                                    await deleteProject(project.id);
                                                    loadProjects();
                                                } catch (err) {
                                                    console.error('Failed to delete project:', err);
                                                    alert('Failed to delete project');
                                                }
                                            }
                                        }}
                                    >
                                        <div className="p-2 bg-black/50 hover:bg-red-500/80 rounded-full backdrop-blur-sm transition-colors">
                                            <Trash2 className="w-4 h-4 text-white" />
                                        </div>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CanvasProjectsPage;
