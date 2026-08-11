'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UploadCloud, Type, Loader2, Sparkles, X, GripVertical,
  Lock, LogOut, KeyRound, Image as ImageIcon, Maximize2, XCircle,
  Camera, Heart, MessageCircleHeart
} from 'lucide-react';
import { toast } from 'sonner';
import { useAdmin } from '@/contexts/AdminContext';

interface BoardItem {
  id: string;
  type: 'photo' | 'text';
  filename?: string | null;
  filepath?: string | null;
  thumbnail?: string | null;
  content?: string | null;
  rotation: number;
  x: number;
  y: number;
  z: number;
  roast?: string | null;
}

function getImgSrc(item: BoardItem): string {
  if (item.type === 'photo') {
    if (item.filepath) return `/uploads/${item.filepath}`;
    if (item.thumbnail) return `/uploads/${item.thumbnail}`;
  }
  return '';
}

// --- Lightbox ---
function Lightbox({ item, onClose }: { item: BoardItem; onClose: () => void }) {
  const src = getImgSrc(item);
  if (!src) return null;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 md:p-8"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.85, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="relative max-w-3xl w-full max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 text-white/70 hover:text-white transition-colors p-2"
        >
          <X size={24} />
        </button>
        <div className="bg-white rounded-2xl overflow-hidden shadow-2xl">
          <div className="w-full max-h-[65vh] overflow-hidden bg-neutral-100">
            <img src={src} alt={item.filename || ''} className="w-full h-full object-contain" />
          </div>
          {item.roast && (
            <div className="p-5 border-t border-neutral-100">
              <div className="flex items-start gap-3">
                <MessageCircleHeart size={18} className="text-rose-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-neutral-400 font-semibold mb-1">AI Roast</p>
                  <p className="text-neutral-700 text-sm leading-relaxed italic font-medium">&ldquo;{item.roast}&rdquo;</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// --- Login Modal ---
function LoginModal({ onLogin, onClose }: { onLogin: (pw: string) => Promise<boolean>; onClose: () => void }) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    setLoading(true);
    const ok = await onLogin(password);
    setLoading(false);
    if (!ok) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      toast.error('Wrong password!');
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-stone-100 to-stone-200 flex items-center justify-center shadow-inner">
            <KeyRound size={20} className="text-stone-600" />
          </div>
          <div>
            <h2 className="font-bold text-lg text-stone-900">Admin Login</h2>
            <p className="text-xs text-stone-400">Enter password to manage the board</p>
          </div>
        </div>
        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400 transition-all ${shake ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}
            onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
          />
          <button
            type="submit"
            disabled={loading || !password.trim()}
            className="w-full mt-4 bg-stone-900 hover:bg-stone-800 text-white py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Lock size={14} />}
            {loading ? 'Checking...' : 'Login'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

// --- Photo Card ---
function PhotoCard({ item, isAdmin, onDelete, onBringToFront }: {
  item: BoardItem;
  isAdmin: boolean;
  onDelete: (id: string) => void;
  onBringToFront: (id: string) => void;
}) {
  const [lightbox, setLightbox] = useState(false);
  const src = getImgSrc(item);

  return (
    <>
      <motion.div
        data-board-item
        drag={isAdmin}
        dragMomentum={false}
        onDragStart={isAdmin ? () => onBringToFront(item.id) : undefined}
        initial={{ x: item.x, y: item.y, rotate: item.rotation, scale: 0, opacity: 0 }}
        animate={{ x: item.x, y: item.y, rotate: item.rotation, scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22, delay: Math.random() * 0.15 }}
        style={{ zIndex: item.z }}
        className={isAdmin ? 'absolute group' : 'absolute'}
        whileDrag={isAdmin ? { scale: 1.04, zIndex: 9999, cursor: 'grabbing' } : undefined}
        whileHover={isAdmin ? { zIndex: 9998 } : undefined}
        onClick={() => !isAdmin && setLightbox(true)}
      >
        <div className={
          `relative bg-white p-2 sm:p-2.5 pb-6 sm:pb-8 rounded-sm shadow-[0_4px_20px_-4px_rgba(0,0,0,0.12),0_2px_8px_-2px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.18),0_4px_12px_-2px_rgba(0,0,0,0.1)] transition-shadow duration-300 border border-stone-100 max-w-[180px] sm:max-w-[220px] md:max-w-[260px] ${!isAdmin ? 'cursor-pointer' : 'cursor-grab'}`
        }>
          {/* Photo */}
          <div className="relative w-full aspect-square overflow-hidden bg-stone-50 rounded-[2px]">
            {src ? (
              <img
                src={src}
                alt={item.filename || ''}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                draggable={false}
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Camera size={28} className="text-stone-300" />
              </div>
            )}

            {/* Admin delete button */}
            {isAdmin && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg hover:bg-red-600 hover:scale-110"
              >
                <XCircle size={14} />
              </button>
            )}

            {/* Public lightbox hint */}
            {!isAdmin && (
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                <div className="bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg">
                  <Maximize2 size={16} className="text-stone-700" />
                </div>
              </div>
            )}
          </div>

          {/* Caption area (polaroid style) */}
          <div className="mt-1.5 px-0.5">
            {item.roast ? (
              <p className="text-[10px] sm:text-[11px] leading-snug text-stone-500 font-medium italic line-clamp-2">&ldquo;{item.roast}&rdquo;</p>
            ) : (
              <p className="text-[10px] text-stone-300 italic">AI roasting...</p>
            )}
          </div>
        </div>
      </motion.div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && <Lightbox item={item} onClose={() => setLightbox(false)} />}
      </AnimatePresence>
    </>
  );
}

// --- Text Item ---
function TextItem({ item, isAdmin, onDelete, onBlur, onBringToFront, onDragEnd }: {
  item: BoardItem;
  isAdmin: boolean;
  onDelete: (id: string) => void;
  onBlur: (id: string, content: string) => void;
  onBringToFront: (id: string) => void;
  onDragEnd: (id: string, offsetX: number, offsetY: number, item: BoardItem) => void;
}) {
  return (
    <motion.div
      data-board-item
      drag={isAdmin}
      dragMomentum={false}
      onDragStart={isAdmin ? () => onBringToFront(item.id) : undefined}
      onDragEnd={isAdmin ? (_e: any, info: any) => onDragEnd(item.id, info.offset.x, info.offset.y, item) : undefined}
      initial={{ x: item.x, y: item.y, rotate: item.rotation, scale: 0, opacity: 0 }}
      animate={{ x: item.x, y: item.y, rotate: item.rotation, scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      style={{ zIndex: item.z }}
      className={isAdmin ? 'absolute group' : 'absolute'}
      whileDrag={isAdmin ? { scale: 1.04, zIndex: 9999 } : undefined}
    >
      <div className="relative">
        {isAdmin && (
          <div className="absolute -left-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing p-1 text-stone-300 hover:text-stone-500 transition-all">
            <GripVertical size={16} />
          </div>
        )}
        <p
          className="font-semibold text-2xl sm:text-3xl md:text-4xl leading-tight text-stone-800/80 p-1 drop-shadow-sm"
          style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
        >
          {item.content || ''}
        </p>
        {isAdmin && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
              className="absolute -top-3 -right-3 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:bg-red-600"
            >
              <XCircle size={14} />
            </button>
            <textarea
              defaultValue={item.content || ''}
              onBlur={(e) => onBlur(item.id, e.target.value)}
              className="absolute inset-0 bg-transparent border-none outline-none resize-none overflow-hidden font-semibold text-2xl sm:text-3xl md:text-4xl leading-tight text-stone-800/80 p-1 opacity-0 hover:opacity-100 focus:opacity-100 transition-opacity"
              style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
              rows={1}
              onPointerDownCapture={(e) => e.stopPropagation()}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); e.currentTarget.blur(); } }}
            />
          </>
        )}
      </div>
    </motion.div>
  );
}

