import fs from "fs";
const t = fs.readFileSync("src/styles/creativeStyleCatalog.ts", "utf8");
const re = /name:\s*"([^"]+)"/g;
const set = new Set();
let m;
while ((m = re.exec(t))) {
  if (m[1] === "string") continue;
  set.add(m[1].split(" (")[0]);
}
console.log([...set].sort().join("\n"));
console.error("count", set.size);
