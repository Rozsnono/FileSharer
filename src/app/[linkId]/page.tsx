import { connectDB } from '@/lib/db';
import { Session } from '@/models/Session';
import { FileRecord } from '@/models/FileRecord';
import { headers, cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import DashboardClient from '@/components/DashboardClient';

export default async function ManagerPage({ params }: { params: Promise<{ linkId: string }> }) {
    const { linkId } = await params; // Next.js 15 requirement

    await connectDB();
    const session = await Session.findOne({ linkId }).lean();
    if (!session) return notFound();

    const existingFiles = await FileRecord.find({ sessionId: session._id })
        .sort({ uploadedAt: -1 })
        .lean();

    const userIp = (await headers()).get('x-forwarded-for') || '127.0.0.1';
    const ownerCookie = (await cookies()).get('session_owner_id')?.value;
    const isCreator = session.creatorIp === userIp || session.creatorCookieId === ownerCookie;

    const role = (session.mode === 'SENDER')
        ? (isCreator ? 'UPLOADER' : 'DOWNLOADER')
        : (isCreator ? 'DOWNLOADER' : 'UPLOADER');

    const serializedFiles = existingFiles.map((f: any) => ({
        id: f._id.toString(),
        fileName: f.fileName,
        originalName: f.originalName,
        size: f.size,
        uploadedAt: f.uploadedAt.toISOString(),
        status: 'uploaded' as const,
        progress: 100
    }));

    return (
        <DashboardClient
            linkId={linkId}
            initialFiles={serializedFiles}
            role={role}
            expiresAt={session.expiresAt.toISOString()}
        />
    );
}