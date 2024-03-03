const mongoose = require('mongoose');

const UserModel = require('./user-model')



const Schema = mongoose.Schema;

const OtherAnniversarySchema = new Schema({
  anniversary_name: {
    type: String, 
    required: true,
  },
  recipient_name: {
    type: String, 
    required: true,
  },
  recipient_email: {
    type: String, 
    required: true,
  },
  user: [{
    type: Schema.Types.ObjectId,
    ref: 'users',
  }],
  next_date: { type: Date, required: true, },
  created_at: { type: Date, default: new Date() },
});

OtherAnniversarySchema.pre('save', async function (next) {
  try {
    const user = await UserModel.findById(this.user);
    if (user) {
      this.user = user;
    }
    next();
  } catch (error) {
    next(error);
  }
});



const OtherAnniversaryModel = mongoose.model('other-anniversaries', OtherAnniversarySchema);

module.exports = OtherAnniversaryModel;
