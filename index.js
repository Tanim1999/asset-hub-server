const express = require('express');
const app = express();
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
require('dotenv').config()
const port = process.env.PORT || 5000;

// middleware
app.use(
    cors()
    // origin: ['http://localhost:5174/','https://656882dffe8d9529935ee5c4--spectacular-baklava-de8204.netlify.app/'],
    // credentials: true,`

);
app.use(express.json());


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
        const paymentCollection = client.db("Dream-Asset-Hub").collection("payments");



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
                    companyName: updatedUser.companyName,
                    role: updatedUser.role,
                    photoURL: updatedUser.photoURL,
                    package: updatedUser.package,
                    companyLogo: updatedUser.companyLogo


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
            try {
                const filter = req.query;
                const productType = req.query.productType
                const availability = req.query.availability
                const companyName = req.query.companyName

                const query = {}

                if (req.query.search) {
                    query.productNAme = { "$regex": filter.search, "$options": "i" }
                }
                if (productType) {
                    query.productType = productType;
                }
                if (availability) {
                    query.availability = availability
                }

                if (companyName) {
                    query.companyName = companyName
                }

                const cursor = assetCollection.find(query);
                const result = await cursor.toArray();
                res.send(result);
            } catch (error) {
                console.error('Error fetching assets:', error);
                res.status(500).send('Internal Server Error');
            }
        });

        app.get('/assets/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await assetCollection.findOne(query);
            res.send(result);
        })

        app.patch('/assets/:id', async (req, res) => {
            const item = req.body;
            const id = req.params.id;
            const options = { upsert: true };
            const filter = { _id: new ObjectId(id) }
            const operation = req.query.operation;
            const updatedDoc = {
                $set: {
                    productNAme: item.productNAme,
                    productType: item.productType,


                },
                

            }
            if (operation) {
                let quantityUpdate;

                if (operation === 'increment') {
                    quantityUpdate = 1;
                } else if (operation === 'decrement') {
                    quantityUpdate = -1;
                } else {
                    return res.status(400).json({ message: 'Invalid operation. Use "increment" or "decrement".' });
                }
                updatedDoc.$inc = {
                    quantity: quantityUpdate,
                };

            }
            
            if (item.quantity!==undefined) {
                updatedDoc.$set.quantity = item.quantity;
              }

            const result = await assetCollection.updateOne(filter, updatedDoc, options)
            res.send(result);
        })


        app.delete('/assets/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await assetCollection.deleteOne(query);
            res.send(result);
        })






        //   request related api
        app.get('/requests', async (req, res) => {
            try {
                const filter = req.query;
                const emailOfRequester = req.query.emailOfRequester

                const companyName = req.query.companyName
                const status = req.query.status
                const requestType = req.query.requestType
                const assetType = req.query.assetType
                const assetId = req.query.assetId
                const query = {}

                if (req.query.search) {
                    query.nameOfRequester = { "$regex": filter.search, "$options": "i" }

                }
                if (emailOfRequester) {
                    query.emailOfRequester = emailOfRequester
                }


                if (companyName) {
                    query.companyName = companyName
                }
                if (status) {
                    query.status = status
                }
                if (requestType) {
                    query.requestType = requestType
                }
                if (assetType) {
                    query.assetType = assetType
                }
                if (assetId) {
                    query.assetId = assetId
                }

                const cursor = requestCollection.find(query);
                const result = await cursor.toArray();
                res.send(result);
            } catch (error) {
                console.error('Error fetching assets:', error);
                res.status(500).send('Internal Server Error');
            }
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
            console.log(result)
        });
        app.patch('/requests/:id', async (req, res) => {
            const item = req.body;
            const id = req.params.id;
            const options = { upsert: true };
            const filter = { _id: new ObjectId(id) }
            const updatedDoc = {
                $set: {
                    status: item.status,
                    actionDate: item.actionDate,
                    quantity: item.quantity


                }
            }


            const result = await requestCollection.updateOne(filter, updatedDoc, options)
            res.send(result);
        })


        app.patch('/requests/:id', async (req, res) => {
            const item = req.body;
            const id = req.params.id;
            const options = { upsert: true };
            const filter = { _id: new ObjectId(id) }
            const updatedDoc = {
                $set: {
                    status: item.status,
                    actionDate: item.actionDate,
                    quantity: item.quantity


                }
            }


            const result = await requestCollection.updateOne(filter, updatedDoc, options)
            res.send(result);
        })

        app.delete('/requests/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await requestCollection.deleteOne(query);
            res.send(result);
        })


        // payment
        app.post('/create-payment-intent', async (req, res) => {
            const { price } = req.body;
            const amount = parseInt(price * 100);
            console.log(amount, 'amount inside the intent')

            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: 'usd',
                payment_method_types: ['card']
            });

            res.send({
                clientSecret: paymentIntent.client_secret
            })
        });


        app.post('/payments', async (req, res) => {
            const payment = req.body;
            const paymentResult = await paymentCollection.insertOne(payment);


            console.log('payment info', payment);






            res.send(paymentResult);
        })

        app.get('/payments', async (req, res) => {
            const companyName = req.query.companyName

            const query = {}
            if (companyName) {
                query.companyName = companyName
            }

            const cursor = paymentCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
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
    res.send('dream asset is sitting')
})

app.listen(port, () => {
    console.log(`dream-asset is running on port ${port}`);
})