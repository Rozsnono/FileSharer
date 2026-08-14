import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

export async function POST(req: Request, { params }: { params: Promise<{ linkId: string }> }) {
    try {
        const formData = await req.formData();
        const uploadId = formData.get('uploadId') as string;
        const chunkIndex = formData.get('chunkIndex') as string;
        const chunk = formData.get('chunk') as Blob;

        if (!uploadId || !chunkIndex || !chunk) {
            return NextResponse.json({ error: "Missing chunk parameters" }, { status: 400 });
        }

        const chunkDir = path.join(os.tmpdir(), 'vault-chunks', uploadId);
        
        // Ensure directory exists (in case it was deleted or init was skipped)
        await fs.mkdir(chunkDir, { recursive: true });

        const chunkPath = path.join(chunkDir, chunkIndex);
        const buffer = Buffer.from(await chunk.arrayBuffer());
        
        await fs.writeFile(chunkPath, buffer);

        return NextResponse.json({ success: true, chunkIndex });
    } catch (error) {
        console.error("Chunk Upload Error:", error);
        return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
}
