const express = require("express");
const config = require("./config");
const path = require("path");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const mongoose = require("mongoose");
const cors = require('cors');
const bodyParser = require('body-parser');
const helmet = require('helmet');




const mongoDb = config.DB_URL;
mongoose.connect(mongoDb, { useUnifiedTopology: true, useNewUrlParser: true });
const db = mongoose.connection;
db.on("error", console.error.bind(console, "mongo connection error"));



const app = express();
app.use(helmet());

app.set("views", __dirname);
app.set("view engine", "ejs");
app.use(cors());
app.use(bodyParser.json());



app.use(session({ secret: "cats", resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.urlencoded({ extended: false }));

app.use("/",  (req, res) => {
    res.json({ name: "frodo" });
  });


module.exports = app;