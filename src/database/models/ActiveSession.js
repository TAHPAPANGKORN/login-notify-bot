import mongoose from 'mongoose';

const ActiveSessionSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  joinTime: { type: Date, required: true, default: Date.now }
}, { 
  collection: 'active_sessions',
  timestamps: true 
});

export const ActiveSession = mongoose.model('ActiveSession', ActiveSessionSchema);
export default ActiveSession;
