import mongoose from 'mongoose';

const IgnoredUserSchema = new mongoose.Schema({
  username: { type: String, required: false },
  userId: { type: String, required: false, unique: true, sparse: true }
}, {
  collection: 'ignored_users',
  timestamps: true
});

export const IgnoredUser = mongoose.model('IgnoredUser', IgnoredUserSchema);
export default IgnoredUser;
