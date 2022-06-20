
const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const validator = require('validator');


const UserSchema = new Schema(
    {
      username: {type: String, required: true, maxLength: 100},
      email: {type:String,
          validate:{
                validator: validator.isEmail,
                message: '{VALUE} is not a valid email',
                isAsync: false
              },
          required: true },
      password: { type: String, required: true },
      confirm_password: { type: String},
      avatar:{type: String},
      liked_posts: [{type: Schema.Types.ObjectId, ref: 'Post'}],
      friends: [{type: Schema.Types.ObjectId, ref: 'User'}],
      friend_requests: [{type: Schema.Types.ObjectId, ref: 'User'}],
    },{
      toObject: { virtuals: true },
      toJSON: { virtuals: true }
  });

UserSchema
.virtual('url')
.get(function () {
  return '/user/' + this._id;
});


module.exports = mongoose.model('User', UserSchema);