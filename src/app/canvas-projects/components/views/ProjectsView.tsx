import React, { useEffect, useMemo, useState } from 'react';
import {
    Plus, ArrowUpRight, Trash2, Bell, Check, X,
    LayoutGrid, List, Users, Clock, SortAsc, SortDesc,
} from 'lucide-react';
import {
    fetchCanvasProjects, deleteProject, fetchCanvasInvitations,
    acceptCanvasInvitation, dismissCanvasInvitation, type CanvasInvitation,
} from '@/lib/canvasApi';
import { CanvasProject } from '@/types/canvasTypes';
import Image from 'next/image';
import { useAppDispatch } from '@/store/hooks';
import { addNotification } from '@/store/slices/uiSlice';

// ─── Gradient palette for projects without a thumbnail ────────────────────────
const CARD_GRADIENTS: [string, string][] = [
    ['#0d1b3e', '#1a3a6b'],
    ['#1a0d3e', '#3b1a6b'],
    ['#0d2e3e', '#0f4c6b'],
    ['#1e0d2e', '#2d1060'],
    ['#0a1628', '#0e2f55'],
    ['#160d30', '#281052'],
    ['#0c1f1a', '#0e3d32'],
    ['#2a0d1e', '#521035'],
];

function getGradient(name: string): [string, string] {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
    return CARD_GRADIENTS[Math.abs(h) % CARD_GRADIENTS.length];
}

// ─── Skeleton card ─────────────────────────────────────────────────────────────
function SkeletonCard() {
    return (
        <div className="relative aspect-[4/3] rounded-2xl bg-white/[0.03] border border-white/[0.05] overflow-hidden">
            <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-white/[0.04] to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-5 space-y-2.5">
                <div className="h-3.5 rounded-full bg-white/[0.07] w-2/3 animate-pulse" />
                <div className="h-2.5 rounded-full bg-white/[0.04] w-1/3 animate-pulse" />
            </div>
        </div>
    );
}

function SkeletonRow() {
    return (
        <div className="flex items-center gap-4 p-4 rounded-xl border border-white/[0.05] bg-white/[0.01]">
            <div className="w-12 h-12 rounded-xl bg-white/[0.06] animate-pulse flex-shrink-0" />
            <div className="flex-1 space-y-2">
                <div className="h-3 rounded-full bg-white/[0.07] w-1/3 animate-pulse" />
                <div className="h-2.5 rounded-full bg-white/[0.04] w-1/5 animate-pulse" />
            </div>
        </div>
    );
}

