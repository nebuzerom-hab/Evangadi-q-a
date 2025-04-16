

const express = require("express");
const app = express();
const cors = require("cors");

// Allow requests from your frontend domain
app.use(
  cors({
    origin: "https://evangadiforum.nebiatzportfolio.com",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true, // if you're using cookies/sessions
  })
);

app.options("*", cors());

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
