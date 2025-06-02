import Respawn from '../models/Respawn.js';
import { resolveActiveCall } from '../helpers/activeCalls.js';

export async function checkRespawnTimeout(client) {
  const now = Date.now();
  const caves = await Respawn.find({ 'current.startTime': { $exists: true } });

  for (const cave of caves) {
    if (!cave.current?.startTime) continue;

    const start = new Date(cave.current.startTime).getTime();
    const elapsed = now - start;

    if (elapsed >= 195 * 60 * 1000) {
      const userId = cave.current.discordId;
      const user = await client.users.fetch(userId).catch(() => null);

      cave.history.push({
        discordId: userId,
        characters: cave.current.characters,
        startTime: cave.current.startTime,
        endTime: new Date()
      });

      cave.current = null;
      cave.markModified('current');
      await cave.save();

      if (user) {
        try {
          await user.send(`⏱️ Your 3h15min time in the cave **${cave.name}** has ended. The cave has been released.`);
        } catch (e) {
          console.warn(`⚠️ Could not send DM to ${userId}`);
        }
      }

      await resolveActiveCall(cave.code, client);
    }
  }
}
