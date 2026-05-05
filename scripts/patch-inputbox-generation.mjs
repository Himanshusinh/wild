import fs from "fs";
import path from "path";

const inputPath = path.resolve(
  "src/app/view/Generation/ImageGeneration/TextToImage/compo/InputBox.tsx",
);
const corePath = path.resolve(
  "src/app/view/Generation/ImageGeneration/TextToImage/compo/inputBox/generation/handleGenerateCore.ts",
);

const lines = fs.readFileSync(inputPath, "utf8").split(/\r?\n/);
const core = fs.readFileSync(corePath, "utf8");
const m = core.match(/const \{\s*([\s\S]*?)\s*\} = getRuntime\(\)/);
if (!m) throw new Error("Could not parse destructure from handleGenerateCore");
const keys = m[1]
  .split("\n")
  .map((l) => l.replace(/,/g, "").trim())
  .filter(Boolean)
  .map((l) => l.replace(/^\/\/.*/, "").trim())
  .filter(Boolean);

const runtimeBlock = `  generationRuntimeRef.current = {
${keys.map((k) => `    ${k},`).join("\n")}
  };`;

const insertBlock = `  const handleFalError = useMemo(
    () =>
      createHandleFalError({
        dispatch,
        upsertLocalGeneratingEntry,
        removeLocalGeneratingEntry,
        setIsGeneratingLocally,
        postGenerationBlockRef,
        handleGenerationFailure,
      }),
    [
      dispatch,
      upsertLocalGeneratingEntry,
      removeLocalGeneratingEntry,
      setIsGeneratingLocally,
      postGenerationBlockRef,
      handleGenerationFailure,
    ],
  );

  const handleReplicateError = useMemo(
    () =>
      createHandleReplicateError({
        dispatch,
        upsertLocalGeneratingEntry,
        removeLocalGeneratingEntry,
        setIsGeneratingLocally,
        postGenerationBlockRef,
        handleGenerationFailure,
      }),
    [
      dispatch,
      upsertLocalGeneratingEntry,
      removeLocalGeneratingEntry,
      setIsGeneratingLocally,
      postGenerationBlockRef,
      handleGenerationFailure,
    ],
  );

  const generationRuntimeRef = useRef<InputBoxGenerationRuntime>({});
  const handleGenerate = useMemo(
    () => bindHandleGenerate(() => generationRuntimeRef.current!),
    [],
  );
`;

const out = [...lines.slice(0, 3354), insertBlock, ...lines.slice(7800)];
const outText = out.join("\n");

const returnIdx = out.findIndex((l) => l === "  return (");
if (returnIdx < 0) throw new Error("return ( not found");
const final = [
  ...out.slice(0, returnIdx),
  runtimeBlock,
  "",
  ...out.slice(returnIdx),
];

fs.writeFileSync(inputPath, final.join("\n"), "utf8");
console.log("Patched InputBox.tsx, runtime keys:", keys.length);
