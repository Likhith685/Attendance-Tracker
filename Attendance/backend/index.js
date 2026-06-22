import express from 'express'
import mongoose from 'mongoose';
import User from './models/User.js';
import Classroom from './models/Classroom.js';
import Student from './models/Student.js';
import AttendanceRecord from './models/AttendanceRecord.js';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import dotenv from "dotenv"
import nodemailer from 'nodemailer';
dotenv.config();
const PORT = process.env.PORT || 5000
const app = express();
app.use(cors());
app.use(express.json());

let transporter;

const getTransporter = async () => {
    if (transporter) return transporter;

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
        console.log("Nodemailer configured with SMTP environment credentials.");
    } else {
        try {
            const testAccount = await nodemailer.createTestAccount();
            transporter = nodemailer.createTransport({
                host: "smtp.ethereal.email",
                port: 587,
                secure: false,
                auth: {
                    user: testAccount.user,
                    pass: testAccount.pass
                }
            });
            console.log(`Nodemailer dynamic Ethereal test account created:
User: ${testAccount.user}
Pass: ${testAccount.pass}`);
        } catch (err) {
            console.error("Failed to configure Nodemailer:", err);
        }
    }
    return transporter;
};

const sendAbsenceEmail = async (studentName, roll, courseName, date, recipientEmail) => {
    try {
        const mailTransporter = await getTransporter();
        if (!mailTransporter) return;

        const info = await mailTransporter.sendMail({
            from: '"Attendance Tracker" <no-reply@attendance-tracker.com>',
            to: recipientEmail,
            subject: `Absence Warning: ${courseName} - ${date}`,
            text: `Dear ${studentName} (Roll: ${roll}),\n\nYou were marked ABSENT for the class "${courseName}" on ${date}.\n\nPlease contact your teacher if you believe this is an error.\n\nBest regards,\nAttendance Tracker`,
            html: `
                <div style="font-family: 'Poppins', sans-serif; background-color: #121212; color: #fff; padding: 30px; border-radius: 12px; max-width: 500px; border: 1px solid rgba(229, 9, 20, 0.3);">
                    <h2 style="color: #e50914; margin-top: 0;">Absence Alert</h2>
                    <p style="font-size: 15px; color: #e0e0e0;">Dear <strong>${studentName}</strong> (Roll: ${roll}),</p>
                    <p style="font-size: 14px; color: #b3b3b3; line-height: 1.6;">
                        This is to inform you that you were marked <strong style="color: #ef4444;">ABSENT</strong> for the lecture of <strong>${courseName}</strong> on <strong>${date}</strong>.
                    </p>
                    <div style="background-color: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255,255,255,0.05); padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <span style="font-size: 13px; color: #8c8c8c; display: block;">Course:</span>
                        <strong style="font-size: 15px; color: #fff;">${courseName}</strong>
                        <span style="font-size: 13px; color: #8c8c8c; display: block; margin-top: 8px;">Date:</span>
                        <strong style="font-size: 15px; color: #fff;">${date}</strong>
                    </div>
                    <p style="font-size: 13px; color: #8c8c8c;">
                        Please contact your course instructor if you believe this is an error.
                    </p>
                    <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.1); margin: 20px 0;">
                    <p style="font-size: 12px; color: #666; margin: 0;">
                        This is an automated notification from Attendance Tracker. Please do not reply directly to this email.
                    </p>
                </div>
            `
        });

        console.log(`Email sent to ${recipientEmail} for absence on ${date}. Message ID: ${info.messageId}`);
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
            console.log(`[Ethereal Preview URL]: ${previewUrl}`);
        }
    } catch (err) {
        console.error("Error sending absence email:", err);
    }
};

const triggerEmailForStudent = async (student, courseName, date) => {
    try {
        const user = await User.findOne({ roll: student.roll, role: 'Student' });
        if (user && user.email) {
            await sendAbsenceEmail(student.name, student.roll, courseName, date, user.email);
        } else {
            console.log(`No registered Student user found for roll ${student.roll}. Cannot send email.`);
        }
    } catch (err) {
        console.error("Error triggering email for student:", err);
    }
};

