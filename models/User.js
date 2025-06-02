import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  discordId: { type: String, required: true, unique: true },
  characters: [String],
  blockedUntil: { type: Date, default: null }
});

const User = mongoose.model('User', userSchema);
export default User;
