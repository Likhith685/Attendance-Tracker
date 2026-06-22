import mongoose from "mongoose";

const Schema = mongoose.Schema;

const attendanceRecordSchema = new Schema({
    roomid: {
        type: String,
        required: true,
    },
    date: {
        type: String, // format: YYYY-MM-DD
        required: true,
    },
    records: [
        {
            studentId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Student',
                required: true,
            },
            status: {
                type: String,
                enum: ['Present', 'Absent'],
                required: true,
            }
        }
    ]
});

// Ensure a single classroom cannot have duplicate attendance records for the same date
attendanceRecordSchema.index({ roomid: 1, date: 1 }, { unique: true });

export default mongoose.model("AttendanceRecord", attendanceRecordSchema);
