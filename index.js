require("dotenv").config();
const functions = require("firebase-functions/v2");
const admin = require("firebase-admin");

const express = require("express");
const cors = require("cors");
const { urlencoded, json } = require("body-parser");
const app = express();
const { runBot } = require("./src/botCode");

const serviceAccount = require("./i-am-human.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

app.use(urlencoded({ extended: true }));
app.use(express.json({ extended: true }));
app.use(json());
app.use(cors({ origin: true }));
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb" }));
app.use(function (req, res, next) {
  console.log(req.url);
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "x-access-token, Origin, X-Requested-With, Content-Type, Accept"
  );

  next();
});

app.post("/runbot", async (req, res) => {
  await runBot();
  res.send({ message: "Bot ran successfully" });
});

// const port = process.env.PORT || 3001;

// app.listen(port, () => {
//   console.log("app running on port " + port);
// });
// Create and Deploy Your First Cloud Functions
// https://firebase.google.com/docs/functions/write-firebase-functions

exports.bot = functions.https.onRequest(app);
