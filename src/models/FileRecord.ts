import mongoose, { Schema, model, models } from 'mongoose';

const FileRecordSchema = new Schema({
    sessionId: { type: Schema.Types.ObjectId, ref: 'Session', required: true },
    fileName: { type: String, required: true },
    originalName: { type: String, required: true },
    size: { type: Number, required: true },
    mimeType: { type: String },
    // NEW: Status tracking
    status: {
        type: String,
        enum: ['uploading', 'uploaded', 'error'],
        default: 'uploading'
    },
    uploadedAt: { type: Date, default: Date.now }
});

export const FileRecord = models.FileRecord || model('FileRecord', FileRecordSchema);