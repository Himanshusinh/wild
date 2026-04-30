import { STYLES as CREATIVE_STYLES } from "@/app/view/HomePage/compo/CreativeStyle";

type IndianStyleLike = {
  id: string;
  name: string;
  title: string;
  desc: string;
  image: string;
};

const PLACEHOLDER_IMAGE = "/styles/Logo.gif";

const EXTRA_INDIAN_STYLES: IndianStyleLike[] = [
  { id: "banarasibrocade", name: "Uttar Pradesh", title: "BANARASI BROCADE", desc: "Detailed woven brocade aesthetics with rich ornamental texture and luminous textile depth.", image: PLACEHOLDER_IMAGE },
  { id: "banarasmural", name: "Uttar Pradesh", title: "BANARAS MURAL", desc: "Temple-inspired mural storytelling with symbolic forms, layered color fields, and devotional motifs.", image: PLACEHOLDER_IMAGE },
  { id: "bhotiaweaving", name: "Uttarakhand", title: "BHOTIA WEAVING", desc: "Mountain weaving grammar with dense geometric rhythm, woolen tactility, and heritage pattern logic.", image: PLACEHOLDER_IMAGE },
  { id: "cheriyal", name: "Telangana", title: "CHERIYAL", desc: "Narrative scroll-painting style with folk figures, vivid reds, and structured episodic composition.", image: PLACEHOLDER_IMAGE },
  { id: "chikankari", name: "Uttar Pradesh", title: "CHIKANKARI", desc: "Fine embroidery-inspired visual language with delicate threadlike detailing and airy tonal restraint.", image: PLACEHOLDER_IMAGE },
  { id: "cholabronze", name: "Tamil Nadu", title: "CHOLA BRONZE", desc: "Classical bronze-sculpture form language with elegant silhouette, sacred poise, and refined ornament.", image: PLACEHOLDER_IMAGE },
  { id: "cholaoldbronze", name: "Tamil Nadu", title: "CHOLA OLD BRONZE", desc: "Patinated bronze heritage aesthetic blending antiquity, sculptural gravitas, and ritual craftsmanship.", image: PLACEHOLDER_IMAGE },
  { id: "farrukhabadprint", name: "Uttar Pradesh", title: "FARRUKHABAD PRINT", desc: "Traditional block-printing sensibility with repeating botanical motifs and hand-printed textural variance.", image: PLACEHOLDER_IMAGE },
  { id: "gadwalsaree", name: "Telangana", title: "GADWAL SAREE", desc: "Lustrous weaving style balancing ornate border articulation with finely structured body patterns.", image: PLACEHOLDER_IMAGE },
  { id: "gollabhamasaree", name: "Telangana", title: "GOLLABHAMA SAREE", desc: "Figurative weaving motif language with expressive folk iconography and decorative textile rhythm.", image: PLACEHOLDER_IMAGE },
  { id: "gotazari", name: "Rajasthan", title: "GOTA ZARI", desc: "Metallic applique embroidery aesthetics with festive brilliance, layered trims, and ceremonial richness.", image: PLACEHOLDER_IMAGE },
  { id: "kaavad", name: "Rajasthan", title: "KAAVAD", desc: "Portable shrine storytelling style with sequential panels, narrative icons, and handcrafted devotional feel.", image: PLACEHOLDER_IMAGE },
  { id: "kalighatpainting", name: "West Bengal", title: "KALIGHAT PAINTING", desc: "Bold brushwork and expressive contours with satirical character focus and minimalist pictorial backdrop.", image: PLACEHOLDER_IMAGE },
  { id: "kolamgeometry", name: "Tamil Nadu", title: "KOLAM GEOMETRY", desc: "Sacred line geometry with algorithmic symmetry, looping continuity, and threshold-based ritual design.", image: PLACEHOLDER_IMAGE },
  { id: "lacbangles", name: "Rajasthan", title: "LAC BANGLES", desc: "Glossy handcrafted ornament style with layered color inlays and celebratory jewelry detailing.", image: PLACEHOLDER_IMAGE },
  { id: "maduraisungudi", name: "Tamil Nadu", title: "MADURAI SUNGUDI", desc: "Tie-dye textile language with dotted resist motifs, airy repetition, and soft handcrafted gradients.", image: PLACEHOLDER_IMAGE },
  { id: "mahabalipuramsculpture", name: "Tamil Nadu", title: "MAHABALIPURAM SCULPTURE", desc: "Stone-carving visual grammar with relief-like depth, temple iconography, and coastal heritage texture.", image: PLACEHOLDER_IMAGE },
  { id: "narayanpetsaree", name: "Telangana", title: "NARAYANPET SAREE", desc: "Striped weaving idiom with temple-inspired borders and understated geometric textile precision.", image: PLACEHOLDER_IMAGE },
  { id: "nirmalart", name: "Telangana", title: "NIRMAL ART", desc: "Decorative painting tradition with stylized flora-fauna motifs and lacquered artisanal finishing cues.", image: PLACEHOLDER_IMAGE },
  { id: "odishafiligree", name: "Odisha", title: "ODISHA FILIGREE", desc: "Intricate silver filigree influence with lace-like metal complexity and ornamental precision.", image: PLACEHOLDER_IMAGE },
  { id: "odishastonecarving", name: "Odisha", title: "ODISHA STONE CARVING", desc: "Temple stone-carving expression with rhythmic relief texture and monumental sacred detail.", image: PLACEHOLDER_IMAGE },
  { id: "pachra", name: "Madhya Pradesh", title: "PACHRA", desc: "Folk textile structure with bold paneling, ritual symbolism, and hand-finished vernacular character.", image: PLACEHOLDER_IMAGE },
  { id: "pembarthimetalcraft", name: "Telangana", title: "PEMBARTHI METAL CRAFT", desc: "Repousse metalcraft vocabulary with embossed narrative surfaces and ceremonial decorative depth.", image: PLACEHOLDER_IMAGE },
  { id: "pilkhuwablockprint", name: "Uttar Pradesh", title: "PILKHUWA BLOCK PRINT", desc: "Block-printed cloth aesthetic with repeating hand-pressed motifs and tactile dye irregularity.", image: PLACEHOLDER_IMAGE },
  { id: "rangwalipichhoda", name: "Uttarakhand", title: "RANGWALI PICHHODA", desc: "Ceremonial textile ornament language with central deity motifs and vibrant auspicious accents.", image: PLACEHOLDER_IMAGE },
  { id: "rignai", name: "Tripura", title: "RIGNAI", desc: "Traditional woven stripe aesthetics with codified motif placement and indigenous loom identity.", image: PLACEHOLDER_IMAGE },
  { id: "risa", name: "Tripura", title: "RISA", desc: "Compact woven band style with symbolic patterns, strong linear identity, and ceremonial context.", image: PLACEHOLDER_IMAGE },
  { id: "sanjhi", name: "Uttar Pradesh", title: "SANJHI", desc: "Paper-stencil devotional style with cutwork geometry, radial patterning, and temple narrative elegance.", image: PLACEHOLDER_IMAGE },
  { id: "tamilritualcraft", name: "Tamil Nadu", title: "TAMIL RITUAL CRAFT", desc: "Ritual craft language with symbolic composition, sacred material cues, and ceremonial visual order.", image: PLACEHOLDER_IMAGE },
  { id: "tanjorepainting", name: "Tamil Nadu", title: "TANJORE PAINTING", desc: "Iconic devotional painting style with gold-like highlights, frontal figures, and ornate framing.", image: PLACEHOLDER_IMAGE },
  { id: "thanjavurdoll", name: "Tamil Nadu", title: "THANJAVUR DOLL", desc: "Traditional bobble-doll craft mood with festive palette, balanced form, and artisanal folk personality.", image: PLACEHOLDER_IMAGE },
  { id: "therukoothu", name: "Tamil Nadu", title: "THERUKOOTHU", desc: "Street-theatre folk visuality with dramatic makeup, costume geometry, and high narrative energy.", image: PLACEHOLDER_IMAGE },
  { id: "todaembroidery", name: "Tamil Nadu", title: "TODA EMBROIDERY", desc: "Linear red-black embroidery mapping with counted-stitch rhythm and structured tribal geometry.", image: PLACEHOLDER_IMAGE },
  { id: "zardozi", name: "Uttar Pradesh", title: "ZARDOZI", desc: "Regal metallic embroidery tone with raised embellishment cues and opulent ceremonial detailing.", image: PLACEHOLDER_IMAGE },
];

const dedupeById = (items: IndianStyleLike[]): IndianStyleLike[] => {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = String(item.id || "").trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export const ALL_INDIAN_STYLES: IndianStyleLike[] = dedupeById([
  ...CREATIVE_STYLES,
  ...EXTRA_INDIAN_STYLES,
]);
