const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    image: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    preparationTime: {
      type: Number,
      required: true,
      min: 0,
    },
    calories: {
      type: Number,
      min: 0,
    },
    ingredients: [{
      type: String,
      trim: true,
    }],
    allergens: [{
      type: String,
      trim: true,
    }],
  },
  {
    timestamps: true,
  }
);

// Add methods to the schema
menuItemSchema.methods = {
  toJSON() {
    const menuItem = this.toObject();
    delete menuItem.__v;
    return menuItem;
  }
};

// Add static methods to the schema
menuItemSchema.statics = {
  async findByIdAndDelete(id) {
    return this.findOneAndDelete({ _id: id });
  },
  async deleteOne(query) {
    return this.deleteOne(query);
  }
};

const MenuItem = mongoose.model('MenuItem', menuItemSchema);

module.exports = MenuItem; 