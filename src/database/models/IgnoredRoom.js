import mongoose from 'mongoose';

const IgnoredRoomSchema = new mongoose.Schema({
  roomName: { type: String, required: true, unique: true }
}, {
  collection: 'ignored_rooms',
  timestamps: true
});

export const IgnoredRoom = mongoose.model('IgnoredRoom', IgnoredRoomSchema);
export default IgnoredRoom;
