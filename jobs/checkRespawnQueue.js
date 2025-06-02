import Respawn from '../models/Respawn.js';
import { activeCalls, resolveActiveCall } from '../helpers/activeCalls.js';

export async function checkRespawnQueue(client) {
  const respawns = await Respawn.find({ current: null, queue: { $exists: true, $ne: [] } });

  for (const cave of respawns) {
    if (activeCalls.has(cave.code)) continue;

    try {
      await resolveActiveCall(cave.code, client);
    } catch (err) {
      console.error(`❌ Failed to call next player for cave ${cave.code}:`, err);
    }
  }
}
