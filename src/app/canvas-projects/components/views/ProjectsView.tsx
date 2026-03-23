import React, { useEffect, useMemo, useState } from 'react';
import { Plus, ArrowUpRight, Loader2, FolderOpen, Trash2, Bell, Check, X } from 'lucide-react';
import { fetchCanvasProjects, deleteProject, fetchCanvasInvitations, acceptCanvasInvitation, dismissCanvasInvitation, type CanvasInvitation } from '@/lib/canvasApi';
import { CanvasProject } from '@/types/canvasTypes';
import Image from 'next/image';
import { useAppDispatch } from '@/store/hooks';
import { addNotification } from '@/store/slices/uiSlice';
 
export function ProjectsView() {
    const dispatch = useAppDispatch();
    const [projects, setProjects] = useState<CanvasProject[]>([]);
    const [currentUser, setCurrentUser] = useState<{ uid?: string; email?: string } | null>(null);
    const [invitations, setInvitations] = useState<CanvasInvitation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeCategory, setActiveCategory] = useState<'owned' | 'shared'>('owned');

    type ProjectCard = CanvasProject & {
        accessType: 'owned' | 'shared';
        isPlaceholder?: boolean;
        sharedBy?: string;
    };

    const resolveCurrentUser = async (): Promise<{ uid?: string; email?: string } | null> => {
        try {
            const { getMeCached } = await import('@/lib/me');
            const me = await getMeCached();
            const nextUser = {
                uid: typeof me?.uid === 'string' ? me.uid : undefined,
                email: typeof me?.email === 'string' ? me.email : undefined,
            };
            if (nextUser.uid || nextUser.email) return nextUser;
        } catch {}

        try {
            const rawUser = localStorage.getItem('user');
            if (rawUser) {
                const parsed = JSON.parse(rawUser);
                const nextUser = {
                    uid: typeof parsed?.uid === 'string' ? parsed.uid : undefined,
                    email: typeof parsed?.email === 'string' ? parsed.email : undefined,
                };
                if (nextUser.uid || nextUser.email) return nextUser;
            }
        } catch {}

        return null;
    };

    const syncInvitationsForUser = async (user: { uid?: string; email?: string } | null) => {
        if (!user?.uid) {
            setInvitations([]);
            return;
        }
        try {
            const nextInvitations = await fetchCanvasInvitations();
            setInvitations(nextInvitations);
        } catch {
            setInvitations([]);
        }
    };

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
        return 'http://localhost:3002';
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
        const handleRefresh = () => loadProjects();
        const handleVisibility = () => {
            if (!document.hidden) loadProjects();
        };

        window.addEventListener('focus', handleRefresh);
        document.addEventListener('visibilitychange', handleVisibility);
        return () => {
            window.removeEventListener('focus', handleRefresh);
            document.removeEventListener('visibilitychange', handleVisibility);
        };
    }, []);

    useEffect(() => {
        if (!currentUser?.uid) return;
        const intervalId = window.setInterval(async () => {
            try {
                const next = await fetchCanvasInvitations();
                setInvitations((prev) => JSON.stringify(prev) === JSON.stringify(next) ? prev : next);
            } catch {}
        }, 4000);

        return () => window.clearInterval(intervalId);
    }, [currentUser?.uid]);

    const loadProjects = async () => {
        setLoading(true);
        setError(null);
        try {
            // Check if user is authenticated first
            const nextUser = await resolveCurrentUser();
            setCurrentUser(nextUser);
            await syncInvitationsForUser(nextUser);

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

    const refreshInvitations = () => {
        void syncInvitationsForUser(currentUser);
    };

    const handleInvitationAction = (invitationId: string, status: 'accepted' | 'dismissed') => {
        (async () => {
            try {
                const updatedInvitation = status === 'accepted'
                    ? await acceptCanvasInvitation(invitationId)
                    : await dismissCanvasInvitation(invitationId);

                await loadProjects();
                await syncInvitationsForUser(currentUser);

                if (updatedInvitation && status === 'accepted') {
                    setActiveCategory('shared');
                    dispatch(addNotification({
                        type: 'success',
                        message: `${updatedInvitation.projectName} moved to Shared projects.`,
                    }));
                    return;
                }

                dispatch(addNotification({
                    type: 'info',
                    message: 'Invitation dismissed.',
                }));
            } catch (error) {
                dispatch(addNotification({
                    type: 'error',
                    message: error instanceof Error ? error.message : 'Failed to update invitation.',
                }));
            }
        })();
    };

    const formatDate = (dateInput: unknown) => {
        if (!dateInput) return '';
        let date: Date;

        if (typeof dateInput === 'string' || typeof dateInput === 'number') {
            date = new Date(dateInput);
        } else if (
            typeof dateInput === 'object' &&
            dateInput !== null &&
            '_seconds' in dateInput &&
            typeof dateInput._seconds === 'number'
        ) {
            date = new Date(dateInput._seconds * 1000);
        } else if (
            typeof dateInput === 'object' &&
            dateInput !== null &&
            'seconds' in dateInput &&
            typeof dateInput.seconds === 'number'
        ) {
            date = new Date(dateInput.seconds * 1000);
        } else if (dateInput instanceof Date) {
            date = dateInput;
        } else {
            return 'Recently';
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

    const toSafeIsoString = (dateInput: unknown) => {
        if (!dateInput) return new Date().toISOString();

        if (typeof dateInput === 'string' || typeof dateInput === 'number') {
            const date = new Date(dateInput);
            return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
        }

        if (
            typeof dateInput === 'object' &&
            dateInput !== null &&
            '_seconds' in dateInput &&
            typeof dateInput._seconds === 'number'
        ) {
            return new Date(dateInput._seconds * 1000).toISOString();
        }

        if (
            typeof dateInput === 'object' &&
            dateInput !== null &&
            'seconds' in dateInput &&
            typeof dateInput.seconds === 'number'
        ) {
            return new Date(dateInput.seconds * 1000).toISOString();
        }

        if (
            typeof dateInput === 'object' &&
            dateInput !== null &&
            'toDate' in dateInput &&
            typeof dateInput.toDate === 'function'
        ) {
            const converted = dateInput.toDate();
            if (converted instanceof Date && !Number.isNaN(converted.getTime())) {
                return converted.toISOString();
            }
        }

        if (dateInput instanceof Date && !Number.isNaN(dateInput.getTime())) {
            return dateInput.toISOString();
        }

        return new Date().toISOString();
    };

    const pendingInvitations = useMemo(
        () => invitations.filter((invitation) => invitation.status === 'pending'),
        [invitations]
    );

    const ownedProjects = useMemo<ProjectCard[]>(
        () => projects
            .filter((project) => !currentUser?.uid || project.ownerUid === currentUser.uid)
            .map((project) => ({ ...project, accessType: 'owned' })),
        [currentUser?.uid, projects]
    );

    const sharedProjects = useMemo<ProjectCard[]>(() => {
        const apiSharedProjects = projects
            .filter((project) => !!currentUser?.uid && project.ownerUid !== currentUser.uid)
            .map((project) => ({ ...project, accessType: 'shared' as const }));

        const acceptedInvitations = invitations.filter((invitation) => invitation.status === 'accepted');
        const placeholderProjects = acceptedInvitations
            .filter((invitation) => !apiSharedProjects.some((project) => project.id === invitation.projectId))
            .map<ProjectCard>((invitation) => ({
                id: invitation.projectId,
                name: invitation.projectName,
                ownerUid: '',
                createdAt: toSafeIsoString(invitation.createdAt),
                updatedAt: toSafeIsoString(invitation.updatedAt || invitation.createdAt),
                accessType: 'shared',
                isPlaceholder: true,
                sharedBy: invitation.senderUsername || invitation.senderEmail,
            }));

        return [...apiSharedProjects, ...placeholderProjects];
    }, [currentUser?.uid, invitations, projects]);

    const visibleProjects = activeCategory === 'owned' ? ownedProjects : sharedProjects;

    return (
        <div className="animate-in fade-in duration-500">
            <div className="flex items-end justify-between mb-12">
                <div>
                    <h2 className="text-4xl font-medium tracking-tight text-white mb-2">Projects</h2>
                    <p className="text-slate-400">Manage your own canvas work and the projects shared with you.</p>
                </div>
                <button onClick={handleCreateNewProject} className="bg-white text-black px-6 py-3 rounded-full font-semibold hover:bg-[#60a5fa] transition-colors flex items-center gap-2"><Plus size={18} /> New Canvas</button>
            </div>

            {pendingInvitations.length > 0 && (
                <div className="mb-8 rounded-3xl border border-blue-500/20 bg-blue-500/10 backdrop-blur-sm p-6">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-10 h-10 rounded-2xl bg-blue-500/20 flex items-center justify-center">
                            <Bell size={18} className="text-blue-300" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white">Project Invitations</h3>
                            <p className="text-sm text-blue-100/70">Accept an incoming collaboration invite to place it inside Shared.</p>
                        </div>
                    </div>

                    <div className="grid gap-4">
                        {pendingInvitations.map((invitation) => (
                            <div key={invitation.id} className="rounded-2xl border border-white/10 bg-black/20 p-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <div className="text-white font-medium">{invitation.projectName}</div>
                                    <div className="text-sm text-slate-300 mt-1">
                                        {invitation.senderUsername || invitation.senderEmail || 'A teammate'} shared this project with you.
                                    </div>
                                    <div className="text-xs text-slate-400 mt-1">
                                        Sent to {invitation.recipientEmail}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => handleInvitationAction(invitation.id, 'accepted')}
                                        className="px-4 py-2 rounded-full bg-white text-black hover:bg-[#60a5fa] transition-colors flex items-center gap-2 font-medium"
                                    >
                                        <Check size={14} />
                                        Accept
                                    </button>
                                    <button
                                        onClick={() => handleInvitationAction(invitation.id, 'dismissed')}
                                        className="px-4 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-colors flex items-center gap-2"
                                    >
                                        <X size={14} />
                                        Dismiss
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="mb-8 inline-flex rounded-full border border-white/10 bg-white/[0.03] p-1">
                <button
                    onClick={() => setActiveCategory('owned')}
                    className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${activeCategory === 'owned' ? 'bg-white text-black' : 'text-slate-300 hover:text-white'}`}
                >
                    My Projects ({ownedProjects.length})
                </button>
                <button
                    onClick={() => setActiveCategory('shared')}
                    className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${activeCategory === 'shared' ? 'bg-white text-black' : 'text-slate-300 hover:text-white'}`}
                >
                    Shared ({sharedProjects.length})
                </button>
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
                    {activeCategory === 'owned' && (
                        <div onClick={handleCreateNewProject} className="aspect-[4/3] rounded-2xl border border-dashed border-white/10 bg-[#050505] hover:bg-[#0A0A0A] hover:border-white/20 transition-all cursor-pointer flex flex-col items-center justify-center group">
                            <div className="w-16 h-16 rounded-full bg-[#111] flex items-center justify-center text-slate-600 group-hover:text-white group-hover:scale-110 transition-all mb-4"><Plus size={32} /></div>
                            <span className="text-slate-500 group-hover:text-white font-medium">Create New</span>
                        </div>
                    )}

                    {/* Project Cards */}
                    {activeCategory === 'shared' && pendingInvitations.length > 0 && (
                        <div className="col-span-full rounded-3xl border border-blue-500/20 bg-blue-500/10 p-6">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-10 h-10 rounded-2xl bg-blue-500/20 flex items-center justify-center">
                                    <Bell size={18} className="text-blue-300" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-white">Pending Invitations</h3>
                                    <p className="text-sm text-blue-100/70">Accept here to move the project into Shared.</p>
                                </div>
                            </div>
                            <div className="grid gap-4">
                                {pendingInvitations.map((invitation) => (
                                    <div key={`shared-${invitation.id}`} className="rounded-2xl border border-white/10 bg-black/20 p-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                        <div>
                                            <div className="text-white font-medium">{invitation.projectName}</div>
                                            <div className="text-sm text-slate-300 mt-1">
                                                Invited by {invitation.senderUsername || invitation.senderEmail || 'a teammate'}
                                            </div>
                                            <div className="text-xs text-slate-400 mt-1">
                                                Sent to {invitation.recipientEmail}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => handleInvitationAction(invitation.id, 'accepted')}
                                                className="px-4 py-2 rounded-full bg-white text-black hover:bg-[#60a5fa] transition-colors flex items-center gap-2 font-medium"
                                            >
                                                <Check size={14} />
                                                Accept
                                            </button>
                                            <button
                                                onClick={() => handleInvitationAction(invitation.id, 'dismissed')}
                                                className="px-4 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-colors flex items-center gap-2"
                                            >
                                                <X size={14} />
                                                Dismiss
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {visibleProjects.length === 0 && activeCategory === 'shared' && pendingInvitations.length === 0 && (
                        <div className="col-span-full rounded-3xl border border-white/10 bg-white/[0.02] px-8 py-14 text-center">
                            <div className="text-white text-xl font-medium mb-2">No shared projects yet</div>
                            <p className="text-slate-400">Incoming invites will appear here, and accepted collaboration invites will stay here as shared projects.</p>
                        </div>
                    )}

                    {visibleProjects.map((p) => (
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
                                        {p.accessType === 'shared' && (
                                            <div className="mt-2 flex flex-wrap items-center gap-2">
                                                <span className="inline-flex items-center rounded-full bg-blue-500/20 px-2.5 py-1 text-[11px] font-medium text-blue-100">
                                                    Shared
                                                </span>
                                                {p.sharedBy && (
                                                    <span className="text-xs text-slate-400">from {p.sharedBy}</span>
                                                )}
                                                {p.isPlaceholder && (
                                                    <span className="text-xs text-amber-300">Waiting for project sync</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {p.accessType === 'owned' && (
                                            <button
                                                onClick={(e: React.MouseEvent) => handleDeleteProject(e, p.id, p.name)}
                                                className="w-10 h-10 rounded-full bg-red-500/20 backdrop-blur flex items-center justify-center text-red-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white"
                                                title="Delete project"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
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
