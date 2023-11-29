const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config()
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());


const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.pxdxtq4.mongodb.net/?retryWrites=true&w=majority`;

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
        // await client.connect();
        const userCollection = client.db("Dream-Asset-Hub").collection("users");
        const assetCollection = client.db("Dream-Asset-Hub").collection("assets");
        const requestCollection = client.db("Dream-Asset-Hub").collection("requests");



        // Users related API
        app.post('/users', async (req, res) => {
            const user = req.body;

            const query = { email: user.email }
            const existingUser = await userCollection.findOne(query);
            if (existingUser) {
                return res.send({ message: 'user already exists', insertedId: null })
            }
            const result = await userCollection.insertOne(user);
            res.send(result);
        });

        app.get('/users', async (req, res) => {
            try {
                const role = req.query.role;
                const name = req.query.name;
                const companyName = req.query.companyName

                // Build the query based on role and name
                const query = {};

                if (role) {
                    query.role = role;
                }

                if (name) {
                    query.name = name;
                }
                if (companyName) {
                    query.companyName = companyName;
                }

                const result = await userCollection.find(query).toArray();
                res.send(result);
            } catch (error) {
                console.error('Error fetching users:', error);
                res.status(500).send('Internal Server Error');
            }
        });


        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await userCollection.findOne(query);
            res.send(user)

        })

        





        app.patch('/users/:email', async (req, res) => {
            const email = req.params.email;
            const filter = { email: email };

            const options = { upsert: true };
            const updatedUser = req.body;
            const user = {
                $set: {

                    name: updatedUser.name,
                    birthDay: updatedUser.birthDay,
                    companyName:updatedUser.companyName,
                    role:updatedUser.role,


                }
            }

            const result = await userCollection.updateOne(filter, user, options)
            res.send(result)
        })

        

        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await userCollection.findOne(query);
            let admin = false;
            if (user) {
                admin = user?.role === 'admin';
            }
            res.send({ admin });
        })


        //   asseet related api

        app.post('/assets', async (req, res) => {
            const item = req.body;
            const result = await assetCollection.insertOne(item);
            res.send(result);
        });

        app.get('/assets', async (req, res) => {
            const result = await assetCollection.find().toArray();
            res.send(result);
        });

        //   request related api
        app.get('/requests', async (req, res) => {
            const result = await requestCollection.find().toArray();
            res.send(result);
        });

        app.get('/requests/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await requestCollection.findOne(query);
            res.send(result);
        })


        app.post('/requests', async (req, res) => {
            const item = req.body;
            const result = await requestCollection.insertOne(item);
            res.send(result);
        });











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
    res.send('dream asset is sitting')
})

app.listen(port, () => {
    console.log(`dream-asset is running on port ${port}`);
})