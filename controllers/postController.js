const Post = require('../models/post');
const { body, check, validationResult} = require('express-validator');
const async = require('async');
const User = require('../models/user');
const Comment = require('../models/comment');

exports.post_list = function(req, res, next) {

    Post.find()
      .sort({date : -1})
      .populate('user','username')
      .exec(function (err, list_posts) {
        if (err) { return next(err); }
        //Successful, so render
        res.json({ posts_list: list_posts });
      });
  
  };


exports.like_post = [
    (req, res, next) => {
        async.parallel({
            add_like_to_post: function(callback) {
                Post.updateOne({ _id: req.params.postId }, {$inc : {likes : 1}})
                .exec(callback)
            },
            add_post_to_liked: function(callback) {
                User.updateOne({ _id: req.params.currentUserId }, {$push: {liked_posts: req.params.postId,}})
                .exec(callback)
            }
        }, function(err, results) {
            if (err) { return next(err); } // Error in API usage.
            // Successful, so render.
            res.json({post:req.params.postId, user: req.params.currentUserId})
        });
    }
]

exports.unlike_post = [
    (req, res, next) => {
        async.parallel({
            add_like_to_post: function(callback) {
                Post.updateOne({ _id: req.params.postId }, {$inc : {likes : -1}})
                .exec(callback)
            },
            add_post_to_liked: function(callback) {
                User.updateOne({ _id: req.params.currentUserId }, {$pull: {liked_posts: req.params.postId,}})
                .exec(callback)
            }
        }, function(err, results) {
            if (err) { return next(err); } // Error in API usage.
            // Successful, so render.
            res.json({post:req.params.postId, user: req.params.currentUserId})
        });
    }
]


exports.posts_create_post = [
  

    // Validate and sanitize fields.
    body('title', 'Message must not be empty.').isString(),
    body('text', 'Message must not be empty.').optional({ checkFalsy: true }).isString(),
    body('img', 'Image url must not be empty').optional({ checkFalsy: true }).isString(),


    // Process request after validation and sanitization.
    (req, res, next) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values/errors messages.
            return res.status(400).json({ errors: errors.array()  });
        }else{
            const post = new Post({
                user: req.params.currentUserId,
                title: req.body.title,
                date: new Date(),
                text: req.body.text,
                img: req.body.img,
              }).save((err, newPost) => {
                if (err) { 
                  return next(err);
                }
                async.parallel({
                  post_user: function(callback) {
                    User.findById(newPost.user)
                    .exec(callback)
                  },
              }, function(err, results) {
                  if (err) { return next(err); } // Error in API usage.
                  if (results.post_user==null) { // No results.
                      var err = new Error('User not found');
                      err.status = 404;
                      return res.status(404).json({ errors: err });
                  }
                  // Successful, so render.
                  res.json({postUser: results.post_user, post: newPost});
              });
              });

        }
        
    }
];