mongoose.set('strictQuery', false);
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
  });

// User

app.get("/users", async (req, res) => {
    let users;
    try{
        users= await User.find();
    }catch(err){
        console.log(err)        
    }
    if(!users){
        return res.status(404).json({message:"Users not found"})
    }
    return res.status(200).json({users})
})

app.get("/user", async (req, res) => {
    jwt.verify(req.headers.token, "secretkey", (err ,dec) => {
        if(err){
            return res.status(401).json({
                message:"Please Login Again"
            })
        }
        User.findOne({_id:dec.userId}, (err, user) =>{
            if(err){
                return res.status(400).json({
                    message:"Please Try Again"
                })
            }
            return res.status(200).json({
                message:"Succ",
                userid:user._id,
                name:user.name,
                email:user.email,
                role:user.role || 'Teacher',
                roll:user.roll,
            })
        })
    })

})

app.post("/register", async (req, res) => {    
        const {name, email, password, role, roll} = req.body;

        if (role === 'Student' && (roll === undefined || isNaN(Number(roll)))) {
            return res.status(400).json({message:"Roll number is required for students"})
        }

        let existinguser;
        try{
            existinguser = await User.findOne({email})
        }catch(err){
            console.log(err)
        }
        if(existinguser){
            return res.status(400).json({message:"Email already in use"})    
        }

        // Check for duplicate roll number (only for Students)
        if (role === 'Student') {
            let existingRoll;
            try {
                existingRoll = await User.findOne({ roll: Number(roll), role: 'Student' });
            } catch(err) {
                console.log(err);
            }
            if (existingRoll) {
                return res.status(400).json({ message: `Roll number ${roll} is already registered by another student` });
            }
        }
        const user = new User({   
            name,    
            email,        
            password,
            role: role || 'Teacher',
            roll: role === 'Student' ? Number(roll) : undefined
        })
        try{
            await user.save();
        }catch(err){
            console.log(err);
            return res.status(500).json({ message: "Registration failed" });
        }
        let token = jwt.sign({ userId: user._id }, "secretkey");
        return res.status(201).json({
            token: token,
            role: user.role,
            roll: user.roll,
            message: "Registration Successful"
        });
});

app.post("/login", async (req, res) => {
    const {email,password} = req.body;

    let existinguser;
    try{
        existinguser = await User.findOne({email})
    }catch(err){
        console.log(err)
    }
    if(!existinguser){
        return res.status(404).json({message:"No User found"})    
    }
    
    if(password != existinguser.password){
        return res.status(404).json({message:"Incorrect Password"})
    }    
    let token = jwt.sign({ userId: existinguser._id }, "secretkey");
    return res.status(200).json({
        token:token,
        role:existinguser.role || 'Teacher',
        roll:existinguser.roll,
        message:"Login Successful"
    })
})

app.post("/register-google", async (req, res) => {
    const { token, role, roll } = req.body;
    if (!token) {
        return res.status(400).json({ message: "Google ID token is required" });
    }

    try {
        const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);
        const googleData = await verifyRes.json();

        if (!verifyRes.ok || googleData.error) {
            return res.status(400).json({ message: "Invalid Google ID token" });
        }

        const { email, name } = googleData;

        let existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "An account with this Google email already exists" });
        }

        if (role === 'Student') {
            if (roll === undefined || isNaN(Number(roll))) {
                return res.status(400).json({ message: "Roll number is required for students" });
            }
            let existingRoll = await User.findOne({ roll: Number(roll), role: 'Student' });
            if (existingRoll) {
                return res.status(400).json({ message: `Roll number ${roll} is already registered by another student` });
            }
        }

        const user = new User({
            name,
            email,
            password: Math.random().toString(36).substring(2, 12), // random password placeholder
            role: role || 'Teacher',
            roll: role === 'Student' ? Number(roll) : undefined
        });

        await user.save();

        let jwtToken = jwt.sign({ userId: user._id }, "secretkey");
        return res.status(201).json({
            token: jwtToken,
            role: user.role,
            roll: user.roll,
            message: "Google Registration Successful"
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed to perform Google registration" });
    }
});

