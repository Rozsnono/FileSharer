"use client";
import { useState, useEffect } from 'react';
import { HardDrive, Calendar, UserCircle, Upload as UploadIcon } from 'lucide-react';
import FileList from './FileList';

export type FileStatus = 'pending' | 'uploading' | 'uploaded' | 'error';

export interface FileItem {
    id: string;
    fileName?: string;
    originalName: string;
    size: number;
    uploadedAt: string;
    status: FileStatus;
    progress: number;
}

export default function DashboardClient({ linkId, initialFiles, role, expiresAt }: any) {
    const [files, setFiles] = useState<FileItem[]>(initialFiles);
    const [mounted, setMounted] = useState(false);

    // Fix hydration mismatch by waiting for client mount
    useEffect(() => {
        setMounted(true);
    }, []);

    const startUpload = async (file: File) => {
        const tempId = Math.random().toString(36).slice(2);
        const newFile: FileItem = {
            id: tempId, originalName: file.name, size: file.size,
            uploadedAt: new Date().toISOString(), status: 'pending', progress: 0
        };
        setFiles(prev => [newFile, ...prev]);

        try {
            updateFileStatus(tempId, { status: 'uploading', progress: 0 });

            // 1. Init
            const initRes = await fetch(`/api/upload/${linkId}/init`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ originalName: file.name })
            });
            if (!initRes.ok) throw new Error("Init failed");
            const { uploadId } = await initRes.json();

            // 2. Chunks
            const chunkSize = 1 * 1024 * 1024; // 1MB
            const totalChunks = Math.ceil(file.size / chunkSize);
            let uploadedChunks = 0;

            // Upload chunks sequentially to avoid memory spikes
            for (let i = 0; i < totalChunks; i++) {
                const start = i * chunkSize;
                const end = Math.min(file.size, start + chunkSize);
                const chunk = file.slice(start, end);

                const formData = new FormData();
                formData.append('uploadId', uploadId);
                formData.append('chunkIndex', i.toString());
                formData.append('chunk', chunk);

                const chunkRes = await fetch(`/api/upload/${linkId}/chunk`, {
                    method: 'POST',
                    body: formData
                });
                if (!chunkRes.ok) throw new Error(`Chunk ${i} failed`);
                
                uploadedChunks++;
                const percent = Math.round((uploadedChunks / totalChunks) * 100);
                // Keep at 99% until complete finishes
                updateFileStatus(tempId, { progress: percent === 100 ? 99 : percent });
            }

            // 3. Complete
            const completeRes = await fetch(`/api/upload/${linkId}/complete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    uploadId,
                    originalName: file.name,
                    size: file.size,
                    mimeType: file.type,
                    totalChunks
                })
            });
            if (!completeRes.ok) throw new Error("Complete failed");
            const { file: completedFile } = await completeRes.json();

            updateFileStatus(tempId, {
                status: 'uploaded',
                progress: 100,
                fileName: completedFile.fileName
            });
        } catch (error) {
            console.error("Upload error", error);
            updateFileStatus(tempId, { status: 'error', progress: 0 });
        }
    };

    const updateFileStatus = (id: string, updates: Partial<FileItem>) => {
        setFiles(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
    };

    const formattedExpiry = mounted
        ? new Date(expiresAt).toLocaleDateString()
        : "Loading...";

    return (
        <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8">
            <div className="max-w-5xl mx-auto">
                {/* Modern Header */}
                <div className="bg-white rounded-[2rem] p-6 md:p-8 mb-8 border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                            <HardDrive className="text-white w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-slate-900">Vault Manager</h1>
                            <p className="text-xs font-mono text-slate-400 truncate max-w-[200px]">{linkId}</p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <HeaderStat
                            icon={<Calendar className="w-4 h-4 text-slate-400" />}
                            label="Expires"
                            value={formattedExpiry}
                        />
                        <HeaderStat
                            icon={<UserCircle className="w-4 h-4 text-slate-400" />}
                            label="Access"
                            value={role}
                        />
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Main List */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest">Files Registry</h2>
                            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">
                                {files.length} Total
                            </span>
                        </div>
                        <FileList files={files} linkId={linkId} />
                    </div>

                    {/* Action Sidebar */}
                    <div className="space-y-6">
                        {role === 'UPLOADER' ? (
                            <div className="bg-white p-2 rounded-[2rem] shadow-sm border border-slate-100">
                                <label className="group cursor-pointer block">
                                    <input
                                        type="file"
                                        className="hidden"
                                        onChange={(e) => e.target.files?.[0] && startUpload(e.target.files[0])}
                                    />
                                    <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[1.8rem] p-10 text-center group-hover:border-indigo-400 group-hover:bg-indigo-50/30 transition-all">
                                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm group-hover:scale-110 transition-transform">
                                            <UploadIcon className="text-indigo-600 w-6 h-6" />
                                        </div>
                                        <p className="font-bold text-slate-700">Add New File</p>
                                        <p className="text-xs text-slate-400 mt-1">Direct upload to NAS</p>
                                    </div>
                                </label>
                            </div>
                        ) : (
                            <div className="bg-indigo-600 rounded-[2rem] p-8 text-white shadow-xl shadow-indigo-100">
                                <h3 className="font-bold text-lg mb-2">Receiver Mode</h3>
                                <p className="text-indigo-100 text-sm leading-relaxed">
                                    Files uploaded by the sender will appear here instantly. Click the download icon to fetch them.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function HeaderStat({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
    return (
        <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
            <div>{icon}</div>
            <div>
                <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1">{label}</p>
                <p className="text-xs font-bold text-slate-700 leading-none">{value}</p>
            </div>
        </div>
    );
}