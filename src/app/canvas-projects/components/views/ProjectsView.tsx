import React, { useEffect, useState } from 'react';
import { Plus, ArrowUpRight, Loader2, FolderOpen, Trash2 } from 'lucide-react';
import { fetchCanvasProjects, deleteProject } from '@/lib/canvasApi';
import { CanvasProject } from '@/types/canvasTypes';
import Image from 'next/image';
 
export function ProjectsView() {
    const [projects, setProjects] = useState<CanvasProject[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Determine canvas URL based on environment (copied from original logic)
    const getCanvasUrl = () => {
        if (process.env.NEXT_PUBLIC_CANVAS_URL) return process.env.NEXT_PUBLIC_CANVAS_URL;
        if (typeof window === 'undefined') return '';
        
        const hostname = window.location.hostname;
        console.log('[ProjectsView] Debug Canvas Redirect:', {
            env: process.env.NEXT_PUBLIC_CANVAS_URL,
            hostname,
            match: hostname === 'onstaging.wildmindai.com'
        });

        if (hostname === 'wildmindai.com' || hostname === 'www.wildmindai.com') {
            return 'https://studio.wildmindai.com';
        } else if (hostname === 'onstaging-wildmindai.com' || hostname === 'onstaging.wildmindai.com') {
             return 'https://onstaging-studios.wildmindai.com';
        }
        return 'http://localhost:3001';
    };
    const canvasUrl = getCanvasUrl();

    useEffect(() => {
        loadProjects();
        // Log environment status on mount for debugging
        const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
        
        // TEMPORARY DEBUG ALERT
        if (hostname.includes('staging')) {
            alert(`DEBUG:
            Hostname: ${hostname}
            Env URL: ${process.env.NEXT_PUBLIC_CANVAS_URL}
            Resolved URL: ${canvasUrl}
            Is Staging Match?: ${hostname === 'onstaging.wildmindai.com' || hostname === 'onstaging.wildmindai.com'}
            `);
        }

        // Reload when window gets focus (e.g. user comes back from canvas tab)
        window.addEventListener('focus', loadProjects);
        return () => window.removeEventListener('focus', loadProjects);
    }, []);

    const loadProjects = async () => {
        setLoading(true);
        setError(null);
        try {
            // Check if user is authenticated first
            const { getMeCached } = await import('@/lib/me');
            try {
                await getMeCached();
            } catch (authError) {
                console.warn('[ProjectsView] User not authenticated, projects may not load', authError);
                // Continue anyway - the API call will fail with 401 if not authenticated
            }

            const response = await fetchCanvasProjects();
            const enrichedProjects = (response.projects || []).map((p: CanvasProject) => {
                if (p.previewImages && p.previewImages.length > 0) {
                    const randomIndex = Math.floor(Math.random() * p.previewImages.length);
                    return { ...p, thumbnail: p.previewImages[randomIndex] };
                }
                return p;
            });
            console.log('[ProjectsView] Loaded projects:', enrichedProjects);
            setProjects(enrichedProjects);
        } catch (err: any) {
            console.error('Failed to load canvas projects:', err);

            // Provide specific error message for authentication issues
            if (err?.message?.includes('Authentication required') || err?.message?.includes('Unauthorized')) {
                setError('Please log in to view your projects. If you are already logged in, try refreshing the page or logging in again.');
            } else {
                setError('Failed to load projects. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCreateNewProject = () => {
        window.open(`${canvasUrl}?projectId=new`, '_blank', 'noopener,noreferrer');
    };

    const handleOpenProject = async (projectId: string) => {
        // Try to get auth token to pass along (helps with cross-subdomain auth)
        // Since localStorage isn't shared across subdomains, we pass the token via URL hash
        // The hash is not sent to the server, so it's relatively safe
        let authHint = '';
        try {
            const authToken = localStorage.getItem('authToken') || localStorage.getItem('idToken');
            if (authToken && authToken.startsWith('eyJ')) {
                // Pass full token as URL hash (not sent to server, only accessible via JavaScript)
                // The studio app will extract it and store it in localStorage
                authHint = `#authToken=${encodeURIComponent(authToken)}`;
                console.log('[ProjectsView] Passing auth token via URL hash for cross-subdomain auth');
            }
        } catch (e) {
            console.warn('[ProjectsView] Failed to get auth token for cross-subdomain auth', e);
        }

        window.open(`${canvasUrl}?projectId=${projectId}${authHint}`, '_blank', 'noopener,noreferrer');
    };

    const handleDeleteProject = async (e: React.MouseEvent, projectId: string, projectName: string) => {
        e.stopPropagation(); // Prevent opening the project when clicking delete

        if (!confirm(`Are you sure you want to delete "${projectName}"? This action cannot be undone.`)) {
            return;
        }

        try {
            await deleteProject(projectId);
            // Remove the project from the list
            setProjects((prev: CanvasProject[]) => prev.filter((p: CanvasProject) => p.id !== projectId));
        } catch (error: any) {
            console.error('Failed to delete project:', error);
            alert(error.message || 'Failed to delete project. Please try again.');
        }
    };

    const formatDate = (dateInput: any) => {
        if (!dateInput) return '';
        let date: Date;

        if (typeof dateInput === 'string' || typeof dateInput === 'number') {
            date = new Date(dateInput);
        } else if (dateInput && typeof dateInput === 'object' && '_seconds' in dateInput) {
            date = new Date(dateInput._seconds * 1000);
        } else if (dateInput && typeof dateInput === 'object' && 'seconds' in dateInput) {
            date = new Date(dateInput.seconds * 1000);
        } else {
            date = new Date(dateInput);
        }

        if (isNaN(date.getTime())) return 'Recently';

        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    return (
        <div className="animate-in fade-in duration-500">
            <div className="flex items-end justify-between mb-12">
                <div><h2 className="text-4xl font-medium tracking-tight text-white mb-2">My Projects</h2><p className="text-slate-400">Manage your workspaces and assets.</p></div>
                <button onClick={handleCreateNewProject} className="bg-white text-black px-6 py-3 rounded-full font-semibold hover:bg-[#60a5fa] transition-colors flex items-center gap-2"><Plus size={18} /> New Canvas</button>
            </div>

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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {/* Create New Card */}
                    <div onClick={handleCreateNewProject} className="aspect-[4/3] rounded-2xl border border-dashed border-white/10 bg-[#050505] hover:bg-[#0A0A0A] hover:border-white/20 transition-all cursor-pointer flex flex-col items-center justify-center group">
                        <div className="w-16 h-16 rounded-full bg-[#111] flex items-center justify-center text-slate-600 group-hover:text-white group-hover:scale-110 transition-all mb-4"><Plus size={32} /></div>
                        <span className="text-slate-500 group-hover:text-white font-medium">Create New</span>
                    </div>

                    {/* Project Cards */}
                    {projects.map((p: CanvasProject) => (
                        <div key={p.id} onClick={() => handleOpenProject(p.id)} className="group relative aspect-[4/3] bg-[#0A0A0A] rounded-2xl border border-white/5 overflow-hidden hover:border-[#60a5fa]/50 transition-all cursor-pointer">
                            {p.thumbnail ? (
                                <Image src={p.thumbnail} fill className="absolute inset-0 w-full h-full object-cover opacity-100 group-hover:scale-105 transition-all duration-700" alt={p.name} unoptimized />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center opacity-20">
                                    <FolderOpen size={64} className="text-white" />
                                </div>
                            )}

                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent p-6 flex flex-col justify-end">
                                <div className="flex justify-between items-end">
                                    <div>

                                        <h3 className="text-xl font-medium text-white truncate max-w-[200px]">{p.name}</h3>
                                        <span className="text-sm text-slate-400">{formatDate(p.updatedAt)}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={(e: React.MouseEvent) => handleDeleteProject(e, p.id, p.name)}
                                            className="w-10 h-10 rounded-full bg-red-500/20 backdrop-blur flex items-center justify-center text-red-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white"
                                            title="Delete project"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                        <button className="w-10 h-10 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white hover:text-black" title="Open project">
                                            <ArrowUpRight size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}