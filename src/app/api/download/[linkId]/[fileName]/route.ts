import { webdav } from '@/lib/webdav';
import { NextResponse } from 'next/server';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ linkId: string, fileName: string }> }
) {
    const linkId = (await params).linkId;
    const fileName = (await params).fileName;
    const filePath = `${linkId}/${fileName}`;

    if (!(await webdav.exists(filePath))) {
        return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Get stream from WebDAV   
    const stream = webdav.createReadStream(filePath);

    // Return the stream as a response
    return new Response(stream as any, {
        headers: {
            'Content-Disposition': `attachment; filename="${fileName}"`,
            'Content-Type': 'application/octet-stream',
        },
    });
}