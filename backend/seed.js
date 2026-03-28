const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const User = require("./models/User.model");
const Student = require("./models/Student.model");
const Subject = require("./models/Subject.model");

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");

    // Clear existing data
    await User.deleteMany({});
    await Student.deleteMany({});
    await Subject.deleteMany({});
    console.log("Cleared existing data");

    // Create admin
    const admin = await User.create({
      username: "admin",
      email: "admin@buksu.edu.ph",
      password: "admin123",
      role: "admin",
    });
    console.log("Admin created: admin@buksu.edu.ph / admin123");

    // Create sample subjects
    const subjects = await Subject.insertMany([
      { subjectCode: "MATH101", subjectName: "College Algebra", units: 3, type: "Lecture", course: "BSCS", yearLevel: 1, semester: "1st Semester" },
      { subjectCode: "ENG101", subjectName: "Communication Skills 1", units: 3, type: "Lecture", course: "BSCS", yearLevel: 1, semester: "1st Semester" },
      { subjectCode: "CS101", subjectName: "Introduction to Computing", units: 3, type: "Lecture/Laboratory", course: "BSCS", yearLevel: 1, semester: "1st Semester" },
      { subjectCode: "PE101", subjectName: "Physical Education 1", units: 2, type: "Lecture", course: "BSCS", yearLevel: 1, semester: "1st Semester" },
      { subjectCode: "NSTP101", subjectName: "NSTP 1", units: 3, type: "Lecture", course: "BSCS", yearLevel: 1, semester: "1st Semester" },
      { subjectCode: "CS201", subjectName: "Programming 1", units: 3, type: "Lecture/Laboratory", course: "BSCS", yearLevel: 1, semester: "2nd Semester" },
      { subjectCode: "CS202", subjectName: "Data Structures", units: 3, type: "Lecture/Laboratory", course: "BSCS", yearLevel: 2, semester: "1st Semester" },
      { subjectCode: "CS301", subjectName: "Database Management", units: 3, type: "Lecture/Laboratory", course: "BSCS", yearLevel: 2, semester: "2nd Semester" },
    ]);
    console.log(`${subjects.length} subjects created`);

    // Create sample students
    const student1 = await Student.create({
      studentNumber: "2024-00001",
      firstName: "Maria",
      lastName: "Santos",
      middleName: "Cruz",
      email: "maria.santos@student.buksu.edu.ph",
      contactNumber: "09123456789",
      course: "BSCS",
      yearLevel: 1,
      section: "A",
      gender: "Female",
      status: "Active",
    });

    const student2 = await Student.create({
      studentNumber: "2024-00002",
      firstName: "Juan",
      lastName: "dela Cruz",
      email: "juan.delacruz@student.buksu.edu.ph",
      contactNumber: "09987654321",
      course: "BSCS",
      yearLevel: 1,
      section: "A",
      gender: "Male",
      status: "Active",
    });

    // Create student user accounts
    const studentUser1 = await User.create({
      username: "maria.santos",
      email: "maria.santos@student.buksu.edu.ph",
      password: "student123",
      role: "student",
      studentId: student1._id,
    });
    await Student.findByIdAndUpdate(student1._id, { userId: studentUser1._id });

    const studentUser2 = await User.create({
      username: "juan.delacruz",
      email: "juan.delacruz@student.buksu.edu.ph",
      password: "student123",
      role: "student",
      studentId: student2._id,
    });
    await Student.findByIdAndUpdate(student2._id, { userId: studentUser2._id });

    console.log("Sample students created");
    console.log("  Student 1: maria.santos@student.buksu.edu.ph / student123");
    console.log("  Student 2: juan.delacruz@student.buksu.edu.ph / student123");
    console.log("\nSeeding complete!");
    process.exit(0);
  } catch (err) {
    console.error("Seed error:", err);
    process.exit(1);
  }
};

seed();
