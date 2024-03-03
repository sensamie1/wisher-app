const mongoose = require('mongoose');

const UserModel = require('./user-model')



const Schema = mongoose.Schema;

const AnniversarySchema = new Schema({
  anniversary_name: {
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

AnniversarySchema.pre('save', async function (next) {
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



const AnniversaryModel = mongoose.model('anniversaries', AnniversarySchema);

module.exports = AnniversaryModel;