app.post("/login-google", async (req, res) => {
    const { token } = req.body;
    if (!token) {
        return res.status(400).json({ message: "Google ID token is required" });
    }

    try {
        const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);
        const googleData = await verifyRes.json();

        if (!verifyRes.ok || googleData.error) {
            return res.status(400).json({ message: "Invalid Google ID token" });
        }

        const { email } = googleData;

        let user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "No account registered with this Google email. Please register first." });
        }

        let jwtToken = jwt.sign({ userId: user._id }, "secretkey");
        return res.status(200).json({
            token: jwtToken,
            role: user.role,
            roll: user.roll,
            message: "Google Login Successful"
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed to perform Google login" });
    }
});

app.delete("/deluser/:id", async (req, res) => {
    const uid = req.params.id;
    let user;
    try{
        user = await User.findByIdAndDelete(uid);
    }
    catch(err){
        console.log(err)
    }
    if(!user){
        return res.status(404).json({message:"User not found"})
    }
    return res.status(200).json({message:"User deleted"})
})

// Classroom
app.get("/allgetrooms", async (req, res) => {
    let rooms;

    try{
        rooms = await Classroom.find();
    }catch(err){
        console.log(err)
    }    

    if(!rooms){
        return res.status(404).json({message:"No rooms"})
    }    
    return res.status(200).json({rooms})
})

app.get("/getroom/:id", async (req, res) => {
    const id= req.params.id;
    let room;

    try{
        room = await Classroom.findById(id);
    }catch(err){
        console.log(err)
    }
    
    if(!room){
        return res.status(404).json({message:"Room not found"})
    }
    return res.status(200).json({room})

})

app.get("/getrooms/:id", async(req, res) => {
    const userid = req.params.id;
    let rooms;

    try{
        rooms = await Classroom.find({userid:userid})
    }catch(err){
        console.log(err)
    }

    if(rooms.length == 0){
        return res.status(404).json({message:"No Rooms for this User"})
    }
    return res.status(200).json({rooms})
})

app.post("/createroom", async (req, res) => {
    const {cname, ccode, userid, strength, days} = req.body;
    let rooms;
    let user;

    try{
        user = User.findById(userid);
    }catch(err){
        console.log(err);
    }
    if(!user){
        return res.status(404).json({message:"User Not Found"})
    }

    try{
        rooms = await Classroom.find({userid,ccode})
    }catch(err){
        console.log(err)
    }    

    if(rooms.length == 0){
        const room = new Classroom({
            cname,
            ccode,
            userid,
            strength,
            days
        })
        try{
            await room.save();
        }catch(err){
            console.log(err)
        }
        return  res.status(200).json({room})
    }
    return res.status(404).json({message:"Room Already Exists"})    
})

app.put("/editroom", async(req, res) => {    
    const {roomid, cname, ccode, days} = req.body;
    let room;    
    try{
        room = await Classroom.findById(roomid);
    }catch(err){
        console.log(err)
    }
    if(!room){
        return res.status(404).json({message:'Room not found'})
    }
    try{
        room.cname = cname;
        room.ccode = ccode;
        room.days = days;
        await room.save();
    }catch(err){
        console.log(err)
    } 
    return res.status(200).json({message:'Updated successfully'})
})

app.delete("/del/:id", async (req, res) => {
    const id = req.params.id;
    let room;

    try{
        room = await Classroom.findByIdAndDelete({_id:id})
    }catch(err){
        console.log(err)
    }
    if(!room){
        return res.status(404).json({message:"Room Does Not Exist"})
    }
    let students;
    if(room.strength == 0){
        return res.status(200).json({message:"Deleted Successfully"})
    }
    try{
        students = await Student.deleteMany({roomid: room.id})
    }   
    catch(err){
        console.log(err)
    }
    return res.status(200).json({message:"Deleted Successfully"})
})

