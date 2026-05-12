/**
 * Regenerates useEditImageInterface.ts, EditImageInterfaceView.tsx, and the thin
 * EditImageInterface.tsx wrapper from a monolithic EditImageInterface copy.
 * Requires the repo version that still has `const EditImageInterface = () => { ... return (...) }`.
 */
import fs from "fs";
import path from "path";

const root = path.resolve(import.meta.dirname, "..");
const ifacePath = path.join(
  root,
  "src/app/view/EditImage/compo/EditImageInterface.tsx",
);

const lines = fs.readFileSync(ifacePath, "utf8").split(/\r?\n/);

const iComp = lines.findIndex((l) => l.includes("const EditImageInterface"));
const iRet = lines.findIndex((l, i) => i > iComp && /^\s*return\s*\(\s*$/.test(l));
const iExport = lines.findIndex((l) =>
  l.includes("export default EditImageInterface"),
);
if (iComp < 0 || iRet < 0 || iExport < 0) {
  throw new Error(`markers ${iComp} ${iRet} ${iExport}`);
}

const chunk = lines.slice(0, iExport);
const iEndFn = chunk.lastIndexOf("};");
if (iEndFn < iRet) throw new Error("end fn");

/** Everything before `const EditImageInterface` — preserves multi-line imports. */
const importLines = lines.slice(0, iComp);

const hookBodyLines = lines.slice(iComp + 1, iRet).filter((l) => {
  const t = l.trim();
  return t !== "// ... (existing state)";
});

function collectHookBindings(srcLines) {
  const names = new Set();
  for (const line of srcLines) {
    let m = line.match(/^  const \[(\w+),\s*(set\w+)\]/);
    if (m) {
      names.add(m[1]);
      names.add(m[2]);
      continue;
    }
    // Includes `const name: Type =` (annotation before `=`)
    m = line.match(/^  const (\w+)/);
    if (m && !line.trimStart().startsWith("const [")) {
      names.add(m[1]);
      continue;
    }
    m = line.match(/^  function (\w+)/);
    if (m) {
      names.add(m[1]);
      continue;
    }
  }
  return [...names].sort();
}

const bindingNames = collectHookBindings(hookBodyLines);
const returnObj =
  "  return {\n" +
  bindingNames.map((n) => `    ${n},`).join("\n") +
  "\n  };";

const hookSrc =
  ['"use client";', "", ...importLines, "", "export function useEditImageInterface() {", ...hookBodyLines, returnObj, "}", "", "export type EditImageInterfaceVm = ReturnType<typeof useEditImageInterface>;", ""].join("\n");

const jsxLines = lines.slice(iRet + 1, iEndFn - 1);

const viewSrc =
  [
    '"use client";',
    "",
    ...importLines,
    "",
    'import type { EditImageInterfaceVm } from "./useEditImageInterface";',
    "",
    "export function EditImageInterfaceView({",
    "  vm,",
    "}: {",
    "  vm: EditImageInterfaceVm;",
    "}) {",
    "  const {",
    ...bindingNames.map((n) => `    ${n},`),
    "  } = vm;",
    "  return (",
    ...jsxLines,
    "  );",
    "}",
    "",
  ].join("\n");

const ifaceSrc =
  [
    '"use client";',
    "",
    'import type { FC } from "react";',
    'import { useEditImageInterface } from "./useEditImageInterface";',
    'import { EditImageInterfaceView } from "./EditImageInterfaceView";',
    "",
    "const EditImageInterface: FC = () => {",
    "  const vm = useEditImageInterface();",
    "  return <EditImageInterfaceView vm={vm} />;",
    "};",
    "",
    "export default EditImageInterface;",
    "",
  ].join("\n");

const hookOut = path.join(root, "src/app/view/EditImage/compo/useEditImageInterface.ts");
const viewOut = path.join(root, "src/app/view/EditImage/compo/EditImageInterfaceView.tsx");

fs.writeFileSync(hookOut, hookSrc);
fs.writeFileSync(viewOut, viewSrc);
fs.writeFileSync(ifacePath, ifaceSrc);

console.log("split ok", {
  hookLines: hookSrc.split("\n").length,
  viewLines: viewSrc.split("\n").length,
  bindings: bindingNames.length,
});
