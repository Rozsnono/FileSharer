import { NextResponse } from 'next/server';
import { webdav } from '@/lib/webdav';
import { connectDB } from '@/lib/db';
import { Session } from '@/models/Session';
import { FileRecord } from '@/models/FileRecord';
import fs from 'fs/promises';
import { createReadStream, createWriteStream } from 'fs';
import path from 'path';
import os from 'os';

export async function POST(req: Request, { params }: { params: Promise<{ linkId: string }> }) {
    try {
        const { linkId } = await params;
        const body = await req.json();
        const { uploadId, originalName, size, mimeType, totalChunks } = body;

        if (!uploadId || !originalName || totalChunks === undefined) {
            return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
        }

        await connectDB();
        const session = await Session.findOne({ linkId });
        if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

        const chunkDir = path.join(os.tmpdir(), 'vault-chunks', uploadId);
        const mergedFilePath = path.join(os.tmpdir(), 'vault-chunks', `${uploadId}-merged`);

        // Merge chunks
        const writeStream = createWriteStream(mergedFilePath);
        
        for (let i = 0; i < totalChunks; i++) {
            const chunkPath = path.join(chunkDir, i.toString());
            const data = await fs.readFile(chunkPath);
            writeStream.write(data);
        }
        writeStream.end();

        await new Promise<void>((resolve, reject) => {
            writeStream.on('finish', () => resolve());
            writeStream.on('error', reject);
        });

        // Upload to WebDAV
        const fileName = `${Date.now()}-${originalName}`;
        if (!(await webdav.exists(linkId))) {
            await webdav.createDirectory(linkId);
        }

        const readStream = createReadStream(mergedFilePath);
        await webdav.putFileContents(`${linkId}/${fileName}`, readStream);

        // Cleanup temp files
        await fs.rm(chunkDir, { recursive: true, force: true });
        await fs.rm(mergedFilePath, { force: true });

        // Save to Database
        const newFile = await FileRecord.create({
            sessionId: session._id,
            fileName,
            originalName,
            size,
            mimeType
        });

        return NextResponse.json({
            success: true,
            file: {
                ...newFile.toObject(),
                uploadedAt: newFile.uploadedAt.toISOString()
            }
        });
    } catch (error) {
        console.error("Complete Upload Error:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ error: "Server Error", details: errorMessage, stack: error instanceof Error ? error.stack : undefined }, { status: 500 });
    }
}
