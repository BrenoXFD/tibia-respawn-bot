import { syncRespawnStatus } from '../jobs/syncRespawnStatus.js';
import { checkRespawnQueue } from '../jobs/checkRespawnQueue.js';
import { checkRespawnTimeout } from '../jobs/checkRespawnTimeout.js';

export default {
  name: 'ready',
  once: true,
  async execute(client) {
    console.log(`✅ Bot is online as ${client.user.tag}`);

    client.user.setActivity('Respawn Queue', { type: 0 });

    setInterval(() => {
      syncRespawnStatus(client);
      checkRespawnQueue(client);
      checkRespawnTimeout(client);
    }, 60_000);
  }
};
