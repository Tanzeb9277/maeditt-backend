const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];


const PostScheme = new Schema(
    {
        user: {type: Schema.Types.ObjectId, ref: 'User', required: true},
        title: {type: String, required: true },
        date: {type: Date, required: true},
        text: {type: String},
        img: {type: String},
        likes: {type: Number, default: 0}
        

    },{
        toObject: { virtuals: true },
        toJSON: { virtuals: true }
    });

PostScheme
.virtual('url')
.get(function () {
    return '/post/' + this._id;
});

PostScheme
.virtual('date_formatted')
.get(function () {

  const month = this.date.getMonth()
  const year = this.date.getFullYear();
  const date = this.date.getDate();
  return months[month] + " "+ date + ", " + year;
});



module.exports = mongoose.model('Post', PostScheme);