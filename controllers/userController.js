const User = require('../models/user');
const bcrypt = require("bcryptjs");
var async = require('async');
const { body, check, validationResult} = require('express-validator');



exports.get_user = function(req, res, next) {

    User.findById(req.params.currentUserId)
    .populate('friends','username')
    .populate('friend_requests','username')
      .exec(function (err, current_user) {
        if (err) { return next(err); }
        //Successful, so render
        res.json({ user: current_user});
      });
}


exports.create_user = [
  

    // Validate and sanitize fields.
    body('username', 'Username must not be empty.').isString(),
    body('email', 'Email must not be empty').isEmail(),
    body('password', 'Password must not be empty').isString(),
    body('confirm_password', 'Must confirm password').isString(),
    body('avatar', 'Need valid image').optional({ checkFalsy: true }).isString(),
    check('password').exists(),
    check(
        'confirm_password',
        'Field must have the same value as the password field',
    )
        .exists()
        .custom((value, { req }) => value === req.body.password),

    // Process request after validation and sanitization.
    (req, res, next) => {
        const errorFormatter = ({ location, msg, param, value, nestedErrors }) => {
            // Build your resulting errors however you want! String, object, whatever - it works!
            return `${location}[${param}]: ${msg}`;
          };
          const result = validationResult(req).formatWith(errorFormatter);

        async.parallel({
            username_exists: function(callback) {
                User.countDocuments({username: req.body.username}, callback); // Pass an empty object as match condition to find all documents of this collection
            },
            email_exists: function(callback) {
                User.countDocuments({email: req.body.email}, callback);
            },
            
        }, function(err, results) {

            if(results.username_exists > 0){
                return res.json({ errors: "Username Taken" })
            }
            if(results.email_exists > 0){
                return res.json({ errors: "Email already being used" })
            }
            if (!result.isEmpty()) {
                // There are errors. Render form again with sanitized values/errors messages.
                return res.json({ errors: result.array() });
    
            }else{
            bcrypt.hash(req.body.password, 10, (err, hashedPassword) => {
                if(err){
                    return next(err)
                }
                const user = new User({
                    username: req.body.username,
                    email: req.body.email,
                    password: hashedPassword,
                    avatar: req.body.avatar
    
                  }).save((err, newUser) => {
                    if (err) { 
                      return next(err);
                    }
                    User.findById(newUser.id)
                    .exec(function (err, user_object) {
                        if (err) { return next(err); }
                        //Successful, so render
                        res.json(user_object)
                    });
                  });
              });
    
            }
        });    
    }
];


exports.friend_request = [

    
    
    (req, res, next) => {
        const userExists = User.find({username: req.params.userId});

        if (!userExists) {
            return res.status(400).json({ error: 'Username does not exist' })
        }else{
            User.updateOne({_id: req.params.userId}, { $push: { friend_requests: req.params.currentUserId }}, function(err, affected, resp) {
                if (err) { return next(err); }

                res.json({sender:req.params.currentUserId, receiver: req.params.userId})
            })

        }

}
]



exports.accept_request = [
    (req, res, next) => {
        async.parallel({
            remove_from_requests: function(callback) {
                User.updateOne({ _id: req.params.currentUserId }, {$pull: {friend_requests: req.params.userId}})
                .exec(callback)
            },
            add_to_current_user_friends_list: function(callback) {
                User.updateOne({ _id: req.params.currentUserId }, {$push: {friends: req.params.userId,}})
                .exec(callback)
            },
            add_to_other_user_friends_list: function(callback) {
                User.updateOne({ _id: req.params.userId }, {$push: {friends: req.params.currentUserId,}})
                .exec(callback)
            }
        }, function(err, results) {
            if (err) { return next(err); } // Error in API usage.
            // Successful, so render.
            res.json({sender:req.params.currentUserId, receiver: req.params.userId})
        });
    }

]

exports.decline_request =[
    (req, res, next) => {
        User.updateOne({_id: req.params.currentUserId}, {$pull: {friend_requests: req.params.userId}}, function(err, affected, resp) {
            if (err) { return next(err); }

            res.json({request_status: "request declined"})
        })
    }
]