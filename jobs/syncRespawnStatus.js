import Respawn from '../models/Respawn.js';
import { generateCaveImage } from '../utils/generateCaveImage.js';
import fs from 'fs';
import path from 'path';
import { AttachmentBuilder, EmbedBuilder } from 'discord.js';

const statusChannelId = process.env.STATUS_CHANNEL_ID;
const statusFilePath = path.join('data', 'status.json');
let debounceTimeout = null;

function getStatusMessageId() {
  if (!fs.existsSync(statusFilePath)) return null;
  const raw = fs.readFileSync(statusFilePath, 'utf-8');
  try {
    const json = JSON.parse(raw);
    return json.statusMessageId || null;
  } catch {
    return null;
  }
}

function setStatusMessageId(id) {
  const data = { statusMessageId: id };
  if (!fs.existsSync('data')) fs.mkdirSync('data');
  fs.writeFileSync(statusFilePath, JSON.stringify(data, null, 2));
}

export async function syncRespawnStatus(client) {
  if (debounceTimeout) clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(async () => {
    const channel = await client.channels.fetch(statusChannelId).catch(() => null);
    if (!channel || !channel.isTextBased()) return;

    const respawns = await Respawn.find();
    const lines = [];
    const now = new Date();

    for (const r of respawns) {
      const hasQueue = r.queue.length > 0;
      const current = r.current;
      const currentId = current?.discordId;

      let currentDisplay = '...';
      let time = null;

      if (currentId) {
        currentDisplay = `<@${currentId}>`;

        if (current.accepted && current.startTime) {
          const end = new Date(new Date(current.startTime).getTime() + 195 * 60000);
          const diff = Math.max(0, end - now);
          const min = Math.floor(diff / 60000);
          const hrs = String(Math.floor(min / 60)).padStart(2, '0');
          const rem = String(min % 60).padStart(2, '0');
          time = `${hrs}h:${rem}m`;
        } else {
          time = 'Pending';
        }
      }

      if (!time && !hasQueue) continue;

      let nextText = '';
      const queueAfterCurrent = r.queue.filter(p => p.discordId !== currentId);

      if (queueAfterCurrent.length > 0) {
        const nextId = queueAfterCurrent[0].discordId;
        nextText = ` | Next: <@${nextId}>`;
        if (queueAfterCurrent.length > 1) {
          nextText += ` +${queueAfterCurrent.length - 1}`;
        }
      }

      const line = `\`${time || 'Free'} | ${r.code} ${r.name}${currentDisplay !== '...' ? ' :' : ''}\` ${currentDisplay}${nextText}`;
      lines.push({ time: time || 'Free', text: line });
    }

    lines.sort((a, b) => {
      if (a.time === 'Pending' && b.time !== 'Pending') return -1;
      if (b.time === 'Pending' && a.time !== 'Pending') return 1;
      if (a.time === 'Pending' && b.time === 'Pending') return 0;
      if (a.time === 'Free' && b.time !== 'Free') return 1;
      if (b.time === 'Free' && a.time !== 'Free') return -1;

      const getMinutes = (s) => {
        const [h, m] = s.split(/[h:m]+/).filter(Boolean).map(Number);
        return h * 60 + m;
      };
      return getMinutes(a.time) - getMinutes(b.time);
    });

    await generateCaveImage();
    const imagePath = path.join('temp', 'lista-caves.png');
    const attachment = fs.existsSync(imagePath)
      ? new AttachmentBuilder(imagePath, { name: 'lista-caves.png' })
      : null;

    const embed = new EmbedBuilder()
      .setTitle('Respawn List')
      .setDescription(
        lines.length > 0
          ? lines.map(line => line.text).join('\n')
          : 'No caves are currently occupied.'
      )
      .setColor(0xe3d510)
      .setTimestamp();

    if (attachment) {
      embed.setImage('attachment://lista-caves.png');
    }

    try {
      const statusMessageId = getStatusMessageId();

      if (statusMessageId) {
        const msg = await channel.messages.fetch(statusMessageId).catch(() => null);
        if (msg) {
          await msg.edit({ embeds: [embed], files: attachment ? [attachment] : [] });
          return;
        }
      }

      const sent = await channel.send({ embeds: [embed], files: attachment ? [attachment] : [] });
      setStatusMessageId(sent.id);

    } catch (e) {
      console.error('Failed to update status message:', e);
    }
  }, 50);
}
