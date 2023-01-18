const express = require("express");
const config = require("./config");
const path = require("path");
const session = require("express-session");
const passport = require("passport");
const bcrypt = require("bcryptjs");
const LocalStrategy = require("passport-local").Strategy;
const mongoose = require("mongoose");
const cors = require('cors');
const bodyParser = require('body-parser');
const helmet = require('helmet');




const mongoDb = process.env.MONGODB_URI || config.DB_URL
mongoose.connect(mongoDb, { useUnifiedTopology: true, useNewUrlParser: true });

const db = mongoose.connection;
db.on("error", console.error.bind(console, "mongo connection error"));

const User = require('./models/user')

const user_controller = require("./controllers/userController");
const post_controller = require('./controllers/postController');
const comment_controller = require('./controllers/commentController')



const app = express();
app.use(helmet());

const corsOpts = {
  origin: '*',

  methods: [
    'GET',
    'POST',
  ],

  allowedHeaders: [
    'Content-Type',
  ],
};

app.use(cors(corsOpts));

app.set("views", __dirname);
app.set("view engine", "ejs");
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
app.use(bodyParser.json());



app.use(session({ secret: "cats", resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.urlencoded({ extended: false }));



app.post('/sign-up', user_controller.create_user);


  app.post('/log-in', function(req, res, next) {
    passport.authenticate('local', function(err, user, info) {
      if (!user) {
        // *** Display message without using flash option
        // re-render the login form with a message
        return res.json({ message: info.message })
      }
      req.logIn(user, function(err) {
      User.find({username: req.body.username})
      .exec(function (err, current_user) {
        if (err) { return next(err); }
        //Successful, so render
        res.json({ user: current_user});
      });
      });
    })(req, res, next);
  });

  app.get('/posts', post_controller.post_list)

  app.get('/:currentUserId', user_controller.get_user)

  app.get('/:postId/comments', comment_controller.get_comments)

  app.post('/:currentUserId/friend-request/:userId', user_controller.friend_request)
  app.post('/:currentUserId/accept-request/:userId', user_controller.accept_request)
  app.post('/:currentUserId/decline-request/:userId', user_controller.decline_request)
  app.post('/:currentUserId/create-post', post_controller.posts_create_post)
  app.post('/:currentUserId/like-post/:postId', post_controller.like_post)
  app.post('/:currentUserId/unlike-post/:postId', post_controller.unlike_post)
  app.post('/:currentUserId/comment/:postId', comment_controller.create_comment)

passport.use(
  new LocalStrategy((username, password, done) => {
    User.findOne({ username: username }, (err, user) => {
      if (err) { 
        return done(err);
      }
      if (!user) {
        return done(null, false, { message: "Incorrect username" });
      }
      bcrypt.compare(password, user.password, (err, res) => {
          if(err){
              return done(err);
          }
          if (res) {
            // passwords match! log user in
            return done(null, user)
          } else {
            // passwords do not match!
            return done(null, false, { message: "Incorrect password" })
          }
        })
      
    });
  })
);



passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});


module.exports = app;
