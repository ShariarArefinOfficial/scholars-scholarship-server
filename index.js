const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config()
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const user=process.env.USER
const pass=process.env.PASSWORD


const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${user}:${pass}@cluster0.uctmuu5.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    // Send a ping to confirm a successful connection
    const Database=client.db('ScholarBD')

    //collections
    const scholarshipCollection=Database.collection('scholarship');






    await client.db("admin").command({ ping: 1 });
   // console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
   // await client.close();
  }
}
run().catch(console.dir);






app.get('/', (req, res) => {
    res.send('Scholars Server Start ....')
})

app.listen(port, () => {
    console.log(`Scholars Server is sitting on port ${port}`);
})