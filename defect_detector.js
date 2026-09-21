"use strict";

const fs = require("node:fs");
const zlib = require("node:zlib");

const filePath = process.argv[2];
if (!filePath) {
  console.log("Укажите путь к PNG-файлу. Например: node defect_detector.js ok.png");
  process.exit(1);
}

const png = fs.readFileSync(filePath);
const signature = "89504e470d0a1a0a";
if (png.subarray(0, 8).toString("hex") !== signature) {
  throw new Error("Поддерживаются только PNG-файлы.");
}

let offset = 8;
let width;
let height;
let colorType;
const compressedParts = [];
while (offset < png.length) {
  const length = png.readUInt32BE(offset);
  const type = png.subarray(offset + 4, offset + 8).toString("ascii");
  const data = png.subarray(offset + 8, offset + 8 + length);
  if (type === "IHDR") {
    width = data.readUInt32BE(0);
    height = data.readUInt32BE(4);
    if (data[8] !== 8 || ![2, 6].includes(data[9]) || data[12] !== 0) {
      throw new Error("Нужен обычный PNG: RGB или RGBA, 8 бит, без чересстрочной развёртки.");
    }
    colorType = data[9];
  }
  if (type === "IDAT") compressedParts.push(data);
  offset += 12 + length;
}

const channels = colorType === 6 ? 4 : 3;
const rowSize = width * channels;
const raw = zlib.inflateSync(Buffer.concat(compressedParts));
const pixels = Buffer.alloc(rowSize * height);
let inputOffset = 0;

for (let y = 0; y < height; y += 1) {
  const filter = raw[inputOffset++];
  const rowStart = y * rowSize;
  for (let x = 0; x < rowSize; x += 1) {
    const current = raw[inputOffset++];
    const left = x >= channels ? pixels[rowStart + x - channels] : 0;
    const above = y > 0 ? pixels[rowStart - rowSize + x] : 0;
    const upperLeft = y > 0 && x >= channels ? pixels[rowStart - rowSize + x - channels] : 0;
    let value = current;
    if (filter === 1) value += left;
    if (filter === 2) value += above;
    if (filter === 3) value += Math.floor((left + above) / 2);
    if (filter === 4) {
      const p = left + above - upperLeft;
      const pa = Math.abs(p - left);
      const pb = Math.abs(p - above);
      const pc = Math.abs(p - upperLeft);
      value += pa <= pb && pa <= pc ? left : pb <= pc ? above : upperLeft;
    }
    pixels[rowStart + x] = value & 255;
  }
}

let redPixels = 0;
for (let i = 0; i < pixels.length; i += channels) {
  const [red, green, blue] = [pixels[i], pixels[i + 1], pixels[i + 2]];
  if (red > 160 && red > green * 1.4 && red > blue * 1.4) redPixels += 1;
}

const redShare = redPixels / (width * height);
console.log(redShare > 0.3 ? "DEFECT" : "OK");
