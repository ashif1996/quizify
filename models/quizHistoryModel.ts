import mongoose, { Document, Model, Schema, ObjectId } from "mongoose";

// Define the interface for the QuizHistory document
export interface QuizHistoryDocument extends Document {
    _id: ObjectId;
    userId: mongoose.Types.ObjectId;
    quizId: string;
    score: number;
    completedAt: Date;
}

const quizHistorySchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    quizId: {
        type: String,
        required: true,
    },
    score: {
        type: Number,
        required: true,
    },
    completedAt: {
        type: Date,
        default: Date.now,
    },
});

quizHistorySchema.index({ userId: 1 });
quizHistorySchema.index({ completedAt: -1 });

const QuizHistory: Model<QuizHistoryDocument> = mongoose.model<QuizHistoryDocument>("QuizHistory", quizHistorySchema);

export default QuizHistory;