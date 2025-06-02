import { AttachmentBuilder, EmbedBuilder, ChannelType } from 'discord.js';
import Respawn from '../models/Respawn.js';
import { isCavePending } from '../helpers/activeCalls.js';
import fs from 'fs';
import path from 'path';

let statusMessageId = null;
const statusChannelId = process.env.STATUS_CHANNEL_ID;

function getCurrentUserId(current) {
  if (!current || typeof current !== 'object') return null;

  const possibleFields = [
    'userId', 'discordId', 'id', 'uid', 'playerId', 'discord', 'memberId'
  ];

  for (const key of possibleFields) {
    if (typeof current[key] === 'string' && current[key].length > 0) {
      return current[key];
    }
  }

  return null;
}

function formatTempo(restante) {
  const h = String(Math.floor(restante / 60)).padStart(2, '0');
  const m = String(restante % 60).padStart(2, '0');
  return `${h}h:${m}m`;
}

export async function updateRespawnListMessage(client) {
  const channel = await client.channels.fetch(statusChannelId);
  if (!channel || channel.type !== ChannelType.GuildText) return;

  const respawns = await Respawn.find();
  const activeRespawns = respawns.filter(r => r.current || r.queue.length > 0);
  if (activeRespawns.length === 0) return;

  const descriptionLines = [];
  const now = new Date();

  for (const respawn of activeRespawns) {
    const { code, name, current, queue } = respawn;

    const currentId = getCurrentUserId(current);
    let tempo = 'Pending';
    let atual = 'Ninguém';

    if (currentId) {
      atual = `<@${currentId}>`;

      if (current?.startTime && !isCavePending(respawn)) {
        const elapsed = Math.floor((Date.now() - new Date(current.startTime).getTime()) / 60000);
        const restante = 195 - elapsed;
        tempo = restante > 0 ? formatTempo(restante) : '00h:00m';
      }
    }

    let nextText = '';
    const queueAfterCurrent = queue.filter(p => {
      const id = p.userId || p.discordId || p.id;
      return id !== currentId;
    });

    if (queueAfterCurrent.length > 0) {
      const nextId = queueAfterCurrent[0].userId || queueAfterCurrent[0].discordId || queueAfterCurrent[0].id;
      nextText = ` | Next: <@${nextId}>`;
      if (queueAfterCurrent.length > 1) {
        nextText += ` +${queueAfterCurrent.length - 1}`;
      }
    }

    const linha = `\`${tempo} | ${code} ${name} :\` ${atual}${nextText}`;
    descriptionLines.push(linha);
  }

  const embed = new EmbedBuilder()
    .setTitle('Respawn List')
    .setDescription(descriptionLines.join('\n'))
    .setColor(0xe3d510)
    .setTimestamp();

  const imagePath = path.join(process.cwd(), 'lista-caves.png');
  const files = [];
  if (fs.existsSync(imagePath)) {
    const attachment = new AttachmentBuilder(imagePath, { name: 'lista-caves.png' });
    embed.setImage('attachment://lista-caves.png');
    files.push(attachment);
  }

  try {
    if (statusMessageId) {
      const existing = await channel.messages.fetch(statusMessageId).catch(() => null);
      if (existing) {
        await existing.edit({ embeds: [embed], files });
        return;
      }
    }

    const sent = await channel.send({ embeds: [embed], files });
    statusMessageId = sent.id;

  } catch (e) {
    console.error('Erro ao atualizar lista de respawn:', e);
  }
}
