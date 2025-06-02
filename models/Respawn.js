import mongoose from 'mongoose';

const respawnSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  current: {
    discordId: { type: String },
    characters: [String],
    accepted: { type: Boolean, default: false },
    startTime: { type: Date }
  },
  queue: [
    {
      discordId: String,
      characters: [String],
      joinedAt: { type: Date, default: Date.now }
    }
  ],
  history: [
    {
      discordId: String,
      characters: [String],
      startTime: Date,
      endTime: Date
    }
  ],
  createdAt: { type: Date, default: Date.now }
});

const Respawn = mongoose.model('Respawn', respawnSchema);
export default Respawn;
