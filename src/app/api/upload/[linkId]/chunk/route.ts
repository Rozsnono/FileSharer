import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { FileChunk } from '@/models/FileChunk';

export async function POST(req: Request, { params }: { params: Promise<{ linkId: string }> }) {
    try {
        const formData = await req.formData();
        const uploadId = formData.get('uploadId') as string;
        const chunkIndexStr = formData.get('chunkIndex') as string;
        const chunk = formData.get('chunk') as Blob;

        if (!uploadId || !chunkIndexStr || !chunk) {
            return NextResponse.json({ error: "Missing chunk parameters" }, { status: 400 });
        }

        const chunkIndex = parseInt(chunkIndexStr, 10);
        const buffer = Buffer.from(await chunk.arrayBuffer());

        await connectDB();
        await FileChunk.create({
            uploadId,
            chunkIndex,
            data: buffer
        });

        return NextResponse.json({ success: true, chunkIndex });
    } catch (error) {
        console.error("Chunk Upload Error:", error);
        return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
}