// ─── Main component ────────────────────────────────────────────────────────────
export function ProjectsView() {
    const dispatch = useAppDispatch();
    const [projects, setProjects] = useState<CanvasProject[]>([]);
    const [currentUser, setCurrentUser] = useState<{ uid?: string; email?: string } | null>(null);
    const [invitations, setInvitations] = useState<CanvasInvitation[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeCategory, setActiveCategory] = useState<'owned' | 'shared'>('owned');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [sortBy, setSortBy] = useState<'recent' | 'name'>('recent');
    const [sortAsc, setSortAsc] = useState(false);

    type ProjectCard = CanvasProject & {
        accessType: 'owned' | 'shared';
        isPlaceholder?: boolean;
        sharedBy?: string;
    };

    const resolveCurrentUser = async (): Promise<{ uid?: string; email?: string } | null> => {
        try {
            const { getMeCached } = await import('@/lib/me');
            const me = await getMeCached();
            const u = {
                uid: typeof me?.uid === 'string' ? me.uid : undefined,
                email: typeof me?.email === 'string' ? me.email : undefined,
            };
            if (u.uid || u.email) return u;
        } catch { }
        try {
            const raw = localStorage.getItem('user');
            if (raw) {
                const parsed = JSON.parse(raw);
                const u = {
                    uid: typeof parsed?.uid === 'string' ? parsed.uid : undefined,
                    email: typeof parsed?.email === 'string' ? parsed.email : undefined,
                };
                if (u.uid || u.email) return u;
            }
        } catch { }
        return null;
    };

    const syncInvitationsForUser = async (user: { uid?: string; email?: string } | null) => {
        if (!user?.uid) { setInvitations([]); return; }
        try {
            setInvitations(await fetchCanvasInvitations());
        } catch {
            setInvitations([]);
        }
    };

    const getCanvasUrl = () => {
        if (process.env.NEXT_PUBLIC_CANVAS_URL) return process.env.NEXT_PUBLIC_CANVAS_URL;
        if (typeof window === 'undefined') return '';
        const hostname = window.location.hostname;
        if (hostname === 'wildmindai.com' || hostname === 'www.wildmindai.com') return 'https://studio.wildmindai.com';
        if (hostname === 'onstaging-wildmindai.com' || hostname === 'onstaging.wildmindai.com') return 'https://onstaging-studios.wildmindai.com';
        return 'http://localhost:3002';
    };
    const canvasUrl = getCanvasUrl();

    const loadProjects = async () => {
        setLoading(true);
        setError(null);
        try {
            const nextUser = await resolveCurrentUser();
            setCurrentUser(nextUser);
            await syncInvitationsForUser(nextUser);
            const response = await fetchCanvasProjects();
            const enriched = (response.projects || []).map((p: CanvasProject) => {
                if (p.previewImages && p.previewImages.length > 0) {
                    const idx = Math.floor(Math.random() * p.previewImages.length);
                    return { ...p, thumbnail: p.previewImages[idx] };
                }
                return p;
            });
            setProjects(enriched);
        } catch (err: any) {
            if (err?.message?.includes('Authentication required') || err?.message?.includes('Unauthorized')) {
                setError('Please log in to view your projects. If you are already logged in, try refreshing the page.');
            } else {
                setError('Failed to load projects. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProjects();
        const handleRefresh = () => loadProjects();
        const handleVisibility = () => { if (!document.hidden) loadProjects(); };
        window.addEventListener('focus', handleRefresh);
        document.addEventListener('visibilitychange', handleVisibility);
        return () => {
            window.removeEventListener('focus', handleRefresh);
            document.removeEventListener('visibilitychange', handleVisibility);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!currentUser?.uid) return;
        const id = window.setInterval(async () => {
            try {
                const next = await fetchCanvasInvitations();
                setInvitations(prev => JSON.stringify(prev) === JSON.stringify(next) ? prev : next);
            } catch { }
        }, 4000);
        return () => window.clearInterval(id);
    }, [currentUser?.uid]);

    const handleCreateNewProject = () => {
        window.open(`${canvasUrl}?projectId=new`, '_blank', 'noopener,noreferrer');
    };

    const handleOpenProject = async (projectId: string) => {
        let authHint = '';
        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('idToken');
            if (token && token.startsWith('eyJ')) authHint = `#authToken=${encodeURIComponent(token)}`;
        } catch { }
        window.open(`${canvasUrl}?projectId=${projectId}${authHint}`, '_blank', 'noopener,noreferrer');
    };

    const handleDeleteProject = async (e: React.MouseEvent, projectId: string, projectName: string) => {
        e.stopPropagation();
        if (!confirm(`Delete "${projectName}"? This cannot be undone.`)) return;
        try {
            await deleteProject(projectId);
            setProjects(prev => prev.filter(p => p.id !== projectId));
        } catch (err: any) {
            alert(err.message || 'Failed to delete project.');
        }
    };

    const handleInvitationAction = (invitationId: string, status: 'accepted' | 'dismissed') => {
        (async () => {
            try {
                const updated = status === 'accepted'
                    ? await acceptCanvasInvitation(invitationId)
                    : await dismissCanvasInvitation(invitationId);
                await loadProjects();
                await syncInvitationsForUser(currentUser);
                if (updated && status === 'accepted') {
                    setActiveCategory('shared');
                    dispatch(addNotification({ type: 'success', message: `${updated.projectName} moved to Shared projects.` }));
                    return;
                }
                dispatch(addNotification({ type: 'info', message: 'Invitation dismissed.' }));
            } catch (err) {
                dispatch(addNotification({ type: 'error', message: err instanceof Error ? err.message : 'Failed to update invitation.' }));
            }
        })();
    };

    const formatDate = (dateInput: unknown) => {
        if (!dateInput) return '';
        let date: Date;
        if (typeof dateInput === 'string' || typeof dateInput === 'number') {
            date = new Date(dateInput);
        } else if (typeof dateInput === 'object' && dateInput !== null && '_seconds' in dateInput && typeof (dateInput as any)._seconds === 'number') {
            date = new Date((dateInput as any)._seconds * 1000);
        } else if (typeof dateInput === 'object' && dateInput !== null && 'seconds' in dateInput && typeof (dateInput as any).seconds === 'number') {
            date = new Date((dateInput as any).seconds * 1000);
        } else if (dateInput instanceof Date) {
            date = dateInput;
        } else {
            return 'Recently';
        }
        if (isNaN(date.getTime())) return 'Recently';
        const diffDays = Math.floor((Date.now() - date.getTime()) / 86400000);
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const toSafeIsoString = (dateInput: unknown) => {
        if (!dateInput) return new Date().toISOString();
        if (typeof dateInput === 'string' || typeof dateInput === 'number') {
            const d = new Date(dateInput);
            return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
        }
        if (typeof dateInput === 'object' && dateInput !== null) {
            if ('_seconds' in dateInput) return new Date((dateInput as any)._seconds * 1000).toISOString();
            if ('seconds' in dateInput) return new Date((dateInput as any).seconds * 1000).toISOString();
            if ('toDate' in dateInput && typeof (dateInput as any).toDate === 'function') {
                const d = (dateInput as any).toDate();
                if (d instanceof Date && !isNaN(d.getTime())) return d.toISOString();
            }
        }
        if (dateInput instanceof Date && !isNaN(dateInput.getTime())) return dateInput.toISOString();
        return new Date().toISOString();
    };

    const pendingInvitations = useMemo(() => invitations.filter(i => i.status === 'pending'), [invitations]);

    const ownedProjects = useMemo<ProjectCard[]>(
        () => projects.filter(p => !currentUser?.uid || p.ownerUid === currentUser.uid).map(p => ({ ...p, accessType: 'owned' })),
        [currentUser?.uid, projects]
    );

    const sharedProjects = useMemo<ProjectCard[]>(() => {
        const api = projects
            .filter(p => !!currentUser?.uid && p.ownerUid !== currentUser.uid)
            .map(p => ({ ...p, accessType: 'shared' as const }));
        const placeholders = invitations
            .filter(i => i.status === 'accepted' && !api.some(p => p.id === i.projectId))
            .map<ProjectCard>(i => ({
                id: i.projectId, name: i.projectName, ownerUid: '',
                createdAt: toSafeIsoString(i.createdAt),
                updatedAt: toSafeIsoString(i.updatedAt || i.createdAt),
                accessType: 'shared', isPlaceholder: true,
                sharedBy: i.senderUsername || i.senderEmail,
            }));
        return [...api, ...placeholders];
    }, [currentUser?.uid, invitations, projects]);

    const visibleProjects = useMemo<ProjectCard[]>(() => {
        const base = activeCategory === 'owned' ? ownedProjects : sharedProjects;
        const sorted = [...base].sort((a, b) => {
            if (sortBy === 'name') {
                const cmp = a.name.localeCompare(b.name);
                return sortAsc ? cmp : -cmp;
            }
            const da = new Date(toSafeIsoString(a.updatedAt)).getTime();
            const db = new Date(toSafeIsoString(b.updatedAt)).getTime();
            return sortAsc ? da - db : db - da;
        });
        return sorted;
    }, [activeCategory, ownedProjects, sharedProjects, sortBy, sortAsc]);

    // ─── Render ──────────────────────────────────────────────────────────────────
    return (
        <div className="animate-in fade-in duration-500 space-y-8">
            {/* ── Header ── */}
            <div className="flex items-start justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-semibold tracking-tight text-white">Projects</h1>
                    <p className="text-sm text-slate-500 mt-1.5">
                        Your canvas workspace &mdash; create, iterate, and collaborate.
                    </p>
                </div>
                <button
                    onClick={handleCreateNewProject}
                    className="flex-shrink-0 flex items-center gap-2 bg-white text-black px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-[#60a5fa] hover:text-white transition-all duration-200 shadow-lg shadow-black/30"
                >
                    <Plus size={15} strokeWidth={2.5} />
                    New Canvas
                </button>
            </div>

            {/* ── Pending invitations banner ── */}
            {pendingInvitations.length > 0 && (
                <div className="rounded-2xl border border-blue-500/20 bg-blue-500/[0.07] backdrop-blur-sm overflow-hidden">
                    <div className="flex items-center gap-3 px-5 py-4 border-b border-blue-500/10">
                        <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                            <Bell size={14} className="text-blue-400" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-white">
                                {pendingInvitations.length} pending invitation{pendingInvitations.length > 1 ? 's' : ''}
                            </p>
                            <p className="text-xs text-blue-200/50 mt-0.5">Accept to add the project to your Shared workspace.</p>
                        </div>
                    </div>
                    <div className="divide-y divide-white/[0.04]">
                        {pendingInvitations.map(inv => (
                            <div key={inv.id} className="flex items-center justify-between gap-4 px-5 py-4">
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-white truncate">{inv.projectName}</p>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        from {inv.senderUsername || inv.senderEmail || 'a teammate'} &middot; {inv.recipientEmail}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <button
                                        onClick={() => handleInvitationAction(inv.id, 'accepted')}
                                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white text-black text-xs font-semibold hover:bg-[#60a5fa] hover:text-white transition-colors"
                                    >
                                        <Check size={11} strokeWidth={3} /> Accept
                                    </button>
                                    <button
                                        onClick={() => handleInvitationAction(inv.id, 'dismissed')}
                                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/60 text-xs font-medium hover:bg-white/10 hover:text-white transition-colors"
                                    >
                                        <X size={11} /> Dismiss
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Controls bar ── */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                {/* Tabs */}
                <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                    {(['owned', 'shared'] as const).map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${activeCategory === cat
                                    ? 'bg-white text-black shadow-sm'
                                    : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            {cat === 'owned' ? 'My Projects' : 'Shared'}
                            <span className={`ml-1.5 text-xs ${activeCategory === cat ? 'text-black/50' : 'text-white/20'}`}>
                                {cat === 'owned' ? ownedProjects.length : sharedProjects.length}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Right controls */}
                <div className="flex items-center gap-2">
                    {/* Sort */}
                    <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                        <button
                            onClick={() => setSortBy('recent')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${sortBy === 'recent' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-white'}`}
                        >
                            <Clock size={11} /> Recent
                        </button>
                        <button
                            onClick={() => setSortBy('name')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${sortBy === 'name' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-white'}`}
                        >
                            <SortAsc size={11} /> Name
                        </button>
                        <button
                            onClick={() => setSortAsc(v => !v)}
                            className="px-2.5 py-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-all"
                            title={sortAsc ? 'Ascending' : 'Descending'}
                        >
                            {sortAsc ? <SortAsc size={12} /> : <SortDesc size={12} />}
                        </button>
                    </div>

                    {/* View toggle */}
                    <div className="flex items-center gap-0.5 p-1 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-white'}`}
                        >
                            <LayoutGrid size={14} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-white'}`}
                        >
                            <List size={14} />
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Content ── */}
            {loading ? (
                viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
                    </div>
                ) : (
                    <div className="space-y-2">
                        {Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}
                    </div>
                )
            ) : error ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
                        <span className="text-red-400 text-lg">!</span>
                    </div>
                    <p className="text-white font-medium mb-1">Something went wrong</p>
                    <p className="text-sm text-slate-500 mb-6 max-w-xs">{error}</p>
                    <button
                        onClick={loadProjects}
                        className="px-5 py-2 rounded-full bg-white/5 border border-white/10 text-white text-sm hover:bg-white/10 transition-colors"
                    >
                        Try again
                    </button>
                </div>
            ) : viewMode === 'grid' ? (
                <GridView
                    projects={visibleProjects}
                    activeCategory={activeCategory}
                    pendingCount={pendingInvitations.length}
                    onCreateNew={handleCreateNewProject}
                    onOpen={handleOpenProject}
                    onDelete={handleDeleteProject}
                    formatDate={formatDate}
                />
            ) : (
                <ListView
                    projects={visibleProjects}
                    activeCategory={activeCategory}
                    pendingCount={pendingInvitations.length}
                    onCreateNew={handleCreateNewProject}
                    onOpen={handleOpenProject}
                    onDelete={handleDeleteProject}
                    formatDate={formatDate}
                />
            )}
        </div>
    );
}

// ─── Grid View ─────────────────────────────────────────────────────────────────
interface ViewProps {
    projects: (CanvasProject & { accessType: 'owned' | 'shared'; isPlaceholder?: boolean; sharedBy?: string })[];
    activeCategory: 'owned' | 'shared';
    pendingCount: number;
    onCreateNew: () => void;
    onOpen: (id: string) => void;
    onDelete: (e: React.MouseEvent, id: string, name: string) => void;
    formatDate: (d: unknown) => string;
}

function GridView({ projects, activeCategory, pendingCount, onCreateNew, onOpen, onDelete, formatDate }: ViewProps) {
    const isEmpty = projects.length === 0 && activeCategory === 'shared' && pendingCount === 0;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {activeCategory === 'owned' && (
                <button
                    onClick={onCreateNew}
                    className="group aspect-[4/3] rounded-2xl border border-dashed border-white/[0.08] hover:border-[#60a5fa]/40 bg-transparent hover:bg-[#60a5fa]/[0.04] transition-all duration-300 flex flex-col items-center justify-center gap-3"
                >
                    <div className="w-11 h-11 rounded-2xl bg-white/[0.05] border border-white/[0.08] group-hover:bg-[#60a5fa]/15 group-hover:border-[#60a5fa]/40 flex items-center justify-center transition-all duration-300">
                        <Plus size={20} className="text-white/25 group-hover:text-[#60a5fa] transition-colors duration-300" strokeWidth={2} />
                    </div>
                    <div className="text-center">
                        <p className="text-xs font-medium text-white/25 group-hover:text-white/50 transition-colors">New Canvas</p>
                    </div>
                </button>
            )}

            {isEmpty && (
                <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-4">
                        <Users size={22} className="text-white/20" />
                    </div>
                    <p className="text-sm font-medium text-white/50 mb-1">No shared projects yet</p>
                    <p className="text-xs text-slate-600 max-w-xs">Accepted collaboration invitations will appear here.</p>
                </div>
            )}

            {projects.map(p => {
                const [c1, c2] = getGradient(p.name);
                return (
                    <div
                        key={p.id}
                        onClick={() => onOpen(p.id)}
                        className="group relative aspect-[4/3] rounded-2xl overflow-hidden cursor-pointer border border-white/[0.06] hover:border-white/[0.18] transition-all duration-300 hover:scale-[1.01] hover:shadow-[0_20px_40px_rgba(0,0,0,0.5)]"
                    >
                        {/* Thumbnail or gradient */}
                        {p.thumbnail ? (
                            <Image
                                src={p.thumbnail} fill
                                className="object-cover group-hover:scale-105 transition-transform duration-700"
                                alt={p.name} unoptimized
                            />
                        ) : (
                            <div
                                className="absolute inset-0"
                                style={{ background: `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)` }}
                            >
                                <div className="absolute inset-0 opacity-30" style={{
                                    backgroundImage: 'radial-gradient(circle at 25% 35%, rgba(255,255,255,0.08) 0%, transparent 55%), radial-gradient(circle at 75% 70%, rgba(96,165,250,0.12) 0%, transparent 55%)',
                                }} />
                            </div>
                        )}

                        {/* Bottom gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />

                        {/* Info */}
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                            <div className="flex items-end justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-sm font-semibold text-white truncate leading-snug">{p.name}</h3>
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <Clock size={9} className="text-slate-500 flex-shrink-0" />
                                        <span className="text-[11px] text-slate-500">{formatDate(p.updatedAt)}</span>
                                        {p.accessType === 'shared' && (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/20 border border-blue-500/25 px-1.5 py-px text-[9px] font-medium text-blue-300 ml-1">
                                                <Users size={7} /> Shared
                                            </span>
                                        )}
                                    </div>
                                    {p.isPlaceholder && (
                                        <p className="text-[10px] text-amber-400/70 mt-1">Syncing&hellip;</p>
                                    )}
                                </div>

                                {/* Action buttons — appear on hover */}
                                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex-shrink-0">
                                    {p.accessType === 'owned' && (
                                        <button
                                            onClick={e => onDelete(e, p.id, p.name)}
                                            className="w-7 h-7 rounded-full bg-red-500/15 hover:bg-red-500 flex items-center justify-center text-red-400 hover:text-white transition-colors"
                                            title="Delete"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                                        </button>
                                    )}
                                    <button
                                        className="w-7 h-7 rounded-full bg-white/10 hover:bg-white hover:text-black flex items-center justify-center text-white transition-colors"
                                        title="Open"
                                    >
                                        <ArrowUpRight size={12} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ─── List View ─────────────────────────────────────────────────────────────────
function ListView({ projects, activeCategory, pendingCount, onCreateNew, onOpen, onDelete, formatDate }: ViewProps) {
    const isEmpty = projects.length === 0 && activeCategory === 'shared' && pendingCount === 0;

    return (
        <div className="space-y-1.5">
            {activeCategory === 'owned' && (
                <button
                    onClick={onCreateNew}
                    className="group w-full flex items-center gap-4 p-3.5 rounded-xl border border-dashed border-white/[0.08] hover:border-[#60a5fa]/30 hover:bg-[#60a5fa]/[0.03] transition-all"
                >
                    <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center group-hover:bg-[#60a5fa]/10 group-hover:border-[#60a5fa]/30 transition-all flex-shrink-0">
                        <Plus size={16} className="text-white/25 group-hover:text-[#60a5fa] transition-colors" />
                    </div>
                    <span className="text-sm text-white/25 group-hover:text-white/50 font-medium transition-colors">New Canvas</span>
                </button>
            )}

            {isEmpty && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <Users size={28} className="text-white/10 mb-3" />
                    <p className="text-sm text-white/30">No shared projects yet</p>
                </div>
            )}

            {projects.map(p => {
                const [c1, c2] = getGradient(p.name);
                return (
                    <div
                        key={p.id}
                        onClick={() => onOpen(p.id)}
                        className="group flex items-center gap-4 p-3.5 rounded-xl border border-white/[0.05] bg-white/[0.01] hover:bg-white/[0.04] hover:border-white/[0.10] transition-all cursor-pointer"
                    >
                        {/* Thumbnail */}
                        <div className="relative w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 border border-white/[0.08]">
                            {p.thumbnail ? (
                                <Image src={p.thumbnail} fill className="object-cover" alt={p.name} unoptimized />
                            ) : (
                                <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }} />
                            )}
                        </div>

                        {/* Name + date */}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{p.name}</p>
                            <div className="flex items-center gap-1 mt-0.5">
                                <Clock size={9} className="text-slate-600" />
                                <span className="text-[11px] text-slate-600">{formatDate(p.updatedAt)}</span>
                                {p.isPlaceholder && <span className="text-[10px] text-amber-400/60 ml-1">Syncing…</span>}
                            </div>
                        </div>

                        {/* Shared badge */}
                        {p.accessType === 'shared' && (
                            <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 text-[10px] text-blue-300 font-medium flex-shrink-0">
                                <Users size={8} /> Shared
                                {p.sharedBy && <span className="text-blue-300/50 ml-0.5">· {p.sharedBy}</span>}
                            </span>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                            {p.accessType === 'owned' && (
                                <button
                                    onClick={e => onDelete(e, p.id, p.name)}
                                    className="w-7 h-7 rounded-lg bg-red-500/10 hover:bg-red-500 flex items-center justify-center text-red-400 hover:text-white transition-colors"
                                    title="Delete"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                                </button>
                            )}
                            <button
                                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
                                title="Open"
                            >
                                <ArrowUpRight size={13} />
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}