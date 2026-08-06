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

    const startUpload = (file: File) => {
        const tempId = Math.random().toString(36).slice(2);

        const newFile: FileItem = {
            id: tempId,
            originalName: file.name,
            size: file.size,
            uploadedAt: new Date().toISOString(),
            status: 'pending',
            progress: 0
        };

        setFiles(prev => [newFile, ...prev]);

        const xhr = new XMLHttpRequest();
        const formData = new FormData();
        formData.append('file', file);

        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
                const percent = Math.round((e.loaded / e.total) * 100);
                updateFileStatus(tempId, { status: 'uploading', progress: percent });
            }
        });

        xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                const response = JSON.parse(xhr.responseText);
                updateFileStatus(tempId, {
                    status: 'uploaded',
                    progress: 100,
                    fileName: response.file.fileName
                });
            } else {
                updateFileStatus(tempId, { status: 'error', progress: 0 });
            }
        });

        xhr.addEventListener('error', () => {
            updateFileStatus(tempId, { status: 'error', progress: 0 });
        });

        xhr.open('POST', `/api/upload/${linkId}`);
        xhr.send(formData);
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