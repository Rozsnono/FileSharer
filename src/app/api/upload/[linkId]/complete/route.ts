import { NextResponse } from 'next/server';
import { webdav } from '@/lib/webdav';
import { connectDB } from '@/lib/db';
import { Session } from '@/models/Session';
import { FileRecord } from '@/models/FileRecord';
import { FileChunk } from '@/models/FileChunk';
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

        const chunksDir = path.join(os.tmpdir(), 'vault-chunks');
        await fs.mkdir(chunksDir, { recursive: true });
        const mergedFilePath = path.join(chunksDir, `${uploadId}-merged`);

        // Merge chunks from DB
        const writeStream = createWriteStream(mergedFilePath);
        
        for (let i = 0; i < totalChunks; i++) {
            const chunkDoc = await FileChunk.findOne({ uploadId, chunkIndex: i });
            if (!chunkDoc) {
                throw new Error(`Missing chunk ${i} in database`);
            }
            writeStream.write(chunkDoc.data);
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

        // Cleanup temp file
        await fs.rm(mergedFilePath, { force: true });

        // Cleanup chunks from DB
        await FileChunk.deleteMany({ uploadId });

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
