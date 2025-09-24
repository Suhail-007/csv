import mongoose from 'mongoose';

const Books = new mongoose.Schema({
  Title: {
    type: String,
    required: false,
  },
  Author: {
    type: String,
    required: false,
  },
  Genre: {
    type: String,
    required: false,
  },
  PublishedYear: {
    type: Number,
    required: false,
  },
  ISBN: {
    type: String,
    required: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Books || mongoose.model('Books', Books);