// STUDENT

app.get("/getstudents/:id", async(req, res) => {
    const id = req.params.id;
    let students;

    try{
        students = await Student.find({roomid:id}).sort({roll:1})
    }catch(err){
        console.log(err)
    }

    if(students.length == 0){
        return res.status(404).json({message:"No Students for this room"})
    }
    return res.status(200).json({students})

}) 

app.post("/createstudent", async (req, res) => {
    const {name, roll, roomid, attendance} = req.body;
    let students;
    let room;

    try{
        room = await Classroom.findById(roomid)
    }catch(err){
        console.log(err)
    }

    if(!room){
        return res.status(404).json({message:"Room not found"})
    }
    let x=room.strength;
    x=x+1;
    try{
        students = await Student.find({roomid, roll});
    }catch(err){
        console.log(err);
    }

    if(students.length == 0){
        const student = new Student({
            name,
            roll,
            roomid,
            attendance,
        })

        try{
            await student.save();
            await room.updateOne({strength:x})
        }catch(err){
            console.log(err);
        }
        return res.status(200).json({student});
    }
    return res.status(500).json({message:`Student ${roll} already exists`});

})

app.post("/createstudents-bulk", async (req, res) => {
    const { roomid, students } = req.body;
    
    if (!roomid || !students || !Array.isArray(students) || students.length === 0) {
        return res.status(400).json({ message: "Invalid payload: roomid and non-empty students array required" });
    }

    let room;
    try {
        room = await Classroom.findById(roomid);
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Database query failed finding classroom" });
    }

    if (!room) {
        return res.status(404).json({ message: "Classroom not found" });
    }

    const rollSet = new Set();
    const invalidStudents = [];
    const payloadDuplicates = [];

    for (let i = 0; i < students.length; i++) {
        const s = students[i];
        if (!s.name || s.roll === undefined || isNaN(Number(s.roll))) {
            invalidStudents.push(s);
            continue;
        }
        const rollNum = Number(s.roll);
        if (rollSet.has(rollNum)) {
            payloadDuplicates.push(rollNum);
        } else {
            rollSet.add(rollNum);
        }
    }

    if (invalidStudents.length > 0) {
        return res.status(400).json({ 
            message: `Some students have invalid/missing name or roll: ${invalidStudents.map(s => s.name || 'Unknown').join(', ')}` 
        });
    }

    if (payloadDuplicates.length > 0) {
        return res.status(400).json({ 
            message: `Duplicate roll numbers in the uploaded list: ${payloadDuplicates.join(', ')}` 
        });
    }

    let existingStudents;
    try {
        existingStudents = await Student.find({ roomid, roll: { $in: Array.from(rollSet) } });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Database query failed checking existing students" });
    }

    if (existingStudents.length > 0) {
        const existingRolls = existingStudents.map(s => s.roll);
        return res.status(400).json({ 
            message: `The following roll numbers already exist in this class: ${existingRolls.join(', ')}` 
        });
    }

    const studentsToInsert = students.map(s => ({
        name: s.name.trim(),
        roll: Number(s.roll),
        roomid,
        attendance: s.attendance !== undefined ? Number(s.attendance) : 0,
        disabled: false
    }));

    try {
        const inserted = await Student.insertMany(studentsToInsert);
        const newStrength = room.strength + inserted.length;
        await room.updateOne({ strength: newStrength });
        return res.status(200).json({ students: inserted, message: `Successfully imported ${inserted.length} students` });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Failed to perform bulk student insert" });
    }
});


app.put("/updatestudent/:id", async (req, res) => {
    const id = req.params.id;
    let student;

    try{
        student = await Student.findById(id);
    }catch(err){
        console.log(err)
    }

    if(!student){
        return res.status(404).json({message:"Student does not exist"})
    }

    try{
        student.attendance=student.attendance+1;
        student.disabled=1;
        await student.save();
    }catch(err){
        console.log(err)
    }    
    return res.status(200).json({student})
})

