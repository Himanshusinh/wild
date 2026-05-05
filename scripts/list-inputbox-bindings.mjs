import fs from "fs";
import path from "path";

const p = path.resolve(
  "src/app/view/Generation/ImageGeneration/TextToImage/compo/InputBox.tsx",
);
const lines = fs.readFileSync(p, "utf8").split(/\r?\n/);
const scope = lines.slice(151, 3533).join("\n");
const names = new Set();
const re1 = /\bconst\s+(\w+)\s*=/g;
let m;
while ((m = re1.exec(scope))) names.add(m[1]);
const re2 = /\bconst\s*\[\s*(\w+)\s*,/g;
while ((m = re2.exec(scope))) names.add(m[1]);
const out = path.resolve("inputbox-scope-names.txt");
fs.writeFileSync(out, [...names].sort().join("\n"));
console.log(names.size, "->", out);
