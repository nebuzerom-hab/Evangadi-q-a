const mysql2 = require("mysql2");
const express = require("express");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
 // Adjust this path to point to the .env file
const app = express();

console.log(process.env.DB_NAME);
const dbConnection = mysql2.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});
dbConnection.getConnection((err, connection) => {
  if (err) {
    console.error("Error connecting to the database:", err);
    return;
  }
  console.log("Successfully connected to the database!");
  connection.release();
});

//for table creation

//GET is used to request data from a specified resource.
//
app.get("/install", (req, res) => {
  let createUserTable = `CREATE TABLE IF NOT EXISTS userTable (
    user_id INT(20) AUTO_INCREMENT NOT NULL,
    user_name VARCHAR(255) NOT NULL UNIQUE,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id)
)`;

  let createquestionTable = `CREATE TABLE IF NOT EXISTS questionTable (
    user_id INT(20),
    question_id INT(20) AUTO_INCREMENT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    PRIMARY KEY (question_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES userTable(user_id)
)`;

  let createanswerTable = `CREATE TABLE IF NOT EXISTS answerTable (
    answer_id INT(20) AUTO_INCREMENT NOT NULL,
    user_id INT(20),
    question_id INT(20),
    answer VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (answer_id),
    FOREIGN KEY (question_id) REFERENCES questionTable(question_id),
    FOREIGN KEY (user_id) REFERENCES userTable(user_id)
)`;

  dbConnection.query(createUserTable, (err) => {
    if (err) return res.status(500).send("Error creating UserTable: " + err);

    dbConnection.query(createquestionTable, (err) => {
      if (err)
        return res.status(500).send("Error creating questionTabel: " + err);

      dbConnection.query(createanswerTable, (err) => {
        if (err)
          return res.status(500).send("Error creating answerTable: " + err);

        res.send("All tables created successfully!");
      });
    });
  });
});

//for table creation port number only
app.listen(4000, () =>
  console.log("listening to: http://localhost:4000")
);

module.exports = dbConnection.promise();