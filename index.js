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


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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


    //====Scholarship APi
app.get('/scholarship', async (req, res) => {
      const page = parseInt(req.query._page) || 1;
      const limit = parseInt(req.query._limit) || ITEMS_PER_PAGE;
      console.log(page,limit)
      const skip = (page - 1) * limit;
      console.log("Page:", page, "Limit:", limit, "Skip:", skip);
      try {
        const cursor = scholarshipCollection.find();
        const result = await cursor.skip(skip).limit(limit).toArray();
        const totalItems = await scholarshipCollection.countDocuments();

        res.json({
            page,
            limit,
            totalItems,
            totalPages: Math.ceil(totalItems / limit),
            results: result
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }

          
    });

    app.get('/scholarships/:search', async (req, res) => {
      try {
          const search = req.params.search;
          let searchQuery = {};

          // If there's a search term, construct the search query
          if (search) {
              searchQuery = {
                  $or: [
                      { scholarship_category: { $regex: search, $options: 'i' } },
                      { university_name: { $regex: search, $options: 'i' } },
                      { degree_name: { $regex: search, $options: 'i' } }
                  ]
              };
          }

          // Fetch results from the database based on the constructed search query
          const result = await scholarshipCollection.find(searchQuery).toArray();

          // Logging the result for debugging purposes
          //console.log(result);
          return res.send(result);

         

      } catch (error) {
          // Handling any potential errors and sending an appropriate response
          console.error(error);
          res.status(500).json({ success: false, message: 'Internal Server Error' });
      }
  });

  app.get('/scholarship/:id', async (req, res) => {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) }
    const result = await scholarshipCollection.findOne(query);
    res.send(result);
})


 






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


