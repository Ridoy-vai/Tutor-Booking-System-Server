const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { createRemoteJWKSet, jwtVerify } = require('jose-cjs');

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 2000;
const clientUri = process.env.CLIENT_URI;
const mongoUri = process.env.MONGODB_URI;

const corsOptions = clientUri
    ? {
        origin: [clientUri],
        credentials: true,
    }
    : {};

app.use(cors(corsOptions));
app.use(express.json());

if (!mongoUri) {
    throw new Error('MONGODB_URI is missing');
}

let client;
let clientPromise;

function getMongoClient() {
    if (!client) {
        client = new MongoClient(mongoUri, {
            serverApi: {
                version: ServerApiVersion.v1,
                strict: true,
                deprecationErrors: true,
            },
        });
    }

    if (!clientPromise) {
        clientPromise = client.connect();
    }

    return clientPromise;
}

const jwks = clientUri
    ? createRemoteJWKSet(new URL(`${clientUri}/api/auth/jwks`))
    : null;

const verifyJWT = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).send({ message: 'unauthorized access' });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).send({ message: 'unauthorized access' });
    }

    if (!jwks) {
        return res.status(500).send({ message: 'CLIENT_URI is not configured' });
    }

    try {
        const { payload } = await jwtVerify(token, jwks);
        req.user = payload;
        next();
    } catch (error) {
        console.error('JWT verification error:', error);
        return res.status(403).send({ message: 'forbidden access' });
    }
};

async function getCollections() {
    const mongoClient = await getMongoClient();
    const db = mongoClient.db('Tutor-Booking-System');

    return {
        usersCollection: db.collection('users'),
        tutorsCollection: db.collection('tutors'),
        bookingsCollection: db.collection('bookings'),
    };
}

app.post('/tutors', async (req, res) => {
    const { tutorsCollection } = await getCollections();
    const tutors = req.body;
    const result = await tutorsCollection.insertOne(tutors);
    res.send(result);
});

app.get('/tutors', async (req, res) => {
    try {
        const { tutorsCollection } = await getCollections();
        const { name, startDate, endDate } = req.query;
        const query = {};

        if (name) {
            query.fullName = { $regex: name, $options: 'i' };
        }

        if (startDate || endDate) {
            query.startDate = {};

            if (startDate) {
                query.startDate.$gte = startDate;
            }

            if (endDate) {
                query.startDate.$lte = endDate;
            }
        }

        const result = await tutorsCollection.find(query).toArray();
        res.send(result);
    } catch (error) {
        console.error('Filter Error:', error);
        res.status(500).send({ message: 'server error' });
    }
});

app.get('/Featurstutors', async (req, res) => {
    const { tutorsCollection } = await getCollections();
    const result = await tutorsCollection.find().limit(6).toArray();
    res.send(result);
});

app.get('/tutors/:id', async (req, res) => {
    const { tutorsCollection } = await getCollections();
    const { id } = req.params;
    const result = await tutorsCollection.findOne({ _id: new ObjectId(id) });
    res.send(result);
});

app.patch('/tutors/:id', async (req, res) => {
    const { tutorsCollection } = await getCollections();
    const { id } = req.params;
    const updatedData = req.body;
    const result = await tutorsCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updatedData }
    );
    res.send(result);
});

app.get('/mytutors/:userId', async (req, res) => {
    const { tutorsCollection } = await getCollections();
    const { userId } = req.params;
    const result = await tutorsCollection.find({ userId }).toArray();
    res.send(result);
});

app.get('/tutors/:userId/:_id', async (req, res) => {
    const { tutorsCollection } = await getCollections();
    const { userId, _id } = req.params;
    const result = await tutorsCollection.find({ userId, _id: new ObjectId(_id) }).toArray();
    res.send(result);
});

app.patch('/tutors/:userId/:_id', async (req, res) => {
    const { tutorsCollection } = await getCollections();
    const { userId, _id } = req.params;
    const updatedData = req.body;
    const result = await tutorsCollection.updateOne(
        { userId, _id: new ObjectId(_id) },
        { $set: updatedData }
    );
    res.send(result);
});

app.delete('/tutors/:userId/:_id', async (req, res) => {
    const { tutorsCollection } = await getCollections();
    const { userId, _id } = req.params;
    const result = await tutorsCollection.deleteOne({ userId, _id: new ObjectId(_id) });
    res.send(result);
});

app.post('/bookings', async (req, res) => {
    const { bookingsCollection } = await getCollections();
    const bookings = req.body;
    const result = await bookingsCollection.insertOne(bookings);
    res.send(result);
});

app.get('/bookings', async (req, res) => {
    const { bookingsCollection } = await getCollections();
    const result = await bookingsCollection.find().toArray();
    res.send(result);
});

app.get('/bookings/:userId', async (req, res) => {
    const { bookingsCollection } = await getCollections();
    const { userId } = req.params;
    const result = await bookingsCollection.find({ userId }).toArray();
    res.send(result);
});

app.get('/bookings/:userId/:id', async (req, res) => {
    const { bookingsCollection } = await getCollections();
    const { userId, id } = req.params;
    const result = await bookingsCollection.find({ userId, _id: new ObjectId(id) }).toArray();
    res.send(result);
});

app.patch('/bookings/:userId/:id', async (req, res) => {
    const { bookingsCollection } = await getCollections();
    const { userId, id } = req.params;
    const updateBookingData = req.body;
    const result = await bookingsCollection.updateOne(
        { userId, _id: new ObjectId(id) },
        { $set: updateBookingData }
    );
    res.send(result);
});

app.get('/', async (req, res) => {
    try {
        const mongoClient = await getMongoClient();
        await mongoClient.db('admin').command({ ping: 1 });

        res.send('server is running Tutor Booking System');
    } catch (error) {
        console.error('Mongo ping failed:', error);
        res.status(500).send({ message: 'database connection failed' });
    }
});

if (process.env.VERCEL !== '1') {
    app.listen(port, () => {
        console.log(`server is running on ${port}`);
    });
}

module.exports = app;
