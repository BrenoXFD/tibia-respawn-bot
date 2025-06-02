import { createCanvas } from 'canvas';
import Respawn from '../models/Respawn.js';
import fs from 'fs';
import path from 'path';

const CITIES = [
  'Thais', 'Carlin', 'Kazordoon', 'Edron', 'Venore',
  'Darashia', 'Ankrahmun', 'Port Hope', 'Liberty Bay', 'Svarground',
  'Yalahar', 'Farmine', 'Gray Island', 'Rathleton', 'Roshamuul',
  'Feyrist', 'Issavi', "Ab'dendriel", 'Marapur', 'Otherworld'
];

export async function generateCaveImage() {
  const caves = await Respawn.find().sort({ code: 1 });

  const grouped = {};
  for (const cave of caves) {
    const match = cave.code.match(/^(\d+)/);
    const cityIndex = match ? Math.floor(Number(match[1]) / 100) : -1;
    const city = CITIES[cityIndex - 1] || 'Desconhecida';
    if (!grouped[city]) grouped[city] = [];
    grouped[city].push(`${cave.code} - ${cave.name}`);
  }

  const LINES_PER_COLUMN = 60;
  const allLines = [];
  for (const city of CITIES) {
    if (!grouped[city]) continue;
    const entries = grouped[city];
    let i = 0;
    while (i < entries.length) {
      const chunkSize = LINES_PER_COLUMN - 1;
      allLines.push(city);
      allLines.push(...entries.slice(i, i + chunkSize));
      i += chunkSize;
    }
  }

  const columns = [];
  for (let i = 0; i < allLines.length; i += LINES_PER_COLUMN) {
    columns.push(allLines.slice(i, i + LINES_PER_COLUMN));
  }

  const canvasWidth = 2020;
  const canvasHeight = 1040;
  const canvas = createCanvas(canvasWidth, canvasHeight);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#303030';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  const colWidth = Math.floor(canvasWidth / 5);
  const lineHeight = 16;
  const padding = 20;

  ctx.font = '12px Arial';

  for (let col = 0; col < columns.length && col < 5; col++) {
    const colLines = columns[col];
    for (let row = 0; row < colLines.length; row++) {
      const text = colLines[row];
      const isCity = CITIES.includes(text);
      ctx.fillStyle = isCity ? '#e3d510' : '#ffffff';
      ctx.font = isCity ? 'bold 14px Arial' : '15px Arial';
      ctx.fillText(text, col * colWidth + padding, (row + 1) * lineHeight);
    }
  }

  const outputPath = path.join('temp', 'lista-caves.png');
  fs.mkdirSync('temp', { recursive: true });
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);

  return outputPath;
}
