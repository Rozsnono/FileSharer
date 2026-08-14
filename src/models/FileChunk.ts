import { Schema, model, models } from 'mongoose';

const FileChunkSchema = new Schema({
    uploadId: { type: String, required: true, index: true },
    chunkIndex: { type: Number, required: true },
    data: { type: Buffer, required: true },
    createdAt: { type: Date, default: Date.now, expires: 86400 } // Auto-delete after 24 hours if orphaned
});

export const FileChunk = models.FileChunk || model('FileChunk', FileChunkSchema);
