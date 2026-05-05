import fs from "fs";
import path from "path";

const p = path.resolve(
  "src/app/view/Generation/ImageGeneration/TextToImage/compo/InputBox.tsx",
);
const lines = fs.readFileSync(p, "utf8").split(/\r?\n/);
const body = lines.slice(3537, 7799).join("\n");
console.log("body chars", body.length);
const re = /\b([a-zA-Z_$][\w$]*)\b/g;
const kw = new Set([
  "if",
  "else",
  "for",
  "while",
  "return",
  "await",
  "try",
  "catch",
  "finally",
  "const",
  "let",
  "var",
  "new",
  "typeof",
  "instanceof",
  "in",
  "of",
  "true",
  "false",
  "null",
  "undefined",
  "async",
  "function",
  "switch",
  "case",
  "break",
  "continue",
  "throw",
  "class",
  "extends",
  "import",
  "export",
  "from",
  "default",
  "as",
  "void",
  "this",
  "super",
  "do",
  "with",
  "yield",
  "static",
  "enum",
  "interface",
  "type",
  "readonly",
  "keyof",
  "never",
  "any",
  "unknown",
  "string",
  "number",
  "boolean",
  "object",
  "bigint",
  "symbol",
]);
const c = new Map();
let m;
while ((m = re.exec(body))) {
  const w = m[1];
  if (w.length < 2 || kw.has(w)) continue;
  c.set(w, (c.get(w) || 0) + 1);
}
const top = [...c.entries()].sort((a, b) => b[1] - a[1]).slice(0, 100);
console.log(top.map(([w, n]) => `${w}:${n}`).join("\n"));