app.put("/updatestudentabs/:id", async (req, res) => {
    const id = req.params.id;
    let student;

    try{
        student = await Student.findById(id);
    }catch(err){
        console.log(err)
    }

    if(!student){
        return res.status(404).json({message:"Student does not exist"})
    }

    try{
        student.attendance=student.attendance-1;
        student.disabled=0;
        await student.save();
    }catch(err){
        console.log(err)
    }    
    return res.status(200).json({student})
})

app.get("/attendance/:roomid/:date", async (req, res) => {
    const { roomid, date } = req.params;
    let record;
    try {
        record = await AttendanceRecord.findOne({ roomid, date });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Error fetching attendance record" });
    }
    if (!record) {
        return res.status(404).json({ message: "Attendance record not found for this date" });
    }
    return res.status(200).json({ record });
});

app.get("/attendance-dates/:roomid", async (req, res) => {
    const { roomid } = req.params;
    let records;
    try {
        records = await AttendanceRecord.find({ roomid }).sort({ date: -1 });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Error fetching attendance dates" });
    }
    const dates = records.map(rec => {
        const presentCount = rec.records.filter(r => r.status === 'Present').length;
        return {
            date: rec.date,
            presentCount,
            totalCount: rec.records.length
        };
    });
    return res.status(200).json({ dates });
});

app.post("/confirmed/:id", async (req, res) => {
    const id = req.params.id;
    const { binary, date } = req.body;
    
    // Fallback: if no date is provided, default to today's date in local YYYY-MM-DD
    const targetDate = date || new Date().toISOString().substring(0, 10);
    
    let students;
    let room;
    try {
        students = await Student.find({ roomid: id }).sort({ roll: 1 });
        room = await Classroom.findById(id);
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Database query failed" });
    }
    
    if (!room) {
        return res.status(404).json({ message: "Classroom not found" });
    }

    try {
        // Find existing attendance record for this date
        let record = await AttendanceRecord.findOne({ roomid: id, date: targetDate });

        if (record) {
            // Updating existing record
            const oldStatusMap = {};
            record.records.forEach(rec => {
                if (rec.studentId) {
                    oldStatusMap[rec.studentId.toString()] = rec.status;
                }
            });

            const updatedRecords = [];
            
            for (let idx = 0; idx < students.length; idx++) {
                const student = students[idx];
                const studentIdStr = student._id.toString();
                
                const binaryValue = binary[idx]?.value; // 1 for present, 0 for absent
                const newStatus = binaryValue === 1 ? 'Present' : 'Absent';
                const oldStatus = oldStatusMap[studentIdStr] || 'Absent';

                if (oldStatus === 'Absent' && newStatus === 'Present') {
                    student.attendance = (student.attendance || 0) + 1;
                    await student.save();
                } else if (oldStatus === 'Present' && newStatus === 'Absent') {
                    student.attendance = Math.max(0, (student.attendance || 0) - 1);
                    await student.save();
                    triggerEmailForStudent(student, room.cname, targetDate);
                }

                updatedRecords.push({
                    studentId: student._id,
                    status: newStatus
                });
            }

            record.records = updatedRecords;
            await record.save();
        } else {
            // New record for this date
            const newRecords = [];
            
            for (let idx = 0; idx < students.length; idx++) {
                const student = students[idx];
                const binaryValue = binary[idx]?.value; // 1 for present, 0 for absent
                const status = binaryValue === 1 ? 'Present' : 'Absent';

                if (status === 'Present') {
                    student.attendance = (student.attendance || 0) + 1;
                } else {
                    triggerEmailForStudent(student, room.cname, targetDate);
                }
                await student.save();

                newRecords.push({
                    studentId: student._id,
                    status
                });
            }

            const newRecord = new AttendanceRecord({
                roomid: id,
                date: targetDate,
                records: newRecords
            });
            await newRecord.save();

            room.days = (room.days || 0) + 1;
            await room.save();
        }
        
        const updatedStudents = await Student.find({ roomid: id }).sort({ roll: 1 });
        return res.status(200).json({ students: updatedStudents });
        
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Failed to mark attendance" });
    }
});

