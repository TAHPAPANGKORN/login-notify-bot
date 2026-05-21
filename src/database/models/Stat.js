import mongoose from 'mongoose';

const UserStatSchema = new mongoose.Schema({
  username: { type: String, required: true },
  totalDurationMs: { type: Number, required: true, default: 0 }
}, { _id: false });

const StatSchema = new mongoose.Schema({
  date: { type: String, required: true, unique: true },
  users: {
    type: Map,
    of: UserStatSchema
  }
}, { 
  collection: 'voice_session_stats',
  timestamps: true // Senior Dev tip: adding standard timestamps (createdAt, updatedAt) helps tracking
});

export const Stat = mongoose.model('Stat', StatSchema);
export default Stat;
