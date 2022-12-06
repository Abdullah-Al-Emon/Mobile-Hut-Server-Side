const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');

const port = process.env.PORT || 5000;
const app = express();

//middleware
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.dqljuns.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next)
{
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send('unauthorized access')
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded)
    {
        if (err) {
            return res.status(403).send({ message: 'forbidden access' })
        }
        req.decoded = decoded;
        next()
    })
}

async function run()
{
    try {
        const categoryCollection = client.db('mobileHut').collection('category')
        const productsCollection = client.db('mobileHut').collection('products')
        const usersCollection = client.db('mobileHut').collection('users')
        const advertiseCollection = client.db('mobileHut').collection('advertise')
        const bookingsCollection = client.db('mobileHut').collection('bookings')

        app.get('/category', async (req, res) =>
        {
            const query = {};
            const categories = await categoryCollection.find(query).toArray()
            res.send(categories)
        })

        app.get('/category/:id', async (req, res) =>
        {
            const id = req.params.id;
            const query = { categoryId: id };
            const product = await productsCollection.find(query).toArray();
            res.send(product)
        })


        app.get('/product', async (req, res) =>
        {
            const email = req.query.email;
            const query = { sellerEmail: email }
            const user = await productsCollection.find(query).toArray();
            res.send(user)
        })

        app.get('/pro', async (req, res) =>
        {
            const query = {
                advertise: true, 
                paid: false
            }
            // console.log("",query)
            const advertise = await productsCollection.find(query).toArray();
            res.send(advertise)
        })

        app.post('/product', async (req, res) =>
        {
            const user = req.body;
            const result = await productsCollection.insertOne(user);
            res.send(result)
        })

        app.put('/product/:id', async (req, res) =>
        {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    advertise: true,
                    paid: false
                }
            }
            const result = await productsCollection.updateOne(filter, updateDoc, options)
            res.send(result)
        })

        app.delete('/product/:id', async (req, res) =>
        {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await productsCollection.deleteOne(query);
            res.send(result)
        })

        app.post('/booking', async (req, res) =>
        {
            const user = req.body;
            const result = await bookingsCollection.insertOne(user);
            res.send(result)
        })

        app.get('/booking', async (req, res) =>
        {
            const email = req.query.email;
            const query = { buyerEmail: email }
            const user = await bookingsCollection.find(query).toArray();
            res.send(user)
        })

        app.get("/bookings", async(req, res) => {
            const email = req.query.email;
            const query = {sellerEmail: email}
            console.log("a",query)
            const user = await bookingsCollection.find(query).toArray();
            res.send(user)
        })

        app.post('/advertise', async (req, res) =>
        {
            const advertise = req.body;
            const result = await advertiseCollection.insertOne(advertise);
            res.send(result)
        })

        app.post('/users', async (req, res) =>
        {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.send(result)
        })

        app.delete('/users/:id', async (req, res) =>
        {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await usersCollection.deleteOne(query);
            res.send(result)
        })

        app.put('/users/:id', async (req, res) =>
        {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    role: 'verify'
                }
            }
            const result = await usersCollection.updateOne(filter, updateDoc, options)
            res.send(result)
        })

        app.get('/users', async (req, res) =>
        {
            const buyer = req.query.buyer;
            const seller = req.query.seller;
            const sellerQuery = { user: seller }
            const allSeller = await usersCollection.find(sellerQuery).toArray();
            const buyerQuery = { user: buyer }
            const allBuyer = await usersCollection.find(buyerQuery).toArray();
            res.send({ allBuyer, allSeller })
        })

        // app.get('/users', async (req, res) => {
        //     const query = {};
        //     const users = await usersCollection.find(query).toArray();
        //     res.send(users)
        // })

        app.get('/users/admin/:email', async (req, res) =>
        {
            const email = req.params.email;
            const query = { email }
            const users = await usersCollection.findOne(query);
            res.send({ isAdmin: users?.user === 'Admin' })
        })

        app.get('/users/seller/:email', async (req, res) =>
        {
            const email = req.params.email;
            const query = { email }
            const users = await usersCollection.findOne(query);
            res.send({ isSeller: users?.user === 'Seller' })
        })

        app.get('/users/buyer/:email', async (req, res) =>
        {
            const email = req.params.email;
            const query = { email }
            const users = await usersCollection.findOne(query);
            res.send({ isBuyer: users?.user === 'Buyer' })
        })


        app.get('/jwt', async (req, res) =>
        {
            const email = req.query.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '1d' })
                return res.send({ accessToken: token })
            }
            res.status(403).send({ accessToken: '' })
        })

    }
    finally {

    }
}

run().catch(err => console.log(err))

app.get('/', async (req, res) =>
{
    res.send('Mobile hut server is running')
})

app.listen(port, () => console.log(`Mobile hut running on ${port}`))