app.delete("/delstudent/:id", async (req, res) => {
    const id = req.params.id;
    let student;
    let room;

    try{
        student = await Student.findByIdAndDelete(id);
        room = await Classroom.findById(student.roomid)
    }catch(err){
        console.log(err)
    }
    if(!student){
        return res.status(404).json({message:'Student Not Found'})
    }    
    room.strength = room.strength-1;
    await room.save();
    return res.status(200).json({student})
})

app.get("/student/dashboard/:roll", async (req, res) => {
    const roll = Number(req.params.roll);
    if (isNaN(roll)) {
        return res.status(400).json({ message: "Invalid roll number" });
    }

    const token = req.headers.token;
    if (!token) {
        return res.status(401).json({ message: "Access denied: Token is missing" });
    }

    jwt.verify(token, "secretkey", async (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: "Invalid token" });
        }
        
        try {
            const user = await User.findById(decoded.userId);
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }
            
            if (user.role === 'Student' && user.roll !== roll) {
                return res.status(403).json({ message: "Access denied: You can only view your own dashboard" });
            }

            const studentRosters = await Student.find({ roll });
            if (studentRosters.length === 0) {
                return res.status(200).json({ classrooms: [], message: "No classroom enrollments found for this roll number" });
            }

            const dashboardData = [];

            for (let i = 0; i < studentRosters.length; i++) {
                const roster = studentRosters[i];
                const room = await Classroom.findById(roster.roomid);
                if (!room) continue;

                const attendanceRecords = await AttendanceRecord.find({ roomid: roster.roomid });
                
                const logs = [];
                attendanceRecords.forEach(rec => {
                    const studentMatch = rec.records.find(r => r.studentId && r.studentId.toString() === roster._id.toString());
                    if (studentMatch) {
                        logs.push({
                            date: rec.date,
                            status: studentMatch.status
                        });
                    }
                });

                logs.sort((a, b) => new Date(b.date) - new Date(a.date));

                dashboardData.push({
                    roomid: room._id,
                    cname: room.cname,
                    ccode: room.ccode,
                    days: room.days,
                    studentAttendance: roster.attendance || 0,
                    attendancePercentage: room.days > 0 ? ((roster.attendance || 0) / room.days * 100) : 0,
                    checkInActive: room.checkInActive || false,
                    logs
                });
            }

            return res.status(200).json({ classrooms: dashboardData });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ message: "Failed to fetch student dashboard details" });
        }
    });
});

// QR Code / PIN Self Check-In Location Verification Helper
function getDistanceInMeters(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Radius of the earth in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const d = R * c; // Distance in meters
    return d;
}

