const fs = require('fs');
const path = require('path');

const styles = [
  { id: "patola", name: "Gujarat", title: "PATOLA", desc: "A double ikat silk weaving tradition where intricate patterns are pre-dyed into threads and precisely aligned during weaving.", image: "/HomePage/creativeStyle/PATOLA.avif", tag: "Textile", comp: "Patola" },
  { id: "phulkari", name: "Haryana (Phulkari Belt)", title: "PHULKARI", desc: "A traditional khaddar-based embroidery where silk threads build patterns through reverse darning, forming ceremonial and heirloom textiles.", image: "/HomePage/creativeStyle/PHULKARI.avif", tag: "Textile", comp: "Phulkari" },
  { id: "pithora", name: "Gujarat", title: "PITHORA", desc: "A ritual wall painting tradition of the Rathwa community, where sacred horses and deities are painted as part of vow-fulfillment ceremonies.", image: "/HomePage/creativeStyle/PITHORA.avif", tag: "Art", comp: "Pithora" },
  { id: "roganart", name: "Gujarat (Kutch)", title: "ROGAN ART", desc: "A rare oil-paste textile art where intricate designs are drawn using a stylus and mirrored to create symmetrical compositions on dark cloth.", image: "/HomePage/creativeStyle/ROGAN ART.avif", tag: "Textile", comp: "RoganArt" },
  { id: "ruralfibercraft", name: "Haryana", title: "RURAL FIBER CRAFT", desc: "A traditional construction system using reed and rope, where tension, binding, and structural weaving create functional everyday objects.", image: "/HomePage/creativeStyle/RURAL FIBER CRAFT.avif", tag: "Craft", comp: "RuralFiberCraft" },
  { id: "sarkandaarchitecture", name: "Haryana", title: "SARKANDA ARCHITECTURE", desc: "A traditional reed-and-thatch shelter system designed for climate responsiveness, using layered roofs and breathable walls for natural cooling.", image: "/HomePage/creativeStyle/SARKANDA ARCHITECTURE.avif", tag: "Architecture", comp: "SarkandaArchitecture" },
  { id: "shimplahastkala", name: "Goa", title: "SHIMPLA HASTKALA", desc: "A traditional shell craft where natural sea shells are assembled into decorative and functional objects through handcrafted techniques.", image: "/HomePage/creativeStyle/SHIMPLA HASTKALA.avif", tag: "Craft", comp: "ShimplaHastkala" },
  { id: "sitalpati", name: "Assam", title: "SITALPATI", desc: "A traditional cool mat weaving craft using finely processed murta cane, known for its smooth surface and flat interlaced structure.", image: "/HomePage/creativeStyle/SITALPATI.avif", tag: "Craft", comp: "Sitalpati" }
];

const SRC_ROOT = "c:\\\\Users\\\\asus\\\\Desktop\\\\wildmindai\\\\wild\\\\src";
const CREATIVE_STYLE_PATH = path.join(SRC_ROOT, "app", "view", "HomePage", "compo", "CreativeStyle.tsx");
const PAGE_PATH = path.join(SRC_ROOT, "app", "view", "HomePage", "page.tsx");

let creativeStyle = fs.readFileSync(CREATIVE_STYLE_PATH, 'utf8');

// 1. Add to STYLES array
let stylesInsert = "";
for (const style of styles) {
  stylesInsert += `  {
    id: "${style.id}",
    name: "${style.name}",
    title: "${style.title}",
    desc: "${style.desc}",
    image: "${style.image}",
    tag: "${style.tag}",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },\n`;
}
creativeStyle = creativeStyle.replace(
  `  {
    id: "neoagrarianbrutalism",`,
  stylesInsert + `  {
    id: "neoagrarianbrutalism",`
);

// 2. Add to Props
let propsInsert = "";
for (const style of styles) {
  propsInsert += `  on${style.comp}Open?: () => void;\n`;
}
creativeStyle = creativeStyle.replace(
  `  onNeoAgrarianBrutalismOpen?: () => void;`,
  propsInsert + `  onNeoAgrarianBrutalismOpen?: () => void;`
);

// 3. Add to Destructured Props
let destructuredInsert = "";
for (const style of styles) {
  destructuredInsert += `  on${style.comp}Open,\n`;
}
creativeStyle = creativeStyle.replace(
  `  onNeoAgrarianBrutalismOpen,`,
  destructuredInsert + `  onNeoAgrarianBrutalismOpen,`
);

// 4. Add to Click Handlers
let handlersInsert = "";
for (const style of styles) {
  handlersInsert += `    if (style.id === "${style.id}" && on${style.comp}Open) {
      event.preventDefault();
      on${style.comp}Open();
      return;
    }\n`;
}
creativeStyle = creativeStyle.replace(
  `    if (style.id === "neoagrarianbrutalism" && onNeoAgrarianBrutalismOpen) {`,
  handlersInsert + `    if (style.id === "neoagrarianbrutalism" && onNeoAgrarianBrutalismOpen) {`
);

fs.writeFileSync(CREATIVE_STYLE_PATH, creativeStyle);


// ---- page.tsx ----
let pageStyle = fs.readFileSync(PAGE_PATH, 'utf8');

// 1. Dynamic Imports
let dynamicInsert = "";
for (const style of styles) {
  dynamicInsert += `const ${style.comp}FullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/${style.comp}FullscreenWalkthrough'),
    { ssr: false }
)\n`;
}
pageStyle = pageStyle.replace(
  `const NeoAgrarianBrutalismFullscreenWalkthrough`,
  dynamicInsert + `const NeoAgrarianBrutalismFullscreenWalkthrough`
);

// 2. State
let stateInsert = "";
for (const style of styles) {
  stateInsert += `    const [show${style.comp}Walkthrough, setShow${style.comp}Walkthrough] = useState(false);\n`;
}
pageStyle = pageStyle.replace(
  `    const [showNeoAgrarianBrutalismWalkthrough`,
  stateInsert + `    const [showNeoAgrarianBrutalismWalkthrough`
);

// 3. Switch Statement
let switchInsert = "";
for (const style of styles) {
  switchInsert += `            case "${style.id}": setShow${style.comp}Walkthrough(true); break;\n`;
}
pageStyle = pageStyle.replace(
  `            case "neoagrarianbrutalism": setShowNeoAgrarianBrutalismWalkthrough(true); break;`,
  switchInsert + `            case "neoagrarianbrutalism": setShowNeoAgrarianBrutalismWalkthrough(true); break;`
);

// 4. CreativeStyle Component Call Props
let componentPropsInsert = "";
for (const style of styles) {
  componentPropsInsert += `                        on${style.comp}Open={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShow${style.comp}Walkthrough(true);
                        }}\n`;
}
pageStyle = pageStyle.replace(
  `                        onNeoAgrarianBrutalismOpen={() => {`,
  componentPropsInsert + `                        onNeoAgrarianBrutalismOpen={() => {`
);

// 5. Instantiation
let instanceInsert = "";
for (const style of styles) {
  instanceInsert += `            <${style.comp}FullscreenWalkthrough
                isOpen={show${style.comp}Walkthrough}
                onClose={() => handleCloseWalkthrough(setShow${style.comp}Walkthrough)}
            />\n\n`;
}
pageStyle = pageStyle.replace(
  `            <NeoAgrarianBrutalismFullscreenWalkthrough`,
  instanceInsert + `            <NeoAgrarianBrutalismFullscreenWalkthrough`
);

fs.writeFileSync(PAGE_PATH, pageStyle);

console.log("Updated page.tsx and CreativeStyle.tsx successfully.");
