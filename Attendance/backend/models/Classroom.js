import mongoose from "mongoose";

const Schema = mongoose.Schema;

const userSchema = new Schema({
    cname:{
        type: String,        
        required:true,
    },
    ccode:{
        type: String,
        required:true,                
    },
    userid:{
        type:String,
        required:true,
    },
    strength:{
        type:Number,
        required:true,
    },
    days:{
        type:Number,
        required:true,
    },
    checkInActive: {
        type: Boolean,
        default: false
    },
    checkInCode: {
        type: String,
        required: false
    },
    checkInLatitude: {
        type: Number,
        required: false
    },
    checkInLongitude: {
        type: Number,
        required: false
    },
    checkInExpiresAt: {
        type: Date,
        required: false
    }
})

export default mongoose.model("Classroom", userSchema);