const fs = require('fs');
const path = require('path');

const styles = [
  { id: "neoagrarianbrutalism", name: "Haryana", title: "NEO-AGRARIAN BRUTALISM", desc: "A hybrid landscape where cultivated farmland and raw concrete infrastructure merge into a single working production system.", image: "/HomePage/creativeStyle/NEO-AGRARIAN BRUTALISM.avif", tag: "Concept", comp: "NeoAgrarianBrutalism" },
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
const PAGE_PATH = path.join(SRC_ROOT, "app", "view", "HomePage", "page.tsx");

let pageStyle = fs.readFileSync(PAGE_PATH, 'utf8');

// Normalize line endings for replacement mapping
const originalPageStyle = pageStyle;
pageStyle = pageStyle.replace(/\\r\\n/g, '\\n');

let dynamicInsert = "";
let stateInsert = "";
let switchInsert = "";
let componentPropsInsert = "";
let instanceInsert = "";

for (const style of styles) {
  dynamicInsert += `const ${style.comp}FullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/${style.comp}FullscreenWalkthrough'),
    { ssr: false }
)\n`;

  stateInsert += `    const [show${style.comp}Walkthrough, setShow${style.comp}Walkthrough] = useState(false);\n`;
  switchInsert += `            case "${style.id}": setShow${style.comp}Walkthrough(true); break;\n`;

  componentPropsInsert += `                        on${style.comp}Open={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShow${style.comp}Walkthrough(true);
                        }}\n`;

  instanceInsert += `            <${style.comp}FullscreenWalkthrough
                isOpen={show${style.comp}Walkthrough}
                onClose={() => handleCloseWalkthrough(setShow${style.comp}Walkthrough)}
            />\n\n`;
}

// 1. Dynamic Imports
const matchDynamic = `const IduMishmiFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/IduMishmiFullscreenWalkthrough'),
    {
        ssr: false
    }
)`;
pageStyle = pageStyle.replace(matchDynamic, matchDynamic + "\\n" + dynamicInsert);

// 2. State
const matchState = `const [showIduMishmiWalkthrough, setShowIduMishmiWalkthrough] = useState(false);`;
pageStyle = pageStyle.replace(matchState, matchState + "\\n" + stateInsert);

// 3. Switch Statement
const matchSwitch = `case "idumishmi": setShowIduMishmiWalkthrough(true); break;`;
// it might not be idumishmi, let's use srikalahasti instead since it's the last one in the snippet 
const matchSwitch2 = `case "srikalahasti": setShowSrikalahastiWalkthrough(true); break;`;
pageStyle = pageStyle.replace(matchSwitch2, matchSwitch2 + "\\n" + switchInsert);

// 4. CreativeStyle Component Call Props
const matchProps = `onIduMishmiOpen={() => {
                            setShowWelcomeModal(false);
                            setShowIduMishmiWalkthrough(true);
                        }}`;
pageStyle = pageStyle.replace(matchProps, matchProps + "\\n" + componentPropsInsert);

// 5. Instantiation
const matchInst = `<IduMishmiFullscreenWalkthrough
                isOpen={showIduMishmiWalkthrough}
                onClose={() => setShowIduMishmiWalkthrough(false)}
            />`;
pageStyle = pageStyle.replace(matchInst, matchInst + "\\n\\n" + instanceInsert);

// Convert back to CRLF if it was CRLF originally
if (originalPageStyle.includes('\\r\\n')) {
  pageStyle = pageStyle.replace(/\\n/g, '\\r\\n');
}

fs.writeFileSync(PAGE_PATH, pageStyle);

console.log("Successfully patched page.tsx with 9 styles!");
