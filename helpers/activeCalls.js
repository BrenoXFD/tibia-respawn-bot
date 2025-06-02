import { ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import Respawn from '../models/Respawn.js';
import { syncRespawnStatus } from '../jobs/syncRespawnStatus.js';

export const activeCalls = new Map();

export function isCavePending(code) {
  const call = activeCalls.get(code);
  return call && Date.now() < call.expiresAt;
}

export async function resolveActiveCall(code, client) {
  activeCalls.delete(code);

  const respawn = await Respawn.findOne({ code });
  if (!respawn || respawn.queue.length === 0) return;

  const next = respawn.queue[0];
  const expiresAt = Date.now() + 5 * 60_000;

  const timeoutId = setTimeout(async () => {
    const current = activeCalls.get(code);
    if (!current || current.discordId !== next.discordId) return;

    const updated = await Respawn.findOne({ code });
    if (!updated) return;

    if (updated.current?.discordId === next.discordId && updated.current.accepted) {
      activeCalls.delete(code);
      return;
    }

    const isCurrent = updated.current?.discordId === next.discordId;
    const isFirstInQueue = updated.queue[0]?.discordId === next.discordId;

    if (isCurrent) updated.current = null;
    if (isFirstInQueue) updated.queue.shift();

    await updated.save();
    activeCalls.delete(code);

    try {
      const userToNotify = await client.users.fetch(next.discordId);
      await userToNotify.send(`⏱️ You did not accept the cave **${updated.name}** in time and were removed from the queue.`);
    } catch (err) {
      console.error(`❌ Failed to notify ${next.discordId} about missed respawn:`, err);
    }

    await syncRespawnStatus(client);
    resolveActiveCall(code, client);
  }, 5 * 60_000);

  activeCalls.set(code, {
    discordId: next.discordId,
    expiresAt,
    timeoutId
  });

  try {
    const user = await client.users.fetch(next.discordId);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`respawn_accept_${code}`)
        .setLabel('✅ Accept')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`respawn_reject_${code}`)
        .setLabel('❌ Decline')
        .setStyle(ButtonStyle.Danger)
    );

    await user.send({
      content: `🚨 It's your turn for the cave **${respawn.name}**!\nYou have **5 minutes** to accept or decline.`,
      components: [row]
    });

    respawn.current = {
      discordId: next.discordId,
      characters: next.characters,
      accepted: false,
      startTime: null
    };
    respawn.markModified('current');
    await respawn.save();
    await syncRespawnStatus(client);
  } catch (err) {
    console.error(`❌ Could not send DM to ${next.discordId}:`, err);

    respawn.queue.shift();
    await respawn.save();

    activeCalls.delete(code);
    resolveActiveCall(code, client);
  }
}
