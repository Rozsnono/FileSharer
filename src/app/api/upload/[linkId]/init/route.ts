import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Session } from '@/models/Session';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

export async function POST(req: Request, { params }: { params: Promise<{ linkId: string }> }) {
    try {
        const { linkId } = await params;
        const body = await req.json();
        const { originalName } = body;

        if (!originalName) return NextResponse.json({ error: "Missing originalName" }, { status: 400 });

        await connectDB();
        const session = await Session.findOne({ linkId });
        if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

        const uploadId = Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
        const chunkDir = path.join(os.tmpdir(), 'vault-chunks', uploadId);

        // Create the directory for chunks
        await fs.mkdir(chunkDir, { recursive: true });

        return NextResponse.json({ success: true, uploadId });
    } catch (error) {
        console.error("Init Error:", error);
        return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
}
