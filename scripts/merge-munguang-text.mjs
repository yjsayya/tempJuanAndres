#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(__dirname, "../public/textos");
const parts = ["munguang-p1.txt", "munguang-p2.txt", "munguang-p3.txt", "munguang-p4.txt"];
const out = path.join(dir, "munguang-full.txt");

let raw = "";
for (const f of parts) {
  const p = path.join(dir, f);
  if (!fs.existsSync(p)) {
    console.error("Falta:", p);
    process.exit(1);
  }
  raw += fs.readFileSync(p, "utf8") + "\n\n";
}

function clean(t) {
  let s = t.replace(/\r\n/g, "\n");
  s = s.replace(/\n\d+\s*MUNGUANG\s*\n/gi, "\n");
  s = s.replace(/\nTEORÍA DEL HUMANISMO\s+\d+\s*\n/gi, "\n");
  s = s.replace(/\n\d{3}\s*MUNGUANG\s*\n/gi, "\n");
  s = s.replace(/([a-záéíóúüñ])-\s*\n\s*([a-záéíóúüñ])/gi, "$1$2");
  s = s.replace(/\n{3,}/g, "\n\n");
  return s.trim();
}

fs.writeFileSync(out, clean(raw), "utf8");
console.log("Escrito:", out, "bytes:", fs.statSync(out).size);
