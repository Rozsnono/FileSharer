"use client";
import { useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';

export default function UploadZone({ linkId }: { linkId: string }) {
    const [uploading, setUploading] = useState(false);

    const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        await fetch(`/api/upload/${linkId}`, { method: 'POST', body: formData });
        setUploading(false);
        window.location.reload(); // Refresh to show file in DB for downloader
    };

    return (
        <div className="border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center bg-white">
            <input type="file" id="fileInput" className="hidden" onChange={handleFile} />
            <label htmlFor="fileInput" className="cursor-pointer flex flex-col items-center">
                {uploading ? (
                    <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                ) : (
                    <Upload className="w-12 h-12 text-gray-400 mb-4" />
                )}
                <span className="text-lg font-medium text-gray-700">
                    {uploading ? 'Uploading to NAS...' : 'Click to upload a file'}
                </span>
            </label>
        </div>
    );
}