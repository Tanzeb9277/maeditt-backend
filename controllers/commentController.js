const { body, check, validationResult} = require('express-validator');
const async = require('async');
const Comment = require('../models/comment');
const Post = require('../models/post');




exports.create_comment = [
  

    // Validate and sanitize fields.
    body('text', 'Message must not be empty.').isString(),


    // Process request after validation and sanitization.
    (req, res, next) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values/errors messages.
            return res.status(400).json({ errors: errors.array()  });
        }else{
            const comment = new Comment({
                post: req.params.postId,
                user: req.params.currentUserId,
                date: new Date(),
                text: req.body.text
              }).save((err, newComment) => {
                if (err) { 
                  return next(err);
                }
                async.parallel({
                  current_post: function(callback) {
                    Post.findById(req.params.postId)
                    .exec(callback)
                  },
                  comments_list: function(callback) {
                    Comment.find({ 'post': req.params.postId })
                    .populate('user','username -_id ')
                    .exec(callback)
                  },
              }, function(err, results) {
                  if (err) { return next(err); } // Error in API usage.
                  if (results.current_post==null) { // No results.
                      var err = new Error('Post not found');
                      err.status = 404;
                      return res.status(404).json({ errors: err });
                  }
                  // Successful, so render.
                  res.json({ post: results.current_post, comments: results.comments_list});
              });
              });

        }
        
    }
];

exports.get_comments  = function(req, res, next) {

  async.parallel({
    comments_list: function(callback) {
      Comment.find({ 'post': req.params.postId })
      .sort({date : -1})
      .populate('user','username -_id ')
      .exec(callback)
    },

}, function(err, results) {
    if (err) { return next(err); }
    // Successful, so render
    res.json({comments: results.comments_list});
});
}

