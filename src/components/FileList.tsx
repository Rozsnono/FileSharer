"use client";
import { FileText, Download, Clock, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { FileItem } from './DashboardClient';

export default function FileList({ files, linkId }: { files: FileItem[], linkId: string }) {
    if (files.length === 0) {
        return (
            <div className="bg-white rounded-[2rem] p-16 text-center border border-slate-100">
                <FileText className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                <p className="text-slate-400 font-medium">Registry is currently empty</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {files.map((file) => (
                <div key={file.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between gap-4 group relative overflow-hidden">
                    {/* Progress Background Overlay */}
                    {file.status === 'uploading' && (
                        <div
                            className="absolute inset-0 bg-indigo-50/50 transition-all duration-300 z-0"
                            style={{ width: `${file.progress}%` }}
                        />
                    )}

                    <div className="flex items-center gap-4 min-w-0 z-10">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${file.status === 'error' ? 'bg-red-50 text-red-500' :
                                file.status === 'uploaded' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-400'
                            }`}>
                            {file.status === 'uploading' ? <Loader2 className="animate-spin w-5 h-5" /> : <FileText className="w-6 h-6" />}
                        </div>

                        <div className="min-w-0">
                            <h4 className="text-sm font-bold text-slate-800 truncate">{file.originalName}</h4>
                            <div className="flex items-center gap-3 mt-1">
                                <span className="text-[10px] font-black text-slate-400 uppercase">
                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                </span>
                                <span className="text-slate-200">•</span>
                                <StatusBadge status={file.status} progress={file.progress} />
                            </div>
                        </div>
                    </div>

                    <div className="z-10">
                        {file.status === 'uploaded' ? (
                            <a
                                href={`/api/download/${linkId}/${file.fileName}`}
                                className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white hover:bg-indigo-600 transition-all shadow-md"
                                download
                            >
                                <Download className="w-4 h-4" />
                            </a>
                        ) : file.status === 'error' ? (
                            <AlertCircle className="w-6 h-6 text-red-400 mr-2" />
                        ) : null}
                    </div>
                </div>
            ))}
        </div>
    );
}

function StatusBadge({ status, progress }: { status: string, progress: number }) {
    switch (status) {
        case 'uploading':
            return <span className="text-[10px] font-black text-indigo-600 uppercase italic animate-pulse">Uploading {progress}%</span>;
        case 'pending':
            return <span className="text-[10px] font-black text-slate-400 uppercase">Waiting...</span>;
        case 'error':
            return <span className="text-[10px] font-black text-red-500 uppercase">Failed</span>;
        case 'uploaded':
            return (
                <span className="flex items-center gap-1 text-[10px] font-black text-green-500 uppercase">
                    <CheckCircle2 className="w-3 h-3" /> Ready
                </span>
            );
        default:
            return null;
    }
}