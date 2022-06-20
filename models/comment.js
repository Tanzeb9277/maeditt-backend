
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];


const CommentScheme = new Schema(
    {   user:{type: Schema.Types.ObjectId, ref: 'User', required: true},
        post: {type: Schema.Types.ObjectId, ref: 'Post', required: true},
        date: {type: Date, required: true},
        text: {type: String, required: true },

    },{
        toObject: { virtuals: true },
        toJSON: { virtuals: true }
    });

CommentScheme
.virtual('date_formatted')
.get(function () {

  const month = this.date.getMonth()
  const year = this.date.getFullYear();
  const date = this.date.getDate();
  return months[month] + " "+ date + ", " + year;
});


module.exports = mongoose.model('Comment', CommentScheme);