import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    trim: true
  },
  reviewedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Add compound index to ensure one review per user per course
reviewSchema.index({ user: 1, course: 1 }, { unique: true });

// Static method to get average rating for a course
reviewSchema.statics.getAverageRating = async function(courseId) {
  const obj = await this.aggregate([
    {
      $match: { course: new mongoose.Types.ObjectId(courseId) }
    },
    {
      $group: {
        _id: '$course',
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 }
      }
    }
  ]);

  try {
    if (obj[0]) {
      await mongoose.model('Course').findByIdAndUpdate(courseId, {
        averageRating: parseFloat(obj[0].averageRating.toFixed(1)),
        totalReviews: obj[0].totalReviews
      });
    }
  } catch (err) {
    console.error("Error updating course average rating:", err);
  }
};

// Call getAverageRating after save
reviewSchema.post('save', function() {
  this.constructor.getAverageRating(this.course);
});

// Call getAverageRating after remove/deleteOne
reviewSchema.post(['deleteOne', 'findOneAndDelete'], function(doc) {
  if (doc) {
    doc.constructor.getAverageRating(doc.course);
  }
});

const Review = mongoose.models.Review || mongoose.model('Review', reviewSchema);

export default Review;