// --- Main Page ---
export default function BoardPage() {
  const { isAdmin, isLoading: authLoading, login, logout } = useAdmin();
  const [items, setItems] = useState<BoardItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/board/items')
      .then(r => r.ok ? r.json() : [])
      .then((data: BoardItem[]) => { if (Array.isArray(data)) setItems(data); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, []);

  // --- Admin handlers ---
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave' && !e.currentTarget.contains(e.relatedTarget as Node)) setDragActive(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setDragActive(false);
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    if (files.length > 0) await uploadFiles(files);
  }, []);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length > 0) await uploadFiles(files);
    e.target.value = '';
  }, []);

  const uploadFiles = useCallback(async (files: File[]) => {
    setIsUploading(true);
    const formData = new FormData();
    files.forEach(f => formData.append('photos', f));
    try {
      const res = await fetch('/api/board/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.items) {
        setItems(prev => [...prev, ...data.items]);
        toast.success(`${data.items.length} photo${data.items.length > 1 ? 's' : ''} uploaded!`);
        for (const item of data.items) {
          if (item.filepath) {
            fetch('/api/board/roast', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ itemId: item.id, filepath: item.filepath }),
            }).then(r => r.json()).then(({ roast }) => {
              if (roast) {
                setItems(prev => prev.map(i => i.id === item.id ? { ...i, roast } : i));
                fetch('/api/board/items', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: item.id, roast }) });
              }
            }).catch(() => {});
          }
        }
      } else { toast.error('Upload failed'); }
    } catch { toast.error('Upload failed'); } finally { setIsUploading(false); }
  }, []);

  const addText = useCallback(async (x?: number, y?: number) => {
    try {
      const res = await fetch('/api/board/items', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'text', content: 'Type something...', posX: x ?? 400, posY: y ?? 300 }),
      });
      if (res.ok) { const item = await res.json(); setItems(prev => [...prev, item]); }
    } catch { toast.error('Failed to add text'); }
  }, []);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-board-item]')) return;
    addText(e.clientX, e.clientY);
  }, [addText]);

  const deleteItem = useCallback(async (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
    try { await fetch(`/api/board/items?id=${id}`, { method: 'DELETE' }); } catch { /* */ }
  }, []);

  const handleDragEnd = useCallback((id: string, offsetX: number, offsetY: number, item: BoardItem) => {
    const newX = item.x + offsetX; const newY = item.y + offsetY;
    setItems(prev => prev.map(i => i.id === id ? { ...i, x: newX, y: newY } : i));
    fetch('/api/board/items', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, posX: newX, posY: newY }) }).catch(() => {});
  }, []);

  const handleTextBlur = useCallback((id: string, content: string) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, content } : i));
    fetch('/api/board/items', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, content }) }).catch(() => {});
  }, []);

  const bringToFront = useCallback((id: string) => {
    setItems(prev => {
      const maxZ = Math.max(0, ...prev.map(i => i.z)); const newZ = maxZ + 1;
      const updated = prev.map(i => i.id === id ? { ...i, z: newZ } : i);
      fetch('/api/board/items', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, zIndex: newZ }) }).catch(() => {});
      return updated;
    });
  }, []);

  const handleLogin = useCallback(async (password: string) => {
    const ok = await login(password);
    if (ok) { setShowLogin(false); toast.success('Welcome back, admin!'); }
    return ok;
  }, [login]);

  const handleLogout = useCallback(async () => {
    await logout();
    toast.success('Logged out');
  }, [logout]);

  if (authLoading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-[#F7F6F3]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-stone-300" size={28} />
          <p className="text-stone-400 text-sm font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  const photoCount = items.filter(i => i.type === 'photo').length;

  return (
    <div className="w-screen h-screen overflow-hidden text-stone-900 font-sans relative selection:bg-amber-200/60 bg-[#F7F6F3]">
      {/* Subtle texture overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />

      {/* ===== TOOLBAR ===== */}
      <div className="absolute top-4 sm:top-6 left-1/2 -translate-x-1/2 z-50">
        <div className="bg-white/70 backdrop-blur-xl px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl shadow-[0_8px_32px_-8px_rgba(0,0,0,0.1),0_2px_8px_-2px_rgba(0,0,0,0.06)] flex items-center gap-2 sm:gap-4 border border-white/60">
          {/* Logo */}
          <div className="flex items-center gap-2 sm:gap-2.5 pr-2 sm:pr-3">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm">
              <Camera size={14} className="sm:w-4 sm:h-4 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="font-bold text-sm text-stone-800 leading-tight" style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}>
                Ugly Photo Collection
              </h1>
              <p className="text-[10px] text-stone-400 font-medium">{photoCount} photo{photoCount !== 1 ? 's' : ''}</p>
            </div>
          </div>

          <div className="w-px h-8 bg-stone-200/60" />

          {isAdmin ? (
            <div className="flex gap-1.5 sm:gap-2">
              <button
                onClick={() => addText()}
                className="flex items-center gap-1.5 bg-stone-100 hover:bg-stone-200 text-stone-600 px-3 py-2 rounded-xl font-medium transition-all text-xs sm:text-sm active:scale-[0.97] hover:shadow-sm"
              >
                <Type size={14} /> <span className="hidden sm:inline">Text</span>
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 bg-stone-900 hover:bg-stone-800 text-white px-3 py-2 rounded-xl font-medium transition-all text-xs sm:text-sm shadow-sm shadow-stone-900/20 active:scale-[0.97]"
              >
                <UploadCloud size={14} /> <span className="hidden sm:inline">Upload</span>
              </button>
              <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={handleFileChange} className="hidden" />
              <div className="w-px h-8 bg-stone-200/60" />
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-stone-400 hover:text-red-500 px-2 py-2 rounded-xl transition-colors text-xs sm:text-sm"
                title="Logout"
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowLogin(true)}
              className="flex items-center gap-1.5 text-stone-400 hover:text-stone-600 px-2.5 py-2 rounded-xl hover:bg-stone-100/50 transition-all text-xs sm:text-sm font-medium"
            >
              <Lock size={12} /> <span className="hidden sm:inline">Admin</span>
            </button>
          )}
        </div>
      </div>

      {/* Upload Loading Overlay (admin) */}
      <AnimatePresence>
        {isUploading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] bg-[#F7F6F3]/80 backdrop-blur-sm flex items-center justify-center flex-col gap-4"
          >
            <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center gap-4">
              <div className="relative">
                <Loader2 className="animate-spin text-amber-500" size={40} />
              </div>
              <div className="text-center">
                <p className="font-semibold text-stone-700">Uploading photos...</p>
                <p className="text-sm text-stone-400 mt-1">AI will roast them shortly 🔥</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drag overlay (admin) */}
      <AnimatePresence>
        {dragActive && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="absolute inset-6 z-[90] bg-amber-500/5 border-2 border-dashed border-amber-400/40 rounded-3xl pointer-events-none flex items-center justify-center"
          >
            <div className="flex flex-col items-center gap-3 text-amber-600/80">
              <UploadCloud size={40} />
              <p className="text-xl font-bold">Drop photos here</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== BOARD ITEMS ===== */}
      {loaded && items.map((item) => (
        item.type === 'photo' ? (
          <PhotoCard
            key={item.id}
            item={item}
            isAdmin={isAdmin}
            onDelete={deleteItem}
            onBringToFront={bringToFront}
          />
        ) : (
          <TextItem
            key={item.id}
            item={item}
            isAdmin={isAdmin}
            onDelete={deleteItem}
            onBlur={handleTextBlur}
            onBringToFront={bringToFront}
            onDragEnd={handleDragEnd}
          />
        )
      ))}

      {/* Empty state */}
      {loaded && items.length === 0 && !isUploading && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-stone-100 flex items-center justify-center mx-auto mb-4">
              <ImageIcon size={28} className="text-stone-300" />
            </div>
            <p className="text-stone-400 font-medium text-sm sm:text-base max-w-xs">
              {isAdmin ? 'Double-click to add text, or drop photos here' : 'No photos yet. Check back later!'}
            </p>
          </div>
        </div>
      )}

      {/* Public footer */}
      {!isAdmin && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
          <button
            onClick={() => setShowLogin(true)}
            className="flex items-center gap-2 text-stone-300 hover:text-stone-500 transition-colors text-xs font-medium"
            title="Admin Login"
          >
            <Lock size={12} />
            <span>admin</span>
          </button>
        </div>
      )}

      {/* Login Modal */}
      <AnimatePresence>
        {showLogin && <LoginModal onLogin={handleLogin} onClose={() => setShowLogin(false)} />}
      </AnimatePresence>
    </div>
  );
}