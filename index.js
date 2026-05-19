const express = require('express');
const app = express()
const dotenv = require('dotenv')
dotenv.config()
const cors = require('cors')

app.use(cors())
app.use(express.json())

const port = 1000


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = "mongodb+srv://Tutor-Booking-System:GhKfxMBOqGVfAgi2@cluster0.mfro67j.mongodb.net/?appName=Cluster0"

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const db = client.db('Tutor-Booking-System')
        const usersCollection = db.collection('users')
        const tutorsCollection = db.collection('tutors')
        const bookingsCollection = db.collection('bookings')

        // add server side api
        app.post('/tutors', async (req, res) => {
            const tutors = req.body
            const result = await tutorsCollection.insertOne(tutors)
            res.send(result)
        })

        // get all tutors
        app.get('/tutors', async (req, res) => {
            const result = await tutorsCollection.find().toArray()
            res.send(result)
        })

        app.patch('/tutors/:id', async (req, res) => {
            const { id } = req.params
            const updatedData = req.body
            const result = await tutorsCollection.updateOne({ _id: new ObjectId(id) }, { $set: updatedData })
            res.send(result)
        })
        app.get('/tutors/:userId', async (req, res) => {
            const { userId } = req.params
            console.log(userId)
            const result = await tutorsCollection.find({ userId }).toArray()
            res.send(result)
        })

        //my tutor details page api user id and tutor id both are required to get the tutor data
        app.get('/tutors/:userId/:_id', async (req, res) => {
            const { userId, _id } = req.params
            console.log(userId, _id)
            const result = await tutorsCollection.find({ userId, _id: new ObjectId(_id) }).toArray()
            res.send(result)
        })

        //my tutor update api user id and tutor id both are required to update the tutor data
        app.patch('/tutors/:userId/:_id', async (req, res) => {
            const { userId, _id } = req.params
            const updatedData = req.body
            const result = await tutorsCollection.updateOne({ userId, _id: new ObjectId(_id) }, { $set: updatedData })
            res.send(result)
        })

        //-------------

        // get single tutor details page
        app.get('/tutors/:_id', async (req, res) => {
            const { _id } = req.params
            const result = await tutorsCollection.findOne({ _id: new ObjectId(_id) })
            res.send(result)
        })

        // add user booking data to database
        app.post('/bookings', async (req, res) => {
            const bookings = req.body
            const result = await bookingsCollection.insertOne(bookings)
            res.send(result)
        })

        // get all bookings of a user id based
        app.get('/bookings/:userId', async (req, res) => {
            const { userId } = req.params
            const result = await bookingsCollection.find({ userId }).toArray()
            res.send(result)
        })



















        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('server is running Tutor Booking System')
})

app.listen(port, () => {
    console.log(`surver is running on ${port}`)
})
