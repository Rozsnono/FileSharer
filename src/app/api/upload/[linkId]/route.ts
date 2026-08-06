import { NextResponse } from 'next/server';
import { webdav } from '@/lib/webdav';
import { connectDB } from '@/lib/db';
import { Session } from '@/models/Session';
import { FileRecord } from '@/models/FileRecord';

export async function POST(req: Request, { params }: { params: Promise<{ linkId: string }> }) {
    try {
        const { linkId } = await params; // Next.js 15 requirement
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

        await connectDB();
        const session = await Session.findOne({ linkId });
        if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

        const fileName = `${Date.now()}-${file.name}`;

        // 1. WebDAV Upload
        if (!(await webdav.exists(linkId))) {
            await webdav.createDirectory(linkId);
        }
        const buffer = Buffer.from(await file.arrayBuffer());
        await webdav.putFileContents(`${linkId}/${fileName}`, buffer);

        // 2. Database Record
        const newFile = await FileRecord.create({
            sessionId: session._id,
            fileName,
            originalName: file.name,
            size: file.size,
            mimeType: file.type
        });

        return NextResponse.json({
            success: true,
            file: {
                ...newFile.toObject(),
                uploadedAt: newFile.uploadedAt.toISOString()
            }
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
}