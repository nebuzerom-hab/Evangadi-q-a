

const express = require("express");
const app = express();
const cors = require("cors");
// app.use(cors()); // Enable CORS for all routes
// Configure CORS properly
const corsOptions = {
  origin: "http://localhost:5173", // Your frontend origin
  credentials: true, // Allow credentials
  optionsSuccessStatus: 200, // For legacy browser support
};

app.use(cors(corsOptions));

const port = 7700;

//db connection
const dbConnection = require("./db/dbConfig");

const authMiddleware = require("./middleware/authMiddleware");

//  routes middleware file
const userRoutes = require("./routes/userRoute");
const questionRoute = require("./routes/questionRoutes");
const answerRoutes = require("./routes/answerRoute");

//authentication routes middleware file

// json middleware to extract json data
app.use(express.json());

// user routes middleware
app.use("/api/users", userRoutes);

// post Question middleware
app.use("/api", authMiddleware, questionRoute);

//get single and all question routes middleware
app.use("/api/questions", authMiddleware, questionRoute);

//delete  or edit question  routes middleware
app.use("/api/questions", authMiddleware, questionRoute);

//post answers routes middleware
app.use("/api", authMiddleware, answerRoutes);

// get answers, delete, edit  and rating answers  routes middleware
app.use("/api/answers", authMiddleware, answerRoutes);

//  post answer middleware
app.use("/api", authMiddleware, answerRoutes);

//edit question middleware
// app.use("/edit-question", authMiddleware, questionRoute);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});


async function start() {
  try {
    const result = await dbConnection.execute("select 'test' ");
    app.listen(port);
    console.log("Database connection established");
    console.log(`listening on ${port} `);
  } catch (error) {
    console.log(error.message);
  }
}

start();
