const express = require('express');
const fs = require('fs');
const { MongoClient } = require('mongodb')
const app = express();
const db_url = "mongodb://localhost:27017";
const client = new MongoClient(db_url);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const cors = require("cors");
app.use(cors());
let db;
async function connectDB() {
    if (!db) {
        await client.connect();
        db = client.db("SchoolStudents");
        console.log("MongoDB connected");
    }
}
async function getDetails(collectionName, callback) {
    try {
        await connectDB();
        const collection = db.collection(collectionName);
        const Students = await collection.find({}).toArray();
        callback(Students);
    } catch (err) {
        console.log("Error:", err)
    }
}
async function insertRecord(collectionName, data) {
    await connectDB();
    const collection = db.collection(collectionName);
    const result = await collection.insertOne({
        ...data,
        createdAt: new Date()
    });
    return result;
}
async function updateRecord(collectionName, RollNumber,data) {
    try {
        await connectDB();
        const collection = db.collection(collectionName);
        return await collection.updateOne({ RollNumber },
            {
              $set: { ...data, updatedAt: new Date() }  
            });
    } catch (err) {
        console.log("Error:", err)
    }
}
async function deleteRecord(collectionName, RollNumber) {
    try {
        await connectDB();
        const collection = db.collection(collectionName);
        return await collection.deleteOne({ RollNumber });
    } catch (err) {
        console.log("Error:", err)
    }
}

app.get("/Students", (req, res) => {
    getDetails("Students", (data) => {
        res.send(data);
    })
});
app.get("/Teachers", (req, res) => {
    getDetails("Teachers", (data) => {
        res.send(data)
    })
})
app.get("/students/:RollNumber", async (req, res) => {
    try {
        const RollNumber = req.params.RollNumber;
        await connectDB();
        const collection = db.collection("Students");
        const student = await collection.findOne({ RollNumber })
        if (!student) {
            console.log("Error id didnt Found : ", RollNumber)
            res.send({
                status: "failed",
                code: 103,
                msg: "Student not found"
            })
        }
        else {
            res.send({
                data: student
            })
        }
    } catch (err) {
        console.log("Error:", err);
    }
});
app.post("/createStudent", async (req, res) => {
    const { RollNumber, firstName, lastName, DoB } = req.body;
    if (!RollNumber || !firstName || !lastName || !DoB) {
        return res.send({
            status: 404,
            message: 'All fields are required'
        });
    }
    const Students = {
        RollNumber,
        firstName,
        lastName,
        DoB
    };
    await insertRecord('Students', Students);
    return res.send({
        message: 'Student created successfully',
        code: 200,
        data: Students
    });
});

app.put("/updateStudent/:RollNumber", async (req, res) => {
    const { RollNumber } = req.params;
    const { firstName, lastName, DoB } = req.body;

    if (!firstName && !lastName && !DoB) {
        return res.send({
            code: 400,
            message: "At least one field is required to update"
        });
    }

    const updateData = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (DoB) updateData.DoB = DoB;

    const result = await updateRecord("Students", RollNumber, updateData);

    if (result.matchedCount === 0) {
        return res.send({
            code: 404,
            message: "Student not found"
        });
    }

    res.send({
        code: 200,
        message: "Student updated successfully"
    });
});
app.delete("/deleteStudent/:RollNumber", async (req, res) => {
    try {
        const RollNumber = req.params.RollNumber;
        const result = await deleteRecord("Students", RollNumber);
        if (result.deletedCount === 0) {
            return res.send({
                status: "failed",
                code: 404,
                msg: "Student not found"
            });
        }
        return res.send({
            status: "success",
            code: 200,
            msg: "Student successfully deleted"
        });
    } catch (err) {
        console.log("Error:", err);
        res.send({
            status: "error",
            code: 500,
            msg: "Internal server error"
        });
    }
});
app.listen(3000, () => {
    console.log("Server Successfully Started on port 3000");
});
