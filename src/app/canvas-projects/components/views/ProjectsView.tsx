import React, { useEffect, useState } from 'react';
import { Plus, ArrowUpRight, Loader2, FolderOpen } from 'lucide-react';
import { fetchCanvasProjects } from '@/lib/canvasApi';
import { CanvasProject } from '@/types/canvasTypes';
import Image from 'next/image';

export function ProjectsView() {
    const [projects, setProjects] = useState<CanvasProject[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Determine canvas URL based on environment (copied from original logic)
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
            // Check if user is authenticated first
            const { getMeCached } = await import('@/lib/me');
            try {
                await getMeCached();
            } catch (authError) {
                console.warn('[ProjectsView] User not authenticated, projects may not load', authError);
                // Continue anyway - the API call will fail with 401 if not authenticated
            }
            
            const response = await fetchCanvasProjects();
            setProjects(response.projects || []);
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
                    {projects.map((p) => (
                        <div key={p.id} onClick={() => handleOpenProject(p.id)} className="group relative aspect-[4/3] bg-[#0A0A0A] rounded-2xl border border-white/5 overflow-hidden hover:border-[#60a5fa]/50 transition-all cursor-pointer">
                            {p.thumbnail ? (
                                <Image src={p.thumbnail} fill className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-70 group-hover:scale-105 transition-all duration-700 grayscale group-hover:grayscale-0" alt={p.name} unoptimized />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center opacity-20">
                                    <FolderOpen size={64} className="text-white" />
                                </div>
                            )}

                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent p-6 flex flex-col justify-end">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2"><span className="text-[10px] font-bold uppercase tracking-wider bg-white/10 backdrop-blur px-2 py-1 rounded text-white">Project</span></div>
                                        <h3 className="text-xl font-medium text-white truncate max-w-[200px]">{p.name}</h3>
                                        <span className="text-sm text-slate-400">{formatDate(p.updatedAt)}</span>
                                    </div>
                                    <button className="w-10 h-10 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white hover:text-black"><ArrowUpRight size={18} /></button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
