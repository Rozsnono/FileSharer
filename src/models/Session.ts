import mongoose, { Schema, model, models } from 'mongoose';

const SessionSchema = new Schema({
    linkId: { type: String, required: true, unique: true, index: true }, // 50 char hash
    creatorIp: { type: String, required: true },
    creatorCookieId: { type: String, required: true },
    mode: { type: String, enum: ['SENDER', 'RECEIVER'], required: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
});

export const Session = models.Session || model('Session', SessionSchema);