app.post("/classroom/:id/start-checkin", async (req, res) => {
    const id = req.params.id;
    const { latitude, longitude, duration } = req.body;
    
    let room;
    try {
        room = await Classroom.findById(id);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Database query failed finding classroom" });
    }
    
    if (!room) {
        return res.status(404).json({ message: "Classroom not found" });
    }
    
    const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit PIN
    const mins = duration || 5;
    
    room.checkInActive = true;
    room.checkInCode = code;
    room.checkInLatitude = latitude !== undefined ? Number(latitude) : undefined;
    room.checkInLongitude = longitude !== undefined ? Number(longitude) : undefined;
    room.checkInExpiresAt = new Date(Date.now() + mins * 60 * 1000);
    
    try {
        await room.save();
        return res.status(200).json({ 
            message: "Self check-in session started successfully", 
            code, 
            expiresAt: room.checkInExpiresAt 
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed to start check-in session" });
    }
});

app.post("/classroom/:id/stop-checkin", async (req, res) => {
    const id = req.params.id;
    
    let room;
    try {
        room = await Classroom.findById(id);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Database query failed finding classroom" });
    }
    
    if (!room) {
        return res.status(404).json({ message: "Classroom not found" });
    }
    
    room.checkInActive = false;
    room.checkInCode = undefined;
    room.checkInLatitude = undefined;
    room.checkInLongitude = undefined;
    room.checkInExpiresAt = undefined;
    
    try {
        await room.save();
        return res.status(200).json({ message: "Self check-in session stopped successfully" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed to stop check-in session" });
    }
});

app.post("/student/check-in", async (req, res) => {
    const { roomid, roll, code, latitude, longitude } = req.body;
    
    if (!roomid || roll === undefined || isNaN(Number(roll)) || !code) {
        return res.status(400).json({ message: "Room ID, Roll Number, and PIN/Code are required" });
    }
    
    const token = req.headers.token;
    if (!token) {
        return res.status(401).json({ message: "Access denied: Token is missing" });
    }
    
    jwt.verify(token, "secretkey", async (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: "Invalid token" });
        }
        
        try {
            const user = await User.findById(decoded.userId);
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }
            
            if (user.role !== 'Student' || user.roll !== Number(roll)) {
                return res.status(403).json({ message: "Unauthorized: You can only check in for your own roll number" });
            }
            
            const student = await Student.findOne({ roomid, roll: Number(roll) });
            if (!student) {
                return res.status(404).json({ message: "You are not enrolled in this classroom" });
            }
            
            const room = await Classroom.findById(roomid);
            if (!room) {
                return res.status(404).json({ message: "Classroom not found" });
            }
            
            if (!room.checkInActive) {
                return res.status(400).json({ message: "Self check-in session is not currently active for this class" });
            }
            
            if (room.checkInExpiresAt && new Date() > new Date(room.checkInExpiresAt)) {
                return res.status(400).json({ message: "Self check-in session has expired" });
            }
            
            if (room.checkInCode !== code.toString()) {
                return res.status(400).json({ message: "Incorrect PIN / Code" });
            }
            
            // GPS Location Verification (if teacher enabled location)
            if (room.checkInLatitude !== undefined && room.checkInLongitude !== undefined) {
                if (latitude === undefined || longitude === undefined) {
                    return res.status(400).json({ message: "GPS Location access is required to verify your attendance for this class" });
                }
                
                const distance = getDistanceInMeters(room.checkInLatitude, room.checkInLongitude, Number(latitude), Number(longitude));
                if (distance > 50) {
                    return res.status(400).json({ 
                        message: `Location verification failed: You are too far from the classroom. (Distance: ${Math.round(distance)} meters. Max allowed is 50 meters)` 
                    });
                }
            }
            
            // Check in the student (Mark Present)
            const targetDate = new Date().toISOString().substring(0, 10);
            let record = await AttendanceRecord.findOne({ roomid, date: targetDate });
            
            if (record) {
                const studentMatch = record.records.find(r => r.studentId && r.studentId.toString() === student._id.toString());
                if (studentMatch) {
                    if (studentMatch.status === 'Present') {
                        return res.status(200).json({ message: "You have already checked in successfully for today!", student });
                    } else {
                        studentMatch.status = 'Present';
                        student.attendance = (student.attendance || 0) + 1;
                        await student.save();
                        await record.save();
                    }
                } else {
                    record.records.push({ studentId: student._id, status: 'Present' });
                    student.attendance = (student.attendance || 0) + 1;
                    await student.save();
                    await record.save();
                }
            } else {
                const allStudents = await Student.find({ roomid }).sort({ roll: 1 });
                const records = allStudents.map(s => ({
                    studentId: s._id,
                    status: s.roll === Number(roll) ? 'Present' : 'Absent'
                }));
                
                student.attendance = (student.attendance || 0) + 1;
                await student.save();
                
                const newRecord = new AttendanceRecord({
                    roomid,
                    date: targetDate,
                    records
                });
                await newRecord.save();
                
                room.days = (room.days || 0) + 1;
                await room.save();
            }
            
            return res.status(200).json({ message: "Successfully checked in! Your attendance has been marked as Present.", student });
            
        } catch (err) {
            console.error(err);
            return res.status(500).json({ message: "Failed to process self check-in" });
        }
    });
});


