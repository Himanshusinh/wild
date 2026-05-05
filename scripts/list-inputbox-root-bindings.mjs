import fs from "fs";
import path from "path";

const p = path.resolve(
  "src/app/view/Generation/ImageGeneration/TextToImage/compo/InputBox.tsx",
);
const lines = fs.readFileSync(p, "utf8").split(/\r?\n/);
const scope = lines.slice(151, 3533).join("\n");
const names = new Set();
const re = /^  const (\w+)\s*=/gm;
let m;
while ((m = re.exec(scope))) names.add(m[1]);
const re2 = /^  const \[(\w+)\s*,/gm;
while ((m = re2.exec(scope))) names.add(m[1]);
const out = path.resolve("inputbox-root-bindings.txt");
fs.writeFileSync(out, [...names].sort().join("\n"));
console.log(names.size, "->", out);
