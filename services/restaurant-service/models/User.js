const mongoose = require('mongoose');

// Check if the model is already registered
let User;
try {
  User = mongoose.model('User');
} catch (error) {
  const userSchema = new mongoose.Schema({
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    role: {
      type: String,
      enum: ['customer', 'restaurant', 'admin', 'delivery'],
      required: true
    },
    phone: {
      type: String,
      trim: true
    },
    address: {
      type: String,
      trim: true
    },
    isVerified: {
      type: Boolean,
      default: false
    }
  }, {
    timestamps: true
  });

  User = mongoose.model('User', userSchema);
}

module.exports = User; 