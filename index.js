const express = require("express");
const app = express();
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const user = process.env.USER;
const pass = process.env.PASSWORD;

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${user}:${pass}@cluster0.uctmuu5.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    const Database = client.db("ScholarBD");

    //collections
    const scholarshipCollection = Database.collection("scholarship");
    const userCollection = Database.collection("users");
    const applicationCollection = Database.collection("applications");
    const reviewsCollection=Database.collection("reviews");

    //JWt Api
    // jwt related api
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res.send({ token });
    });

    // middlewares
    const verifyToken = (req, res, next) => {
      console.log("inside verify token", req.headers.authorization);
      if (!req.headers.authorization) {
        return res.status(401).send({ message: "unauthorized access" });
      }
      const token = req.headers.authorization.split(" ")[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: "unauthorized access" });
        }
        req.decoded = decoded;
        next();
      });
    };





      //  // Middleware to verify moderator
      //  const verifyModerator = async (req, res, next) => {
      //   const email = req.decoded.email;
      //   const query = { email };
      //   const user = await userCollection.findOne(query);
      //   const isModerator = user?.role === "moderator";
      //   if (!isModerator) {
      //     return res.status(403).send({ message: "Forbidden access" });
      //   }
      //   next();
      // };





   //=================Reviews
   app.get("/reviews", async (req, res) => {
    const email = req.query.email;
    let query = {};
    if (email) {
      query = { email: email };
    }
    const result = await reviewsCollection.find(query).toArray();
    res.send(result);
  });

  app.post("/reviews", async (req, res) => {
    const reviewItem = req.body;
    const result = await reviewsCollection.insertOne(reviewItem);
    res.send(result);
  });
















    // use verify admin after verifyToken
    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      const isAdmin = user?.role === "admin";
      if (!isAdmin) {
        return res.status(403).send({ message: "forbidden access" });
      }
      next();
    };

    // users related api
    app.get("/users", verifyToken, verifyAdmin, async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });

    app.get("/users/admin/:email", verifyToken, async (req, res) => {
      const email = req.params.email;

      if (email !== req.decoded.email) {
        return res.status(403).send({ message: "forbidden access" });
      }

      const query = { email: email };
      const user = await userCollection.findOne(query);
      let admin = false;
      if (user) {
        admin = user?.role === "admin";
      }
      res.send({ admin });
    });

    app.post("/users", async (req, res) => {
      const user = req.body;
      // insert email if user doesnt exists:
      // you can do this many ways (1. email unique, 2. upsert 3. simple checking)
      const query = { email: user.email };
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: "user already exists", insertedId: null });
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    app.patch(
      "/users/admin/:id",
      verifyToken,
      verifyAdmin,
      async (req, res) => {
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) };
        const updatedDoc = {
          $set: {
            role: "admin",
          },
        };
        const result = await userCollection.updateOne(filter, updatedDoc);
        res.send(result);
      }
    );

    app.delete("/users/:id", verifyToken, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await userCollection.deleteOne(query);
      res.send(result);
    });

    //application api

    app.get("/applications", async (req, res) => {
      const email = req.query.email;
      let query = {};
      if (email) {
        query = { email: email };
      }
      const result = await applicationCollection.find(query).toArray();
      res.send(result);
    });

    app.post("/applications", async (req, res) => {
      const applicationItem = req.body;
      const result = await applicationCollection.insertOne(applicationItem);
      res.send(result);
    });


    app.delete("/applications/:id",async (req, res) => {
      const id = req.params.id;
      console.log(id)
      const query = { _id: new ObjectId(id) };
       const result = await applicationCollection.deleteOne(query);
       res.send(result);
    }
  );

    //====Scholarship APi
    app.get("/scholarship", async (req, res) => {
      const page = parseInt(req.query._page);
      const limit = parseInt(req.query._limit);
      console.log(page, limit);
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
          results: result,
        });
      } catch (error) {
        console.error(error);
        res
          .status(500)
          .json({ success: false, message: "Internal Server Error" });
      }
    });

    app.get("/scholarships/:search", async (req, res) => {
      try {
        const search = req.params.search;
        let searchQuery = {};

        // If there's a search term, construct the search query
        if (search) {
          searchQuery = {
            $or: [
              { scholarship_category: { $regex: search, $options: "i" } },
              { university_name: { $regex: search, $options: "i" } },
              { degree_name: { $regex: search, $options: "i" } },
            ],
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
        res
          .status(500)
          .json({ success: false, message: "Internal Server Error" });
      }
    });

    app.patch("/scholarship/:id", async (req, res) => {
      const item = req.body;
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      console.log(item);
      const updatedDoc = {
        $set: {
          university_name: item.university_name,
          scholarship_category: item.scholarship_category,
          university_location: {
            city: item.university_location.city,
            country: item.university_location.country,
          },
          scholarship_description: item.scholarship_description,
          application_fees: item.application_fees,
          subject_name: item.subject_name,
          degree_name: item.degree_name,
          stipend: item.stipend,
          service_charge: item.service_charge,
          application_deadline: item.application_deadline,
          post_date: item.post_date,
          university_image: item.university_image,
        },
      };

      const result = await scholarshipCollection.updateOne(filter, updatedDoc)
      res.send(result);
    });

    app.get("/scholarship/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await scholarshipCollection.findOne(query);
      res.send(result);
    });
    app.post("/scholarship", verifyToken, verifyAdmin, async (req, res) => {
      const item = req.body;
      const result = await scholarshipCollection.insertOne(item);
      res.send(result);
    });
    app.delete("/scholarship/:id",verifyToken,verifyAdmin,async (req, res) => {
        const id = req.params.id;
        console.log(id)
        const query = { _id: new ObjectId(id) };
         const result = await scholarshipCollection.deleteOne(query);
         res.send(result);
      }
    );

 

    // Update user role to moderator
    app.patch(
      "/users/moderator/:id",
      verifyToken,
      verifyAdmin,
      async (req, res) => {
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) };
        const updatedDoc = { $set: { role: "moderator" } };
        const result = await userCollection.updateOne(filter, updatedDoc);
        res.send(result);
      }
    );

    await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Scholars Server Start ....");
});

app.listen(port, () => {
  console.log(`Scholars Server is sitting on port ${port}`);
});
