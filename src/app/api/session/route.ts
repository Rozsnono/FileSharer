import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Session } from '@/models/Session';
import crypto from 'crypto'; // Standard Node library
import { headers, cookies } from 'next/headers';

export async function POST(req: Request) {
    try {
        await connectDB();
        const { mode, expiryHours } = await req.json();

        const linkId = crypto.randomBytes(25).toString('hex');

        const creatorIp = (await headers()).get('x-forwarded-for') || '127.0.0.1';
        const creatorCookieId = crypto.randomUUID();

        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + (expiryHours || 24));

        await Session.create({
            linkId,
            creatorIp,
            creatorCookieId,
            mode,
            expiresAt
        });

        (await cookies()).set('session_owner_id', creatorCookieId, {
            httpOnly: true,
            secure: true,
            expires: expiresAt,
            path: '/'
        });

        return NextResponse.json({ linkId });
    } catch (error) {
        return NextResponse.json({ error: "Creation failed" }, { status: 500 });
    }
}