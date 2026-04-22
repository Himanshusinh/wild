"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import Link from "next/link";

type StyleItem = {
  id: string;
  name: string;
  title: string;
  desc: string;
  image: string;
  tag: string;
  titleColor: string;
  href: string;
  imageFilter?: string;
};

export const STYLES: StyleItem[] = [
  {
    id: "Maharashtra",
    name: "Maharashtra",
    title: "Warli",
    desc: "Warli art is a traditional folk style from India that uses basic geometric shapes, like triangles, circles, and lines, to create stick-figure depictions of daily social life and nature",
    image: "/HomePage/creativeStyle/warli.avif",
    tag: "Film",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.9)",
  },
  {
    id: "ajrakh",
    name: "Gujarat",
    title: "AJRAKH",
    desc: "A resist block-print textile tradition known for its geometric symmetry, deep indigo tones, and structured border-field composition.",
    image: "/HomePage/creativeStyle/ajrakh.avif",
    tag: "Textile",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.88) saturate(0.95)",
  },
  {
    id: "jhajjar",
    name: "Haryana",
    title: "JHAJJAR POTTERY",
    desc: "A traditional terracotta pottery system centered on functional water vessels, known for its slim-necked surahi forms and porous clay body.",
    image: "/HomePage/creativeStyle/jhajjar-pottery.avif",
    tag: "Pottery",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.9) saturate(0.95)",
  },
  {
    id: "kaavi",
    name: "Goa",
    title: "KAAVI ART",
    desc: "An incised wall art tradition where designs are carved into a red-oxide layer to reveal white lime plaster beneath.",
    image: "/HomePage/creativeStyle/kaavi-art.avif",
    tag: "Wall Art",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.9) saturate(0.95)",
  },
  {
    id: "kangra",
    name: "Himachal Pradesh",
    title: "KANGRA",
    desc: "A lyrical miniature painting tradition known for its serene figures, delicate lines, and lush green landscapes expressing poetic and devotional themes.",
    image: "/HomePage/creativeStyle/kangra.avif",
    tag: "Miniature",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.9) saturate(0.95)",
  },
  {
    id: "karepa",
    name: "Goa",
    title: "KAREPA WINDOWS",
    desc: "A traditional window system where translucent shell panes replace glass, filtering light while maintaining privacy and softness.",
    image: "/HomePage/creativeStyle/karepa-windows.avif",
    tag: "Window",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.9) saturate(0.95)",
  },
  {
    id: "khatwa",
    name: "Bihar",
    title: "KHATWA APPLIQUÉ",
    desc: "A traditional textile art where colored fabric shapes are cut and stitched onto a base cloth to create bold narrative compositions.",
    image: "/HomePage/creativeStyle/khatwa-appliqu.avif",
    tag: "Textile",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.9) saturate(0.95)",
  },
  {
    id: "khovar",
    name: "Jharkhand",
    title: "KHOVAR",
    desc: "A ceremonial wall art created by etching through layered clay surfaces, revealing motifs in striking black-and-white contrast.",
    image: "/HomePage/creativeStyle/khovar.avif",
    tag: "Wall Art",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.9) saturate(0.95)",
  },
  {
    id: "kinnauri",
    name: "Himachal Pradesh",
    title: "KINNAURI SHAWL",
    desc: "A handwoven wool textile known for its intricate geometric motifs, strong border design, and symbolic pattern structure.",
    image: "/HomePage/creativeStyle/kinnauri-shawl.avif",
    tag: "Textile",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.9) saturate(0.95)",
  },
  {
    id: "kosa",
    name: "Chhattisgarh",
    title: "KOSA SILK",
    desc: "A traditional handloom silk crafted from Kosa fibers, known for its natural texture, breathable weave, and subtle golden sheen.",
    image: "/HomePage/creativeStyle/kosa-silk.avif",
    tag: "Textile",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.9) saturate(0.95)",
  },
  {
    id: "kutch",
    name: "Gujarat",
    title: "KUTCH EMBROIDERY",
    desc: "A traditional hand embroidery system defined by region-specific styles, dense stitchwork, and richly detailed surface patterns built directly into fabric.",
    image: "/HomePage/creativeStyle/kutch-embroidery.avif",
    tag: "Embroidery",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.9) saturate(0.95)",
  },
  {
    id: "lippan",
    name: "Gujarat",
    title: "LIPPAN KAAM",
    desc: "A traditional mud-relief wall craft known for its sculpted patterns and embedded mirrors that reflect light within earthen surfaces.",
    image: "/HomePage/creativeStyle/lippan-kaam.avif",
    tag: "Wall Art",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.9) saturate(0.95)",
  },
  {
    id: "majuli",
    name: "Assam",
    title: "MAJULI MASK",
    desc: "A devotional theatre mask tradition used in Bhaona performances, designed for bold character expression and stage readability.",
    image: "/HomePage/creativeStyle/majuli-mask.avif",
    tag: "Mask",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.9) saturate(0.95)",
  },
  {
    id: "manjusha",
    name: "Bihar (Bhagalpur)",
    title: "MANJUSHA ART",
    desc: "A ritual narrative painting tradition centered on the Bihula-Bishahari story, using bold outlines, flat colors, and symbolic serpent imagery.",
    image: "/HomePage/creativeStyle/manjusha-art.avif",
    tag: "Ritual Art",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.9) saturate(0.95)",
  },
  {
    id: "matanipachedi",
    name: "Gujarat",
    title: "MATA NI PACHEDI",
    desc: "A sacred shrine-cloth tradition where the Mother Goddess is depicted within a ritual enclosure using block-print and hand-painted techniques.",
    image: "/HomePage/creativeStyle/mata-ni-pachedi.avif",
    tag: "Shrine Cloth",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.9) saturate(0.95)",
  },
  {
    id: "madhubani",
    name: "Bihar",
    title: "MADHUBANI",
    desc: "A traditional Mithila painting style known for its bold outlines, symbolic motifs, and richly filled compositions with no empty space.",
    image: "/HomePage/creativeStyle/madhubani.avif",
    tag: "Art",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.9) saturate(0.98)",
  },
  {
    id: "kyilkhor",
    name: "Arunachal Pradesh",
    title: "KYIL-KHOR",
    desc: "A sacred Buddhist mandala system representing a structured cosmic diagram with central hierarchy, symbolic geometry, and ritual significance.",
    image: "/HomePage/creativeStyle/kyil-khor.avif",
    tag: "Sacred",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "sherdukpen",
    name: "Arunachal Pradesh",
    title: "SHERDUKPEN TEXTILE",
    desc: "A handwoven textile tradition known for its centered motifs, white-ground structure, and functional woven forms used as carrying cloths.",
    image: "/HomePage/creativeStyle/sherdukpen-textile.avif",
    tag: "Textile",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.9) saturate(0.95)",
  },
  {
    id: "idumishmi",
    name: "Arunachal Pradesh",
    title: "IDU MISHMI TEXTILE",
    desc: "A handwoven textile tradition known for its bold geometric patterns, diamond motifs, and dense loom-based craftsmanship.",
    image: "/HomePage/creativeStyle/idu-mishmi-textile.avif",
    tag: "Textile",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.9) saturate(0.95)",
  },
  {
    id: "etikoppaka",
    name: "Andhra Pradesh",
    title: "ETIKOPPAKA TOYS",
    desc: "A traditional lacquered wood craft known for its smooth turned forms, vibrant natural colors, and refined handcrafted finish",
    image: "/HomePage/creativeStyle/etikoppaka-toys.avif",
    tag: "Toy",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.9) saturate(0.98)",
  },
  {
    id: "kondapalli",
    name: "Andhra Pradesh",
    title: "KONDAPALLI TOYS",
    desc: "A traditional wooden toy craft known for its hand-carved forms, vibrant painted surfaces, and charming miniature storytelling scenes.",
    image: "/HomePage/creativeStyle/kondapalli-toys.avif",
    tag: "Toy",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.9) saturate(0.98)",
  },
  {
    id: "monpamask",
    name: "Arunachal Pradesh",
    title: "MONPA MASK",
    desc: "A ritual woodcraft tradition known for its symbolic carved masks, bold expressions, and ceremonial significance in cultural performances.",
    image: "/HomePage/creativeStyle/monpa-mask.avif",
    tag: "Ritual",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "handmadepaper",
    name: "Arunachal Pradesh",
    title: "HANDMADE PAPER",
    desc: "A traditional bark-fiber paper craft known for its natural texture, matte finish, and quiet material elegance rooted in handmade processes.",
    image: "/HomePage/creativeStyle/handmade-paper.avif",
    tag: "Craft",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "monpa",
    name: "Arunachal Pradesh",
    title: "MONPA TEXTILE",
    desc: "A handwoven textile tradition defined by rhythmic patterns, banded structures, and deeply rooted loom-based craftsmanship.",
    image: "/HomePage/creativeStyle/monpa-textile.avif",
    tag: "Textile",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "wancho",
    name: "Arunachal Pradesh",
    title: "WANCHO CARVING",
    desc: "A traditional wood carving practice known for its bold, head-centric forms, symbolic expressions, and deeply carved handcrafted textures.",
    image: "/HomePage/creativeStyle/wancho-carving.avif",
    tag: "Sculpture",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "thangka",
    name: "Arunachal Pradesh",
    title: "THANGKA",
    desc: "A sacred Buddhist scroll painting tradition known for its precise iconography, spiritual symbolism, and intricate hand-painted detailing on cloth.",
    image: "/HomePage/creativeStyle/sacred-thangka-art.avif",
    tag: "Sacred",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "tholu",
    name: "Andhra Pradesh",
    title: "LEATHER PUPPETRY",
    desc: "A traditional shadow theatre art crafted from translucent leather, known for its intricate perforations, vibrant colors, and dramatic backlit storytelling.",
    image: "/HomePage/creativeStyle/andra-leather.avif",
    tag: "Theatre",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "uppadajamdani",
    name: "Andhra Pradesh",
    title: "UPPADA JAMDANI",
    desc: "A delicate handwoven textile known for its extra-weft motif seamlessly integrated into the fabric, creating lightweight and elegant designs.",
    image: "/HomePage/creativeStyle/uppada-jamdani.avif",
    tag: "Fabric",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.9)",
  },
  {
    id: "srikalahasti",
    name: "Andhra Pradesh",
    title: "SRIKALAHASTI",
    desc: "A sacred hand-painted Kalamkari tradition known for its expressive freehand drawings, mythological storytelling, and natural dye detailing on cotton cloth.",
    image: "/HomePage/creativeStyle/srikalahasti-kalamkari.avif",
    tag: "Fabric",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.9)",
  },
  {
    id: "machilipatnam",
    name: "Andhra Pradesh",
    title: "MACHILIPATNAM",
    desc: "A block-printed Kalamkari style featuring intricate Persian-inspired floral patterns, repeat motifs, and natural dyes crafted for textile design.",
    image: "/HomePage/creativeStyle/machilipatnam-kalamkari.avif",
    tag: "Fabric",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.9)",
  },
  {
    id: "asharikandi",
    name: "Assam",
    title: "ASHARIKANDI TERRACOTTA",
    desc: "A traditional fired-clay craft from Assam, where handmade terracotta forms are shaped, dried, and fired into earthy, matte objects.",
    image: "/HomePage/creativeStyle/asharikandi-terracotta.avif",
    tag: "Sculpture",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.9) saturate(0.95)",
  },
  {
    id: "azulejos",
    name: "Goa",
    title: "AZULEJOS",
    desc: "A hand-painted ceramic tile tradition featuring blue-on-white imagery, decorative borders, and architectural plaque compositions.",
    image: "/HomePage/creativeStyle/azulejos1.avif",
    tag: "Ceramic",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.95) saturate(0.9)",
  },
  {
    id: "bandhani",
    name: "Gujarat",
    title: "BANDHANI",
    desc: "A resist-dye textile tradition created through thousands of hand-tied points, forming intricate dot patterns and vibrant ceremonial cloth.",
    image: "/HomePage/creativeStyle/bandhani.avif",
    tag: "Textile",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.9) saturate(1.1)",
  },
  {
    id: "bastardhokra",
    name: "Chhattisgarh",
    title: "BASTAR DHOKRA",
    desc: "A traditional lost-wax metal casting craft where objects are built in wax and transformed into intricate bell-metal forms.",
    image: "/HomePage/creativeStyle/bastar-dhokra.avif",
    tag: "Metalcraft",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(1)",
  },
  {
    id: "muriawallpainting",
    name: "Chhattisgarh (Bastar)",
    title: "MURIA WALL PAINTING",
    desc: "A traditional earthen mural art where symbolic figures are painted onto prepared mud walls using natural pigments and communal storytelling.",
    image: "/HomePage/creativeStyle/muria-wall-painting.avif",
    tag: "Art",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.9) saturate(0.9)",
  },
  {
    id: "bastarwoodcraft",
    name: "Chhattisgarh",
    title: "BASTAR WOODCRAFT",
    desc: "A traditional hand-carved woodcraft where solid blocks are shaped into symbolic figures using simple tools and techniques.",
    image: "/HomePage/creativeStyle/bastar-woodcraft.avif",
    tag: "Woodcraft",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.9) saturate(0.9)",
  },
  {
    id: "bhagalpursilk",
    name: "Bihar",
    title: "BHAGALPUR SILK",
    desc: "A handloom silk tradition known for its tussar-based texture, breathable weave, and soft natural lustre.",
    image: "/HomePage/creativeStyle/bhagalpur-silk.avif",
    tag: "Fabric",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.9) saturate(0.9)",
  },
  {
    id: "chambaminiature",
    name: "Himachal Pradesh",
    title: "CHAMBA MINIATURE",
    desc: "A court painting tradition known for its narrative scenes, stylized figures, and refined use of color in miniature form.",
    image: "/HomePage/creativeStyle/chamba-miniature.avif",
    tag: "Painting",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.9) saturate(0.9)",
  },
  {
    id: "exposedlaterite",
    name: "Goa",
    title: "EXPOSED LATERITE",
    desc: "A construction system using cut laterite stone blocks, where exposed red-brown masonry defines the structure and character of buildings.",
    image: "/HomePage/creativeStyle/exposed-laterite.avif",
    tag: "Architecture",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.9) saturate(0.9)",
  },
  {
    id: "gharchola",
    name: "Gujarat",
    title: "GHARCHOLA",
    desc: "A ceremonial bridal textile defined by its gold zari grid, Bandhani-filled squares, and structured red-gold design rooted in wedding traditions.",
    image: "/HomePage/creativeStyle/gharchola.avif",
    tag: "Textile",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.9) saturate(1.1)",
  },
  {
    id: "godnaart",
    name: "Bihar (Mithila)",
    title: "GODNA ART",
    desc: "A tattoo-derived painting tradition where symbolic motifs and repeated marks form inscribed visual narratives.",
    image: "/HomePage/creativeStyle/godna-art.avif",
    tag: "Painting",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.9) saturate(0.9)",
  },
  {
    id: "taiahommanuscript",
    name: "Assam",
    title: "TAI-AHOM MANUSCRIPT",
    desc: "A traditional manuscript system where script, symbols, and images coexist to preserve knowledge on folio surfaces.",
    image: "/HomePage/creativeStyle/tai-ahom-manuscript.avif",
    tag: "Manuscript",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.9) saturate(0.9)",
  },
  {
    id: "tangaliya",
    name: "Gujarat",
    title: "TANGALIYA",
    desc: "A unique handwoven textile tradition where raised bead-like dots are created through extra-weft weaving, forming rhythmic geometric patterns.",
    image: "/HomePage/creativeStyle/tangaliya.avif",
    tag: "Textile",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.9) saturate(0.9)",
  },
  {
    id: "agrarianindustrial",
    name: "Haryana",
    title: "AGRARIAN–INDUSTRIAL BLEND",
    desc: "A production ecosystem where agriculture, machinery, and industry operate together within a unified landscape.",
    image: "/HomePage/creativeStyle/agrarian-industrial-blend.avif",
    tag: "Ecosystem",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.9) saturate(0.9)",
  },
  {
    id: "indoportuguese",
    name: "Goa",
    title: "INDO-PORTUGUESE",
    desc: "A distinctive house-front architecture where bold wall colors, white trim, and structured façades define the identity of Goan streets.",
    image: "/HomePage/creativeStyle/indo-portuguese.avif",
    tag: "Architecture",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.9) saturate(0.9)",
  },
  {
    id: "tikuliart",
    name: "Bihar (Patna)",
    title: "TIKULI ART",
    desc: "A precision-painted decorative art derived from the bindi tradition, known for its polished surface and fine enamel detailing.",
    image: "/HomePage/creativeStyle/tikuli-art.avif",
    tag: "Art",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.9) saturate(0.9)",
  },
  {
    id: "sohraikhovar",
    name: "Jharkhand",
    title: "SOHRAI–KHOVAR",
    desc: "A traditional wall art practice where mud-house surfaces are transformed into ritual murals using natural pigments and symbolic motifs.",
    image: "/HomePage/creativeStyle/sohrai-khovar.avif",
    tag: "Art",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.9) saturate(0.9)",
  },
  {
    id: "woodtemplecarving",
    name: "Himachal Pradesh",
    title: "WOOD TEMPLE CARVING",
    desc: "A sacred architectural carving tradition where wooden temple structures are intricately sculpted with relief and iconographic detail.",
    image: "/HomePage/creativeStyle/wood-temple-carving.avif",
    tag: "Architecture",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.9) saturate(0.9)",
  },
  {
    id: "neoagrarianbrutalism",
    name: "Haryana",
    title: "NEO-AGRARIAN BRUTALISM",
    desc: "A hybrid landscape where cultivated farmland and raw concrete infrastructure merge into a single working production system.",
    image: "/HomePage/creativeStyle/neo-agrarian-brutalism.avif",
    tag: "Concept",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "patola",
    name: "Gujarat",
    title: "PATOLA",
    desc: "A double ikat silk weaving tradition where intricate patterns are pre-dyed into threads and precisely aligned during weaving.",
    image: "/HomePage/creativeStyle/patola.avif",
    tag: "Textile",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "phulkari",
    name: "Haryana (Phulkari Belt)",
    title: "PHULKARI",
    desc: "A traditional khaddar-based embroidery where silk threads build patterns through reverse darning, forming ceremonial and heirloom textiles.",
    image: "/HomePage/creativeStyle/phulkari.avif",
    tag: "Textile",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "pithora",
    name: "Gujarat",
    title: "PITHORA",
    desc: "A ritual wall painting tradition of the Rathwa community, where sacred horses and deities are painted as part of vow-fulfillment ceremonies.",
    image: "/HomePage/creativeStyle/pithora.avif",
    tag: "Art",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "roganart",
    name: "Gujarat (Kutch)",
    title: "ROGAN ART",
    desc: "A rare oil-paste textile art where intricate designs are drawn using a stylus and mirrored to create symmetrical compositions on dark cloth.",
    image: "/HomePage/creativeStyle/rogan-art.avif",
    tag: "Textile",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "ruralfibercraft",
    name: "Haryana",
    title: "RURAL FIBER CRAFT",
    desc: "A traditional construction system using reed and rope, where tension, binding, and structural weaving create functional everyday objects.",
    image: "/HomePage/creativeStyle/rural-fiber-craft.avif",
    tag: "Craft",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "sarkandaarchitecture",
    name: "Haryana",
    title: "SARKANDA ARCHITECTURE",
    desc: "A traditional reed-and-thatch shelter system designed for climate responsiveness, using layered roofs and breathable walls for natural cooling.",
    image: "/HomePage/creativeStyle/sarkanda-architecture.avif",
    tag: "Architecture",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "shimplahastkala",
    name: "Goa",
    title: "SHIMPLA HASTKALA",
    desc: "A traditional shell craft where natural sea shells are assembled into decorative and functional objects through handcrafted techniques.",
    image: "/HomePage/creativeStyle/shimpla-hastkala.avif",
    tag: "Craft",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "sitalpati",
    name: "Assam",
    title: "SITALPATI",
    desc: "A traditional cool mat weaving craft using finely processed murta cane, known for its smooth surface and flat interlaced structure.",
    image: "/HomePage/creativeStyle/sitalpati.avif",
    tag: "Craft",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "sohrai",
    name: "Jharkhand",
    title: "SOHRAI",
    desc: "A ritual wall painting tradition where mud-house surfaces are transformed using natural earth pigments into living murals of animals, plants, and harvest life.",
    image: "/HomePage/creativeStyle/sohrai.avif",
    tag: "Art",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "sonowaltextile",
    name: "Assam",
    title: "SONOWAL TEXTILE",
    desc: "A community-specific handloom tradition defined by woven borders, rhythmic bands, and identity-driven textile design.",
    image: "/HomePage/creativeStyle/sonowal-textile.avif",
    tag: "Textile",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "sufembroidery",
    name: "Gujarat",
    title: "SUF EMBROIDERY",
    desc: "A counted embroidery tradition built through triangular geometry, where patterns emerge from precise stitching rather than pre-drawn design.",
    image: "/HomePage/creativeStyle/suf-embroidery.avif",
    tag: "Textile",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "katabapplique",
    name: "Gujarat",
    title: "KATAB APPLIQUÉ",
    desc: "A traditional textile craft where cut fabric pieces are stitched onto a base cloth to create bold geometric compositions.",
    image: "/HomePage/creativeStyle/next-styles-images/katab-appliqu.avif",
    tag: "Textile",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "baghprint",
    name: "Madhya Pradesh",
    title: "BAGH PRINT",
    desc: "A traditional hand block-printing craft known for its natural red and black dyes, repeat patterns, and textile-based design structure.",
    image: "/HomePage/creativeStyle/next-styles-images/bagh-print.avif",
    tag: "Textile",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "bamboocraft",
    name: "Meghalaya",
    title: "BAMBOO CRAFT",
    desc: "A traditional craft where split bamboo strips are woven and bound into lightweight, functional structures.",
    image: "/HomePage/creativeStyle/next-styles-images/bamboo-craft.avif",
    tag: "Craft",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "nagabeadcluster",
    name: "Nagaland",
    title: "NAGA BEAD CLUSTER",
    desc: "A traditional ornament system where layered bead strands form dense, tiered clusters across the neck and chest.",
    image: "/HomePage/creativeStyle/next-styles-images/naga-bead-cluster.avif",
    tag: "Ornament",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "bidriware",
    name: "Karnataka (Bidar)",
    title: "BIDRIWARE",
    desc: "A traditional metal craft where silver is inlaid into engraved grooves on a deep black alloy surface, creating striking contrast-driven designs.",
    image: "/HomePage/creativeStyle/next-styles-images/bidriware.avif",
    tag: "Metalwork",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "bordersigntextile",
    name: "Manipur",
    title: "BORDER-SIGN TEXTILE",
    desc: "A traditional textile system where meaning is defined through the relationship between a restrained field and a strong identity-bearing border.",
    image: "/HomePage/creativeStyle/next-styles-images/border-sign-textile.avif",
    tag: "Textile",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "bundelipainting",
    name: "Madhya Pradesh (Orchha)",
    title: "BUNDELI PAINTING",
    desc: "A traditional mural art where clustered scenes depict courtly, devotional, and everyday life using bold colors and narrative composition.",
    image: "/HomePage/creativeStyle/next-styles-images/bundeli-painting.avif",
    tag: "Painting",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "ceremonialemblem",
    name: "Manipur",
    title: "CEREMONIAL EMBLEM",
    desc: "A symbolic textile system where authority and meaning are expressed through black fields, red boundaries, and ranked emblematic forms.",
    image: "/HomePage/creativeStyle/next-styles-images/ceremonial-emblem.avif",
    tag: "Textile",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "channapatnatoys",
    name: "Karnataka",
    title: "CHANNAPATNA TOYS",
    desc: "A traditional craft of lathe-turned wooden toys finished with glossy lacquer, known for their smooth forms and vibrant colors.",
    image: "/HomePage/creativeStyle/next-styles-images/channapatna-toys.avif",
    tag: "Craft",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "coircraft",
    name: "Kerala",
    title: "COIR CRAFT",
    desc: "A natural fibre craft where coconut husk is transformed into twisted yarn and rope to create durable, functional products.",
    image: "/HomePage/creativeStyle/next-styles-images/coir-craft.avif",
    tag: "Fibre",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "bellmetalrituals",
    name: "Kerala",
    title: "BELL-METAL RITUALS",
    desc: "A sacred object tradition defined by typology-led forms like lamps and vessels, crafted in dense bell-metal for ritual use.",
    image: "/HomePage/creativeStyle/next-styles-images/bell-metal-rituals.avif",
    tag: "Metalcraft",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "kasutiembroidery",
    name: "Karnataka",
    title: "KASUTI EMBROIDERY",
    desc: "A traditional counted-thread embroidery where geometric motifs are built through precise, knotless stitching on cloth.",
    image: "/HomePage/creativeStyle/next-styles-images/kasuti-embroidery.avif",
    tag: "Embroidery",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "keralamural",
    name: "Kerala",
    title: "KERALA MURAL",
    desc: "A sacred painting tradition where divine figures are constructed through codified forms, expressive eyes, and a disciplined five-color system.",
    image: "/HomePage/creativeStyle/next-styles-images/kerala-mural.avif",
    tag: "Painting",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "khambhatagate",
    name: "Gujarat",
    title: "KHAMBHAT AGATE",
    desc: "A traditional stone craft where raw agate is shaped, drilled, and polished to reveal natural banding and translucency.",
    image: "/HomePage/creativeStyle/next-styles-images/khambhat-agate.avif",
    tag: "Stonecraft",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "kinhalcraft",
    name: "Karnataka",
    title: "KINHAL CRAFT",
    desc: "A traditional craft where wooden forms are built through additive shaping and finished with painted symbolic identity.",
    image: "/HomePage/creativeStyle/next-styles-images/kinhal-craft.avif",
    tag: "Craft",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "kolhapurjewellery",
    name: "Maharashtra",
    title: "KOLHAPUR JEWELLERY",
    desc: "A traditional metal craft where ornaments are built through linked units, articulation, and body-bound placement.",
    image: "/HomePage/creativeStyle/next-styles-images/kolhapur-jewellery.avif",
    tag: "Jewellery",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "kolhapurichappal",
    name: "Maharashtra",
    title: "KOLHAPURI CHAPPAL",
    desc: "A traditional leather footwear system built through sole-first construction, strap geometry, and grounded body-fit logic.",
    image: "/HomePage/creativeStyle/next-styles-images/kolhapuri-chappal.avif",
    tag: "Footwear",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "kolhapurisaaj",
    name: "Maharashtra",
    title: "KOLHAPURI SAAJ",
    desc: "A traditional necklace system where symbolic pendants are arranged in a structured sequence across the neckline.",
    image: "/HomePage/creativeStyle/next-styles-images/kolhapuri-saaj.avif",
    tag: "Jewellery",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "lambaniembroidery",
    name: "Karnataka",
    title: "LAMBANI EMBROIDERY",
    desc: "A traditional textile craft where surfaces are constructed through patchwork, mirrors, dense stitching, and attached ornamentation.",
    image: "/HomePage/creativeStyle/next-styles-images/lambani-embroidery.avif",
    tag: "Embroidery",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "leathertoys",
    name: "Madhya Pradesh (Indore)",
    title: "LEATHER TOYS",
    desc: "A traditional craft where figures are built on armature structures and covered with stretched leather, finished with painted details.",
    image: "/HomePage/creativeStyle/next-styles-images/leather-toys.avif",
    tag: "Toys",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "paithani",
    name: "Maharashtra",
    title: "PAITHANI",
    desc: "A handwoven silk-and-zari textile defined by pallu dominance, structural borders, and intricate loom-woven motifs.",
    image: "/HomePage/creativeStyle/next-styles-images/paithani.avif",
    tag: "Textile",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "pawndum",
    name: "Mizoram",
    title: "PAWNDUM",
    desc: "A traditional dark-ground wrap cloth defined by bold woven stripes, panel construction, and socially coded lower-body use.",
    image: "/HomePage/creativeStyle/next-styles-images/pawndum.avif",
    tag: "Textile",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "poshinaterracotta",
    name: "Gujarat",
    title: "POSHINA TERRACOTTA",
    desc: "A votive clay tradition where terracotta horses are offered at shrines as symbols of faith, protection, and fulfilled vows.",
    image: "/HomePage/creativeStyle/next-styles-images/poshina-terracotta.avif",
    tag: "Terracotta",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "prestigependants",
    name: "Nagaland",
    title: "PRESTIGE PENDANTS",
    desc: "Body-worn symbolic forms representing status, bravery, and inherited identity through visible focal signs.",
    image: "/HomePage/creativeStyle/next-styles-images/prestige-pendants.avif",
    tag: "Jewellery",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "puanchei",
    name: "Mizoram",
    title: "PUANCHEI",
    desc: "A vibrant ceremonial textile defined by bold woven bands, strong color contrasts, and rhythmic horizontal structure.",
    image: "/HomePage/creativeStyle/next-styles-images/puanchei.avif",
    tag: "Textile",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "puanlaisen",
    name: "Mizoram",
    title: "PUANLAISEN",
    desc: "A traditional woven textile defined by a dominant central red band that structures the entire cloth.",
    image: "/HomePage/creativeStyle/next-styles-images/puanlaisen.avif",
    tag: "Textile",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "sandalwoodcarving",
    name: "Karnataka (Mysuru)",
    title: "SANDALWOOD CARVING",
    desc: "A delicate woodcraft tradition known for intricate hand-carved details, fine relief work, and precious sandalwood material.",
    image: "/HomePage/creativeStyle/next-styles-images/sandalwood-carving.avif",
    tag: "Woodcraft",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "sankhedawoodwork",
    name: "Gujarat (Vadodara)",
    title: "SANKHEDA WOODWORK",
    desc: "A traditional furniture craft defined by turned wooden forms, lacquered surfaces, and hand-painted motifs.",
    image: "/HomePage/creativeStyle/next-styles-images/sankheda-woodwork.avif",
    tag: "Woodcraft",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "ganjifa-sawantwadi",
    name: "Maharashtra (Sawantwadi)",
    title: "GANJIFA",
    desc: "A traditional hand-painted card art defined by circular composition, symbolic figures, and structured decorative borders.",
    image: "/HomePage/creativeStyle/next-styles-images/ganjifa.avif",
    tag: "Painting",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "sawantwadiwoodcraft",
    name: "Maharashtra",
    title: "SAWANTWADI WOODCRAFT",
    desc: "A traditional miniature craft where hand-carved wooden forms are painted and arranged into playful object-world sets.",
    image: "/HomePage/creativeStyle/next-styles-images/sawantwadi-woodcraft.avif",
    tag: "Woodcraft",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "shapheelanphee",
    name: "Manipur",
    title: "SHAPHEE LANPHEE",
    desc: "A ceremonial honour cloth defined by black field authority, red borders, and symbolic motifs representing status and tradition.",
    image: "/HomePage/creativeStyle/next-styles-images/shaphee-lanphee.avif",
    tag: "Textile",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "sheerfieldcloth",
    name: "Manipur",
    title: "SHEER FIELD CLOTH",
    desc: "A soft upper-wrap textile system defined by translucency, gentle drape, and poised visual presence.",
    image: "/HomePage/creativeStyle/next-styles-images/sheer-field-cloth.avif",
    tag: "Textile",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "bodyaugmentation",
    name: "Nagaland",
    title: "BODY AUGMENTATION",
    desc: "A cultural system where tattoos, hair, and feathers transform the body into a symbolic and socially coded visual field.",
    image: "/HomePage/creativeStyle/next-styles-images/body-augmentation.avif",
    tag: "Tattoo",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "tawlhlophuan",
    name: "Mizoram",
    title: "TAWLHLOHPUAN",
    desc: "A traditional warrior cloth defined by joined construction, firm woven structure, and symbolic red-white seam discipline.",
    image: "/HomePage/creativeStyle/next-styles-images/tawlhlohpuan.avif",
    tag: "Textile",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "templemural",
    name: "Karnataka (Hampi)",
    title: "TEMPLE MURAL",
    desc: "A sacred architectural painting tradition where narrative panels, divine figures, and ornamental borders are integrated into temple ceilings.",
    image: "/HomePage/creativeStyle/next-styles-images/temple-mural.avif",
    tag: "Painting",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "togalugombeyaata",
    name: "Karnataka",
    title: "TOGALU GOMBEYAATA",
    desc: "A traditional shadow-puppetry form where translucent leather figures, light, and screen create dynamic storytelling.",
    image: "/HomePage/creativeStyle/next-styles-images/togalu-gombeyaata.avif",
    tag: "Puppetry",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "nagashawl",
    name: "Nagaland",
    title: "NAGA SHAWL",
    desc: "A tribe-specific woven system where pattern, structure, and identity are governed by a single coherent visual code.",
    image: "/HomePage/creativeStyle/next-styles-images/tribe-signature-shawl-branch-nagaland.avif",
    tag: "Shawl",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "wangkheiphee",
    name: "Manipur",
    title: "WANGKHEI PHEE",
    desc: "A delicate woven textile defined by airy muslin-like body fields, sparse motifs, and strong geometric borders.",
    image: "/HomePage/creativeStyle/next-styles-images/wangkhei-phee.avif",
    tag: "Textile",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "meritshawl",
    name: "Nagaland",
    title: "MERIT SHAWL",
    desc: "An earned ceremonial textile defined by bold segmented patterns, strong contrast, and public status symbolism.",
    image: "/HomePage/creativeStyle/next-styles-images/merit-shawl.avif",
    tag: "Shawl",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "ganjifa-mysore",
    name: "Karnataka (Mysore)",
    title: "GANJIFA CARDS",
    desc: "A traditional hand-painted card system featuring miniature symbolic imagery organized within bounded fields and deck-based themes.",
    image: "/HomePage/creativeStyle/next-styles-images/ganjifa-cards.avif",
    tag: "Art",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.9) saturate(0.95)",
  },
  {
    id: "garoweaving",
    name: "Meghalaya",
    title: "GARO WEAVING",
    desc: "A traditional weaving system where border hierarchy and symbolic motifs structure cloth designed for body-wrapped garments.",
    image: "/HomePage/creativeStyle/next-styles-images/garo-weaving.avif",
    tag: "Textile",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "nagabodycloth",
    name: "Nagaland",
    title: "NAGA BODY-CLOTH",
    desc: "A ceremonial textile system where identity and social role are expressed through the placement and structure of body-worn cloth.",
    image: "/HomePage/creativeStyle/next-styles-images/naga-body-cloth.avif",
    tag: "Textile",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "gondpainting",
    name: "Madhya Pradesh",
    title: "GOND PAINTING",
    desc: "A traditional art form where living beings are created through rhythmic dots and lines, expressing nature, mythology, and inner life.",
    image: "/HomePage/creativeStyle/next-styles-images/gond-painting.avif",
    tag: "Art",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "hardornament",
    name: "Nagaland",
    title: "HARD ORNAMENT",
    desc: "A body-extension system where rigid encircling forms define limb zones and reinforce the human silhouette.",
    image: "/HomePage/creativeStyle/next-styles-images/hard-ornament.avif",
    tag: "Art",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "himroo",
    name: "Maharashtra",
    title: "HIMROO",
    desc: "A courtly weaving tradition from Aurangabad featuring intricate silk and cotton patterns rooted in Deccani heritage.",
    image: "/HomePage/creativeStyle/next-styles-images/himroo.avif",
    tag: "Textile",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "hmaram",
    name: "Mizoram",
    title: "HMARAM",
    desc: "A distinctive Mizo textile defined by indigo-white contrast and precise triangular motifs woven on back-strap looms.",
    image: "/HomePage/creativeStyle/next-styles-images/hmaram.avif",
    tag: "Textile",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "hoysalarelief",
    name: "Karnataka",
    title: "HOYSALA RELIEF",
    desc: "An architectural sculpture tradition featuring dense, multi-tiered soapstone carvings and star-shaped structural plans.",
    image: "/HomePage/creativeStyle/next-styles-images/hoysala-relief.avif",
    tag: "Art",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "jaintiatextile",
    name: "Meghalaya",
    title: "JAINTIA TEXTILE",
    desc: "A complex weaving tradition defined by field-and-zone order, checkered patterns, and ritual shawl hierarchies.",
    image: "/HomePage/creativeStyle/next-styles-images/jaintia-textile.avif",
    tag: "Textile",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "jhabuadolls",
    name: "Madhya Pradesh",
    title: "JHABUA DOLLS",
    desc: "Handcrafted stuffed-cloth dolls that record tribal life through painted features and miniature ritual ornaments.",
    image: "/HomePage/creativeStyle/next-styles-images/jhabua-dolls.avif",
    tag: "Art",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "maheshwari",
    name: "Madhya Pradesh",
    title: "MAHESHWARI",
    desc: "A lightweight handloom textile defined by body–border–pallu hierarchy, refined weave, and graceful drape.",
    image: "/HomePage/creativeStyle/next-styles-images/maheshwari.avif",
    tag: "Textile",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "mashruweaving",
    name: "Gujarat",
    title: "MASHRU WEAVING",
    desc: "A traditional silk-cotton textile where warp-faced weaving creates vibrant stripes and a soft luminous surface.",
    image: "/HomePage/creativeStyle/next-styles-images/mashru-weaving.avif",
    tag: "Textile",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "moirangphee",
    name: "Manipur",
    title: "MOIRANG PHEE",
    desc: "A traditional textile where the Moirang Pheejin border motif is woven through extra-weft technique, defining the identity of the cloth.",
    image: "/HomePage/creativeStyle/next-styles-images/moirang-phee.avif",
    tag: "Textile",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "motibharat",
    name: "Gujarat",
    title: "MOTI BHARAT",
    desc: "A traditional beadwork craft where surfaces are built through dense bead placement, forming contour, color, and texture.",
    image: "/HomePage/creativeStyle/next-styles-images/moti-bharat.avif",
    tag: "Craft",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "mysorepainting",
    name: "Karnataka",
    title: "MYSORE PAINTING",
    desc: "A courtly painting tradition known for its delicate gesso work, gold foil application, and refined iconographic detail.",
    image: "/HomePage/creativeStyle/next-styles-images/mysore-painting.avif",
    tag: "Art",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "rosewoodinlay",
    name: "Karnataka",
    title: "ROSEWOOD INLAY",
    desc: "A meticulous woodwork craft where intricate patterns of ivory, bone, or contrasting wood are embedded into rosewood surfaces.",
    image: "/HomePage/creativeStyle/next-styles-images/rosewood-inlay.avif",
    tag: "Woodwork",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "nagashawlordinary",
    name: "Nagaland",
    title: "NAGA SHAWL (ORDINARY)",
    desc: "A community-specific handwoven textile defined by bold stripe patterns and extra-weft motifs that encode ancestral lineage.",
    image: "/HomePage/creativeStyle/next-styles-images/naga-shawl-ordinary.avif",
    tag: "Textile",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "ngotekherh",
    name: "Mizoram",
    title: "NGOTEKHERH",
    desc: "A traditional handwoven textile known for its distinctive warp-stripe structure and rhythmic extra-weft patterns.",
    image: "/HomePage/creativeStyle/next-styles-images/ngotekherh.avif",
    tag: "Textile",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "nironalacquer",
    name: "Gujarat (Kutch)",
    title: "NIRONA LACQUER",
    desc: "A traditional lac-turned woodcraft where vibrant natural colors are built into smooth, durable, and lustrous surfaces.",
    image: "/HomePage/creativeStyle/next-styles-images/nirona-lacquer.avif",
    tag: "Woodcraft",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "opaquewrap",
    name: "Mizoram",
    title: "OPAQUE WRAP",
    desc: "A traditional textile system where body-wrapped garments are defined by dense weave and bold symbolic motifs.",
    image: "/HomePage/creativeStyle/next-styles-images/opaque-wrap.avif",
    tag: "Textile",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "tawlhlohpuan-ceremonial",
    name: "Mizoram",
    title: "TAWLHLOHPUAN",
    desc: "A ceremonial handwoven textile known for its bold extra-weft motifs and high-prestige status in Mizo tradition.",
    image: "/HomePage/creativeStyle/next-styles-images/tawlhlohpuan.avif",
    tag: "Textile",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "woodcarving",
    name: "Uttar Pradesh",
    title: "WOOD CARVING",
    desc: "A traditional woodwork craft known for its deep relief carving, geometric patterns, and fine handcrafted detail.",
    image: "/HomePage/creativeStyle/next-styles-images/wood-carving.avif",
    tag: "Woodwork",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "wroughtiron",
    name: "Chhattisgarh",
    title: "WROUGHT IRON",
    desc: "A traditional hand-forged metalcraft where raw iron is shaped into ritual and symbolic forms.",
    image: "/HomePage/creativeStyle/next-styles-images/wrought-iron.avif",
    tag: "Metalcraft",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "yakshagana",
    name: "Karnataka",
    title: "YAKSHAGANA",
    desc: "A traditional theatre art known for its bold headgear, vibrant costumes, and expressive makeup.",
    image: "/HomePage/creativeStyle/next-styles-images/yakshagana.avif",
    tag: "Art/Theatre",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "baghembroidery",
    name: "Punjab",
    title: "BAGH EMBROIDERY",
    desc: "A dense embroidered textile tradition where silk-thread stitches fully saturate the cloth, creating luminous patterned fields.",
    image: "/HomePage/creativeStyle/third-images/bagh-embroidery.avif",
    tag: "Textile",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "bagruprint",
    name: "Rajasthan",
    title: "BAGRU PRINT",
    desc: "A traditional block-print textile defined by natural dyes, rhythmic repetition, and cloth-based design logic.",
    image: "/HomePage/creativeStyle/third-images/bagru-print.avif",
    tag: "Textile",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "bandhej",
    name: "Rajasthan",
    title: "BANDHEJ",
    desc: "A resist tie-dye textile where tied points create vibrant dot patterns through controlled dye absorption.",
    image: "/HomePage/creativeStyle/third-images/bandhej.avif",
    tag: "Textile",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "berhampurpatta",
    name: "Odisha",
    title: "BERHAMPUR PATTA",
    desc: "A heritage silk weaving tradition defined by vibrant color blocks and refined temple-border motifs.",
    image: "/HomePage/creativeStyle/third-images/berhampur-patta.avif",
    tag: "Textile",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "bomkai",
    name: "Odisha",
    title: "BOMKAI",
    desc: "A handloom textile where supplementary-weft motifs create symbolic narratives within a structured border-field composition.",
    image: "/HomePage/creativeStyle/third-images/bomkai.avif",
    tag: "Textile",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "buddhistmask",
    name: "Sikkim",
    title: "BUDDHIST MASK",
    desc: "A ritual craft where wooden or clay masks are sculpted with bold symbolic expressions for sacred performances.",
    image: "/HomePage/creativeStyle/third-images/buddhist-mask.avif",
    tag: "Mask",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "sikkimcarpet",
    name: "Sikkim",
    title: "SIKKIM CARPET",
    desc: "A traditional hand-knotted wool craft where dense pile surfaces are built with symbolic geometric and floral motifs.",
    image: "/HomePage/creativeStyle/third-images/sikkim-carpet.avif",
    tag: "Craft",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "durrie",
    name: "Punjab",
    title: "DURRIE",
    desc: "A flat-woven textile tradition defined by geometric clarity, durable cotton or wool structures, and rhythmic patterns.",
    image: "/HomePage/creativeStyle/third-images/durrie.avif",
    tag: "Textile",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "thangka-folk",
    name: "Sikkim",
    title: "THANGKA",
    desc: "A sacred Buddhist painting tradition on cotton or silk, representing a structured cosmic diagram with central hierarchy and symbolic geometry.",
    image: "/HomePage/creativeStyle/third-images/thangka.avif",
    tag: "Sacred",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "punjabjutti",
    name: "Punjab",
    title: "PUNJAB JUTTI",
    desc: "A traditional leather footwear craft where surfaces are built through dense embroidery, forming contour, color, and texture.",
    image: "/HomePage/creativeStyle/third-images/punjab-jutti.avif",
    tag: "Craft",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "kathputli",
    name: "Rajasthan",
    title: "KATHPUTLI",
    desc: "A traditional string puppet craft from Rajasthan, featuring carved wooden heads and vibrant textile-based character design.",
    image: "/HomePage/creativeStyle/third-images/kathputli.avif",
    tag: "Puppetry",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "khaddar",
    name: "Punjab",
    title: "KHADDAR",
    desc: "A traditional hand-spun and hand-woven textile defined by its coarse texture, breathability, and rustic material integrity.",
    image: "/HomePage/creativeStyle/third-images/khaddar.avif",
    tag: "Textile",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "khandua",
    name: "Odisha",
    title: "KHANDUA",
    desc: "A ritual ikat silk textile from Odisha, featuring extra-weft temple borders and symbolic motifs woven into a structured field.",
    image: "/HomePage/creativeStyle/third-images/khandua.avif",
    tag: "Textile",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "khes",
    name: "Punjab",
    title: "KHES",
    desc: "A traditional geometric cotton textile defined by its multi-layered weave, bold checkered patterns, and functional durability.",
    image: "/HomePage/creativeStyle/third-images/khes.avif",
    tag: "Textile",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "malerkotlazari",
    name: "Punjab",
    title: "MALERKOTLA ZARI",
    desc: "A specialized metallic embroidery tradition where gold and silver threads are used to create intricate, luminous surface designs.",
    image: "/HomePage/creativeStyle/third-images/malerkotla-zari.avif",
    tag: "Embroidery",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "molela",
    name: "Rajasthan",
    title: "MOLELA",
    desc: "A traditional terracotta craft where religious and social narratives are sculpted in relief on flat clay panels.",
    image: "/HomePage/creativeStyle/third-images/molela.avif",
    tag: "Craft",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "pichhwai",
    name: "Rajasthan",
    title: "PICHHWAI",
    desc: "A ritual textile painting tradition depicting Krishna narratives through large-scale, detailed compositions on cloth.",
    image: "/HomePage/creativeStyle/third-images/pichhwai.avif",
    tag: "Painting",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "pattachitra",
    name: "Odisha",
    title: "PATTACHITRA",
    desc: "A traditional scroll painting style from Odisha, known for its fine line work, mythological themes, and natural pigment colors.",
    image: "/HomePage/creativeStyle/third-images/pattachitra.avif",
    tag: "Painting",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "pipili",
    name: "Odisha",
    title: "PIPILI",
    desc: "A traditional appliqué craft from Odisha where colored fabric shapes are stitched onto a base cloth to create bold symbolic patterns.",
    image: "/HomePage/creativeStyle/third-images/pipili.avif",
    tag: "Craft",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "rajasthaniminiature",
    name: "Rajasthan",
    title: "RAJASTHANI MINIATURE",
    desc: "A court painting tradition known for its fine detail, vibrant colors, and refined narrative storytelling in miniature form.",
    image: "/HomePage/creativeStyle/third-images/rajasthani-miniature.avif",
    tag: "Painting",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "sambalpuribandha",
    name: "Odisha",
    title: "SAMBALPURI BANDHA",
    desc: "A complex ikat weaving tradition from Odisha where patterns are created through precision tie-dyeing of warp and weft threads.",
    image: "/HomePage/creativeStyle/third-images/sambalpuri-bandha.avif",
    tag: "Textile",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "sanganer",
    name: "Rajasthan",
    title: "SANGANER",
    desc: "A traditional block-print style from Rajasthan known for its fine floral patterns, light backgrounds, and delicate design logic.",
    image: "/HomePage/creativeStyle/third-images/sanganer.avif",
    tag: "Textile",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "ustaart",
    name: "Rajasthan",
    title: "USTA ART",
    desc: "A traditional craft system encompassing gold-leaf work (Usta), gold embossing (Thewa), and blue-on-white ceramic imagery (Blue Pottery).",
    image: "/HomePage/creativeStyle/third-images/usta-art.avif",
    tag: "Craft",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "pipiliapplique",
    name: "Odisha",
    title: "PIPILI APPLIQUÉ",
    desc: "A traditional appliqué craft from Odisha where colored fabric shapes are stitched onto a base cloth to create bold symbolic patterns.",
    image: "/HomePage/creativeStyle/third-images/pipili-appliqué.avif",
    tag: "Craft",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
  {
    id: "saura",
    name: "Odisha",
    title: "SAURA",
    desc: "A ritual wall painting tradition of the Saura tribe, featuring stick-figure motifs that record tribal life and mythology in a rhythmic field.",
    image: "/HomePage/creativeStyle/third-images/saura.avif",
    tag: "Art",
    titleColor: "#ffffff",
    href: "/text-to-image",
    imageFilter: "brightness(0.85) saturate(0.95)",
  },
];



type CreativeStyleProps = {
  onWarliOpen?: () => void;
  onAjrakhOpen?: () => void;
  onJhajjarOpen?: () => void;
  onKaaviOpen?: () => void;
  onKangraOpen?: () => void;
  onKarepaOpen?: () => void;
  onKhatwaOpen?: () => void;
  onKhovarOpen?: () => void;
  onKinnauriOpen?: () => void;
  onKosaOpen?: () => void;
  onKutchOpen?: () => void;
  onLippanOpen?: () => void;
  onMajuliOpen?: () => void;
  onManjushaOpen?: () => void;
  onMataNiPachediOpen?: () => void;
  onMadhubaniOpen?: () => void;
  onKyilKhorOpen?: () => void;
  onSherdukpenOpen?: () => void;
  onEtikoppakaOpen?: () => void;
  onKondapalliOpen?: () => void;
  onKalamkariOpen?: () => void;
  onSrikalahastiOpen?: () => void;
  onUppadaOpen?: () => void;
  onTholuOpen?: () => void;
  onThangkaOpen?: () => void;
  onWanchoOpen?: () => void;
  onMonpaOpen?: () => void;
  onHandmadePaperOpen?: () => void;
  onMonpaMaskOpen?: () => void;
  onIduMishmiOpen?: () => void;
  onAsharikandiOpen?: () => void;
  onAzulejosOpen?: () => void;
  onBandhaniOpen?: () => void;
  onBastarDhokraOpen?: () => void;
  onMuriaWallPaintingOpen?: () => void;
  onBastarWoodcraftOpen?: () => void;
  onBhagalpurSilkOpen?: () => void;
  onChambaMiniatureOpen?: () => void;
  onExposedLateriteOpen?: () => void;
  onGharcholaOpen?: () => void;
  onGodnaArtOpen?: () => void;
  onTaiAhomManuscriptOpen?: () => void;
  onTangaliyaOpen?: () => void;
  onAgrarianIndustrialOpen?: () => void;
  onIndoPortugueseOpen?: () => void;
  onTikuliArtOpen?: () => void;
  onSohraiKhovarOpen?: () => void;
  onWoodTempleCarvingOpen?: () => void;
  onNeoAgrarianBrutalismOpen?: () => void;
  onPatolaOpen?: () => void;
  onPhulkariOpen?: () => void;
  onPithoraOpen?: () => void;
  onRoganArtOpen?: () => void;
  onRuralFiberCraftOpen?: () => void;
  onSarkandaArchitectureOpen?: () => void;
  onShimplaHastkalaOpen?: () => void;
  onSitalpatiOpen?: () => void;
  onSohraiOpen?: () => void;
  onSonowalTextileOpen?: () => void;
  onSufEmbroideryOpen?: () => void;
  onKatabAppliqueOpen?: () => void;
  onBaghPrintOpen?: () => void;
  onBambooCraftOpen?: () => void;
  onNagaBeadClusterOpen?: () => void;
  onBidriwareOpen?: () => void;
  onBorderSignTextileOpen?: () => void;
  onBundeliPaintingOpen?: () => void;
  onCeremonialEmblemOpen?: () => void;
  onChannapatnaToysOpen?: () => void;
  onCoirCraftOpen?: () => void;
  onBellMetalRitualsOpen?: () => void;
  onKasutiEmbroideryOpen?: () => void;
  onKeralaMuralOpen?: () => void;
  onKhambhatAgateOpen?: () => void;
  onKinhalCraftOpen?: () => void;
  onKolhapurJewelleryOpen?: () => void;
  onKolhapuriChappalOpen?: () => void;
  onKolhapuriSaajOpen?: () => void;
  onLambaniEmbroideryOpen?: () => void;
  onLeatherToysOpen?: () => void;
  onPaithaniOpen?: () => void;
  onPawndumOpen?: () => void;
  onPoshinaTerracottaOpen?: () => void;
  onPrestigePendantsOpen?: () => void;
  onPuancheiOpen?: () => void;
  onPuanlaisenOpen?: () => void;
  onSandalwoodCarvingOpen?: () => void;
  onSankhedaWoodworkOpen?: () => void;
  onGanjifaSawantwadiOpen?: () => void;
  onSawantwadiWoodcraftOpen?: () => void;
  onShapheeLanpheeOpen?: () => void;
  onSheerFieldClothOpen?: () => void;
  onBodyAugmentationOpen?: () => void;
  onTawlhlophuanMizoramOpen?: () => void;
  onTempleMuralOpen?: () => void;
  onTogaluGombeyaataOpen?: () => void;
  onNagaShawlOpen?: () => void;
  onWangkheiPheeOpen?: () => void;
  onMeritShawlOpen?: () => void;
  onGanjifaMysoreOpen?: () => void;
  onGaroWeavingOpen?: () => void;
  onNagaBodyClothOpen?: () => void;
  onGondPaintingOpen?: () => void;
  onHardOrnamentOpen?: () => void;
  onHimrooOpen?: () => void;
  onHmaramOpen?: () => void;
  onHoysalaReliefOpen?: () => void;
  onJaintiaTextileOpen?: () => void;
  onJhabuaDollsOpen?: () => void;
  onMaheshwariOpen?: () => void;
  onMashruWeavingOpen?: () => void;
  onMoirangPheeOpen?: () => void;
  onMotiBharatOpen?: () => void;
  onMysorePaintingOpen?: () => void;
  onRosewoodInlayOpen?: () => void;
  onNagaShawlOrdinaryOpen?: () => void;
  onNgotekherhOpen?: () => void;
  onNironaLacquerOpen?: () => void;
  onOpaqueWrapOpen?: () => void;
  onTawlhlohpuanCeremonialOpen?: () => void;
  onWoodCarvingOpen?: () => void;
  onWroughtIronOpen?: () => void;
  onYakshaganaOpen?: () => void;
  onBaghEmbroideryOpen?: () => void;
  onBagruPrintOpen?: () => void;
  onBandhejOpen?: () => void;
  onBerhampurPattaOpen?: () => void;
  onBomkaiOpen?: () => void;
  onBuddhistMaskOpen?: () => void;
  onSikkimCarpetOpen?: () => void;
  onDurrieOpen?: () => void;
  onThangkaFolkOpen?: () => void;
  onPunjabJuttiOpen?: () => void;
  onKathputliOpen?: () => void;
  onKhaddarOpen?: () => void;
  onKhanduaOpen?: () => void;
  onKhesOpen?: () => void;
  onMalerkotlaZariOpen?: () => void;
  onMolelaOpen?: () => void;
  onPichhwaiOpen?: () => void;
  onPattachitraOpen?: () => void;
  onPipiliOpen?: () => void;
  onRajasthaniMiniatureOpen?: () => void;
  onSambalpuriBandhaOpen?: () => void;
  onSanganerOpen?: () => void;
  onUstaArtOpen?: () => void;
  onPipiliAppliqueOpen?: () => void;
  onSauraOpen?: () => void;
  onAllStylesOpen?: () => void;
};

export default function CreativeStyle({
  onWarliOpen,
  onAjrakhOpen,
  onJhajjarOpen,
  onKaaviOpen,
  onKangraOpen,
  onKarepaOpen,
  onKhatwaOpen,
  onKhovarOpen,
  onKinnauriOpen,
  onKosaOpen,
  onKutchOpen,
  onLippanOpen,
  onMajuliOpen,
  onManjushaOpen,
  onMataNiPachediOpen,
  onMadhubaniOpen,
  onKyilKhorOpen,
  onSherdukpenOpen,
  onEtikoppakaOpen,
  onKondapalliOpen,
  onKalamkariOpen,
  onSrikalahastiOpen,
  onUppadaOpen,
  onTholuOpen,
  onThangkaOpen,
  onWanchoOpen,
  onMonpaOpen,
  onHandmadePaperOpen,
  onMonpaMaskOpen,
  onIduMishmiOpen,
  onAsharikandiOpen,
  onAzulejosOpen,
  onBandhaniOpen,
  onBastarDhokraOpen,
  onMuriaWallPaintingOpen,
  onBastarWoodcraftOpen,
  onBhagalpurSilkOpen,
  onChambaMiniatureOpen,
  onExposedLateriteOpen,
  onGharcholaOpen,
  onGodnaArtOpen,
  onTaiAhomManuscriptOpen,
  onTangaliyaOpen,
  onAgrarianIndustrialOpen,
  onIndoPortugueseOpen,
  onTikuliArtOpen,
  onSohraiKhovarOpen,
  onWoodTempleCarvingOpen,
  onNeoAgrarianBrutalismOpen,
  onPatolaOpen,
  onPhulkariOpen,
  onPithoraOpen,
  onRoganArtOpen,
  onRuralFiberCraftOpen,
  onSarkandaArchitectureOpen,
  onShimplaHastkalaOpen,
  onSitalpatiOpen,
  onSohraiOpen,
  onSonowalTextileOpen,
  onSufEmbroideryOpen,
  onKatabAppliqueOpen,
  onBaghPrintOpen,
  onBambooCraftOpen,
  onNagaBeadClusterOpen,
  onBidriwareOpen,
  onBorderSignTextileOpen,
  onBundeliPaintingOpen,
  onCeremonialEmblemOpen,
  onChannapatnaToysOpen,
  onCoirCraftOpen,
  onBellMetalRitualsOpen,
  onKasutiEmbroideryOpen,
  onKeralaMuralOpen,
  onKhambhatAgateOpen,
  onKinhalCraftOpen,
  onKolhapurJewelleryOpen,
  onKolhapuriChappalOpen,
  onKolhapuriSaajOpen,
  onLambaniEmbroideryOpen,
  onLeatherToysOpen,
  onPaithaniOpen,
  onPawndumOpen,
  onPoshinaTerracottaOpen,
  onPrestigePendantsOpen,
  onPuancheiOpen,
  onPuanlaisenOpen,
  onSandalwoodCarvingOpen,
  onSankhedaWoodworkOpen,
  onGanjifaSawantwadiOpen,
  onSawantwadiWoodcraftOpen,
  onShapheeLanpheeOpen,
  onSheerFieldClothOpen,
  onBodyAugmentationOpen,
  onTawlhlophuanMizoramOpen,
  onTempleMuralOpen,
  onTogaluGombeyaataOpen,
  onNagaShawlOpen,
  onWangkheiPheeOpen,
  onMeritShawlOpen,
  onGanjifaMysoreOpen,
  onGaroWeavingOpen,
  onNagaBodyClothOpen,
  onGondPaintingOpen,
  onHardOrnamentOpen,
  onHimrooOpen,
  onHmaramOpen,
  onHoysalaReliefOpen,
  onJaintiaTextileOpen,
  onJhabuaDollsOpen,
  onMaheshwariOpen,
  onMashruWeavingOpen,
  onMoirangPheeOpen,
  onMotiBharatOpen,
  onMysorePaintingOpen,
  onRosewoodInlayOpen,
  onNagaShawlOrdinaryOpen,
  onNgotekherhOpen,
  onNironaLacquerOpen,
  onOpaqueWrapOpen,
  onTawlhlohpuanCeremonialOpen,
  onWoodCarvingOpen,
  onWroughtIronOpen,
  onYakshaganaOpen,
  onBaghEmbroideryOpen,
  onBagruPrintOpen,
  onBandhejOpen,
  onBerhampurPattaOpen,
  onBomkaiOpen,
  onBuddhistMaskOpen,
  onSikkimCarpetOpen,
  onDurrieOpen,
  onThangkaFolkOpen,
  onPunjabJuttiOpen,
  onKathputliOpen,
  onKhaddarOpen,
  onKhanduaOpen,
  onKhesOpen,
  onMalerkotlaZariOpen,
  onMolelaOpen,
  onPichhwaiOpen,
  onPattachitraOpen,
  onPipiliOpen,
  onRajasthaniMiniatureOpen,
  onSambalpuriBandhaOpen,
  onSanganerOpen,
  onUstaArtOpen,
  onPipiliAppliqueOpen,
  onSauraOpen,
  onAllStylesOpen,
}: CreativeStyleProps) {
  const railRef = useRef<HTMLDivElement | null>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const handleStyleClick = (event: MouseEvent<HTMLAnchorElement>, style: StyleItem) => {
    const t = style.title.toLowerCase();
    if (t === "warli" && onWarliOpen) {
      event.preventDefault();
      onWarliOpen();
      return;
    }
    if (style.id === "ajrakh" && onAjrakhOpen) {
      event.preventDefault();
      onAjrakhOpen();
      return;
    }
    if (style.id === "jhajjar" && onJhajjarOpen) {
      event.preventDefault();
      onJhajjarOpen();
      return;
    }
    if (style.id === "kaavi" && onKaaviOpen) {
      event.preventDefault();
      onKaaviOpen();
      return;
    }
    if (style.id === "kangra" && onKangraOpen) {
      event.preventDefault();
      onKangraOpen();
      return;
    }
    if (style.id === "karepa" && onKarepaOpen) {
      event.preventDefault();
      onKarepaOpen();
      return;
    }
    if (style.id === "khatwa" && onKhatwaOpen) {
      event.preventDefault();
      onKhatwaOpen();
      return;
    }
    if (style.id === "khovar" && onKhovarOpen) {
      event.preventDefault();
      onKhovarOpen();
      return;
    }
    if (style.id === "kinnauri" && onKinnauriOpen) {
      event.preventDefault();
      onKinnauriOpen();
      return;
    }
    if (style.id === "kosa" && onKosaOpen) {
      event.preventDefault();
      onKosaOpen();
      return;
    }
    if (style.id === "kutch" && onKutchOpen) {
      event.preventDefault();
      onKutchOpen();
      return;
    }
    if (style.id === "lippan" && onLippanOpen) {
      event.preventDefault();
      onLippanOpen();
      return;
    }
    if (style.id === "majuli" && onMajuliOpen) {
      event.preventDefault();
      onMajuliOpen();
      return;
    }
    if (style.id === "manjusha" && onManjushaOpen) {
      event.preventDefault();
      onManjushaOpen();
      return;
    }
    if (style.id === "matanipachedi" && onMataNiPachediOpen) {
      event.preventDefault();
      onMataNiPachediOpen();
      return;
    }
    if (style.id === "madhubani" && onMadhubaniOpen) {
      event.preventDefault();
      onMadhubaniOpen();
      return;
    }
    if (style.id === "kyilkhor" && onKyilKhorOpen) {
      event.preventDefault();
      onKyilKhorOpen();
      return;
    }
    if (style.id === "sherdukpen" && onSherdukpenOpen) {
      event.preventDefault();
      onSherdukpenOpen();
      return;
    }
    if (style.id === "etikoppaka" && onEtikoppakaOpen) {
      event.preventDefault();
      onEtikoppakaOpen();
      return;
    }
    if (style.id === "kondapalli" && onKondapalliOpen) {
      event.preventDefault();
      onKondapalliOpen();
      return;
    }
    if (style.id === "monpamask" && onMonpaMaskOpen) {
      event.preventDefault();
      onMonpaMaskOpen();
      return;
    }
    if (style.id === "handmadepaper" && onHandmadePaperOpen) {
      event.preventDefault();
      onHandmadePaperOpen();
      return;
    }
    if (style.id === "monpa" && onMonpaOpen) {
      event.preventDefault();
      onMonpaOpen();
      return;
    }
    if (style.id === "wancho" && onWanchoOpen) {
      event.preventDefault();
      onWanchoOpen();
      return;
    }
    if (style.id === "thangka" && onThangkaOpen) {
      event.preventDefault();
      onThangkaOpen();
      return;
    }
    if (style.id === "tholu" && onTholuOpen) {
      event.preventDefault();
      onTholuOpen();
      return;
    }
    if (style.id === "uppadajamdani" && onUppadaOpen) {
      event.preventDefault();
      onUppadaOpen();
      return;
    }
    if (style.id === "machilipatnam" && onKalamkariOpen) {
      event.preventDefault();
      onKalamkariOpen();
      return;
    }
    if (style.id === "srikalahasti" && onSrikalahastiOpen) {
      event.preventDefault();
      onSrikalahastiOpen();
      return;
    }
    if (style.id === "idumishmi" && onIduMishmiOpen) {
      event.preventDefault();
      onIduMishmiOpen();
      return;
    }
    if (style.id === "asharikandi" && onAsharikandiOpen) {
      event.preventDefault();
      onAsharikandiOpen();
      return;
    }
    if (style.id === "azulejos" && onAzulejosOpen) {
      event.preventDefault();
      onAzulejosOpen();
      return;
    }
    if (style.id === "bandhani" && onBandhaniOpen) {
      event.preventDefault();
      onBandhaniOpen();
      return;
    }
    if (style.id === "bastardhokra" && onBastarDhokraOpen) {
      event.preventDefault();
      onBastarDhokraOpen();
      return;
    }
    if (style.id === "muriawallpainting" && onMuriaWallPaintingOpen) {
      event.preventDefault();
      onMuriaWallPaintingOpen();
      return;
    }
    if (style.id === "bastarwoodcraft" && onBastarWoodcraftOpen) {
      event.preventDefault();
      onBastarWoodcraftOpen();
      return;
    }
    if (style.id === "bhagalpursilk" && onBhagalpurSilkOpen) {
      event.preventDefault();
      onBhagalpurSilkOpen();
      return;
    }
    if (style.id === "chambaminiature" && onChambaMiniatureOpen) {
      event.preventDefault();
      onChambaMiniatureOpen();
      return;
    }
    if (style.id === "exposedlaterite" && onExposedLateriteOpen) {
      event.preventDefault();
      onExposedLateriteOpen();
      return;
    }
    if (style.id === "gharchola" && onGharcholaOpen) {
      event.preventDefault();
      onGharcholaOpen();
      return;
    }
    if (style.id === "godnaart" && onGodnaArtOpen) {
      event.preventDefault();
      onGodnaArtOpen();
      return;
    }
    if (style.id === "taiahommanuscript" && onTaiAhomManuscriptOpen) {
      event.preventDefault();
      onTaiAhomManuscriptOpen();
      return;
    }
    if (style.id === "tangaliya" && onTangaliyaOpen) {
      event.preventDefault();
      onTangaliyaOpen();
      return;
    }
    if (style.id === "agrarianindustrial" && onAgrarianIndustrialOpen) {
      event.preventDefault();
      onAgrarianIndustrialOpen();
      return;
    }
    if (style.id === "indoportuguese" && onIndoPortugueseOpen) {
      event.preventDefault();
      onIndoPortugueseOpen();
      return;
    }
    if (style.id === "tikuliart" && onTikuliArtOpen) {
      event.preventDefault();
      onTikuliArtOpen();
      return;
    }
    if (style.id === "sohraikhovar" && onSohraiKhovarOpen) {
      event.preventDefault();
      onSohraiKhovarOpen();
      return;
    }
    if (style.id === "woodtemplecarving" && onWoodTempleCarvingOpen) {
      event.preventDefault();
      onWoodTempleCarvingOpen();
      return;
    }
    if (style.id === "neoagrarianbrutalism" && onNeoAgrarianBrutalismOpen) {
      event.preventDefault();
      onNeoAgrarianBrutalismOpen();
      return;
    }
    if (style.id === "patola" && onPatolaOpen) {
      event.preventDefault();
      onPatolaOpen();
      return;
    }
    if (style.id === "phulkari" && onPhulkariOpen) {
      event.preventDefault();
      onPhulkariOpen();
      return;
    }
    if (style.id === "pithora" && onPithoraOpen) {
      event.preventDefault();
      onPithoraOpen();
      return;
    }
    if (style.id === "roganart" && onRoganArtOpen) {
      event.preventDefault();
      onRoganArtOpen();
      return;
    }
    if (style.id === "baghembroidery" && onBaghEmbroideryOpen) {
      event.preventDefault();
      onBaghEmbroideryOpen();
      return;
    }
    if (style.id === "bagruprint" && onBagruPrintOpen) {
      event.preventDefault();
      onBagruPrintOpen();
      return;
    }
    if (style.id === "bandhej" && onBandhejOpen) {
      event.preventDefault();
      onBandhejOpen();
      return;
    }
    if (style.id === "berhampurpatta" && onBerhampurPattaOpen) {
      event.preventDefault();
      onBerhampurPattaOpen();
      return;
    }
    if (style.id === "bomkai" && onBomkaiOpen) {
      event.preventDefault();
      onBomkaiOpen();
      return;
    }
    if (style.id === "buddhistmask" && onBuddhistMaskOpen) {
      event.preventDefault();
      onBuddhistMaskOpen();
      return;
    }
    if (style.id === "sikkimcarpet" && onSikkimCarpetOpen) {
      event.preventDefault();
      onSikkimCarpetOpen();
      return;
    }
    if (style.id === "durrie" && onDurrieOpen) {
      event.preventDefault();
      onDurrieOpen();
      return;
    }
    if (style.id === "thangka" && onThangkaFolkOpen) {
      event.preventDefault();
      onThangkaFolkOpen();
      return;
    }
    if (style.id === "punjabjutti" && onPunjabJuttiOpen) {
      event.preventDefault();
      onPunjabJuttiOpen();
      return;
    }
    if (style.id === "kathputli" && onKathputliOpen) {
      event.preventDefault();
      onKathputliOpen();
      return;
    }
    if (style.id === "khaddar" && onKhaddarOpen) {
      event.preventDefault();
      onKhaddarOpen();
      return;
    }
    if (style.id === "khandua" && onKhanduaOpen) {
      event.preventDefault();
      onKhanduaOpen();
      return;
    }
    if (style.id === "khes" && onKhesOpen) {
      event.preventDefault();
      onKhesOpen();
      return;
    }
    if (style.id === "malerkotlazari" && onMalerkotlaZariOpen) {
      event.preventDefault();
      onMalerkotlaZariOpen();
      return;
    }
    if (style.id === "molela" && onMolelaOpen) {
      event.preventDefault();
      onMolelaOpen();
      return;
    }
    if (style.id === "pichhwai" && onPichhwaiOpen) {
      event.preventDefault();
      onPichhwaiOpen();
      return;
    }
    if (style.id === "pattachitra" && onPattachitraOpen) {
      event.preventDefault();
      onPattachitraOpen();
      return;
    }
    if (style.id === "pipili" && onPipiliOpen) {
      event.preventDefault();
      onPipiliOpen();
      return;
    }
    if (style.id === "rajasthaniminiature" && onRajasthaniMiniatureOpen) {
      event.preventDefault();
      onRajasthaniMiniatureOpen();
      return;
    }
    if (style.id === "sambalpuribandha" && onSambalpuriBandhaOpen) {
      event.preventDefault();
      onSambalpuriBandhaOpen();
      return;
    }
    if (style.id === "sanganer" && onSanganerOpen) {
      event.preventDefault();
      onSanganerOpen();
      return;
    }
    if (style.id === "ustaart" && onUstaArtOpen) {
      event.preventDefault();
      onUstaArtOpen();
      return;
    }
    if (style.id === "pipiliapplique" && onPipiliAppliqueOpen) {
      event.preventDefault();
      onPipiliAppliqueOpen();
      return;
    }
    if (style.id === "saura" && onSauraOpen) {
      event.preventDefault();
      onSauraOpen();
      return;
    }
    if (style.id === "ruralfibercraft" && onRuralFiberCraftOpen) {
      event.preventDefault();
      onRuralFiberCraftOpen();
      return;
    }
    if (style.id === "sarkandaarchitecture" && onSarkandaArchitectureOpen) {
      event.preventDefault();
      onSarkandaArchitectureOpen();
      return;
    }
    if (style.id === "shimplahastkala" && onShimplaHastkalaOpen) {
      event.preventDefault();
      onShimplaHastkalaOpen();
      return;
    }
    if (style.id === "sitalpati" && onSitalpatiOpen) {
      event.preventDefault();
      onSitalpatiOpen();
      return;
    }
    if (style.id === "sohrai" && onSohraiOpen) {
      event.preventDefault();
      onSohraiOpen();
      return;
    }
    if (style.id === "sonowaltextile" && onSonowalTextileOpen) {
      event.preventDefault();
      onSonowalTextileOpen();
      return;
    }
    if (style.id === "sufembroidery" && onSufEmbroideryOpen) {
      event.preventDefault();
      onSufEmbroideryOpen();
      return;
    }
    if (style.id === "katabapplique" && onKatabAppliqueOpen) {
      event.preventDefault();
      onKatabAppliqueOpen();
      return;
    }
    if (style.id === "baghprint" && onBaghPrintOpen) {
      event.preventDefault();
      onBaghPrintOpen();
      return;
    }
    if (style.id === "bamboocraft" && onBambooCraftOpen) {
      event.preventDefault();
      onBambooCraftOpen();
      return;
    }
    if (style.id === "nagabeadcluster" && onNagaBeadClusterOpen) {
      event.preventDefault();
      onNagaBeadClusterOpen();
      return;
    }
    if (style.id === "bidriware" && onBidriwareOpen) {
      event.preventDefault();
      onBidriwareOpen();
      return;
    }
    if (style.id === "bordersigntextile" && onBorderSignTextileOpen) {
      event.preventDefault();
      onBorderSignTextileOpen();
      return;
    }
    if (style.id === "bundelipainting" && onBundeliPaintingOpen) {
      event.preventDefault();
      onBundeliPaintingOpen();
      return;
    }
    if (style.id === "ceremonialemblem" && onCeremonialEmblemOpen) {
      event.preventDefault();
      onCeremonialEmblemOpen();
      return;
    }
    if (style.id === "channapatnatoys" && onChannapatnaToysOpen) {
      event.preventDefault();
      onChannapatnaToysOpen();
      return;
    }
    if (style.id === "coircraft" && onCoirCraftOpen) {
      event.preventDefault();
      onCoirCraftOpen();
      return;
    }
    if (style.id === "bellmetalrituals" && onBellMetalRitualsOpen) {
      event.preventDefault();
      onBellMetalRitualsOpen();
      return;
    }
    if (style.id === "kasutiembroidery" && onKasutiEmbroideryOpen) {
      event.preventDefault();
      onKasutiEmbroideryOpen();
      return;
    }
    if (style.id === "keralamural" && onKeralaMuralOpen) {
      event.preventDefault();
      onKeralaMuralOpen();
      return;
    }
    if (style.id === "khambhatagate" && onKhambhatAgateOpen) {
      event.preventDefault();
      onKhambhatAgateOpen();
      return;
    }
    if (style.id === "kinhalcraft" && onKinhalCraftOpen) {
      event.preventDefault();
      onKinhalCraftOpen();
      return;
    }
    if (style.id === "kolhapurjewellery" && onKolhapurJewelleryOpen) {
      event.preventDefault();
      onKolhapurJewelleryOpen();
      return;
    }
    if (style.id === "kolhapurichappal" && onKolhapuriChappalOpen) {
      event.preventDefault();
      onKolhapuriChappalOpen();
      return;
    }
    if (style.id === "kolhapurisaaj" && onKolhapuriSaajOpen) {
      event.preventDefault();
      onKolhapuriSaajOpen();
      return;
    }
    if (style.id === "lambaniembroidery" && onLambaniEmbroideryOpen) {
      event.preventDefault();
      onLambaniEmbroideryOpen();
      return;
    }
    if (style.id === "leathertoys" && onLeatherToysOpen) {
      event.preventDefault();
      onLeatherToysOpen();
      return;
    }
    if (style.id === "paithani" && onPaithaniOpen) {
      event.preventDefault();
      onPaithaniOpen();
      return;
    }
    if (style.id === "pawndum" && onPawndumOpen) {
      event.preventDefault();
      onPawndumOpen();
      return;
    }
    if (style.id === "poshinaterracotta" && onPoshinaTerracottaOpen) {
      event.preventDefault();
      onPoshinaTerracottaOpen();
      return;
    }
    if (style.id === "prestigependants" && onPrestigePendantsOpen) {
      event.preventDefault();
      onPrestigePendantsOpen();
      return;
    }
    if (style.id === "puanchei" && onPuancheiOpen) {
      event.preventDefault();
      onPuancheiOpen();
      return;
    }
    if (style.id === "puanlaisen" && onPuanlaisenOpen) {
      event.preventDefault();
      onPuanlaisenOpen();
      return;
    }
    if (style.id === "sandalwoodcarving" && onSandalwoodCarvingOpen) {
      event.preventDefault();
      onSandalwoodCarvingOpen();
      return;
    }
    if (style.id === "sankhedawoodwork" && onSankhedaWoodworkOpen) {
      event.preventDefault();
      onSankhedaWoodworkOpen();
      return;
    }
    if (style.id === "ganjifa-sawantwadi" && onGanjifaSawantwadiOpen) {
      event.preventDefault();
      onGanjifaSawantwadiOpen();
      return;
    }
    if (style.id === "sawantwadiwoodcraft" && onSawantwadiWoodcraftOpen) {
      event.preventDefault();
      onSawantwadiWoodcraftOpen();
      return;
    }
    if (style.id === "shapheelanphee" && onShapheeLanpheeOpen) {
      event.preventDefault();
      onShapheeLanpheeOpen();
      return;
    }
    if (style.id === "sheerfieldcloth" && onSheerFieldClothOpen) {
      event.preventDefault();
      onSheerFieldClothOpen();
      return;
    }
    if (style.id === "bodyaugmentation" && onBodyAugmentationOpen) {
      event.preventDefault();
      onBodyAugmentationOpen();
      return;
    }
    if (style.id === "tawlhlohpuan" && onTawlhlophuanMizoramOpen) {
      event.preventDefault();
      onTawlhlophuanMizoramOpen();
      return;
    }
    if (style.id === "tawlhlohpuan-ceremonial" && onTawlhlohpuanCeremonialOpen) {
      event.preventDefault();
      onTawlhlohpuanCeremonialOpen();
      return;
    }
    if (style.id === "templemural" && onTempleMuralOpen) {
      event.preventDefault();
      onTempleMuralOpen();
      return;
    }
    if (style.id === "togalugombeyaata" && onTogaluGombeyaataOpen) {
      event.preventDefault();
      onTogaluGombeyaataOpen();
      return;
    }
    if (style.id === "nagashawl" && onNagaShawlOpen) {
      event.preventDefault();
      onNagaShawlOpen();
      return;
    }
    if (style.id === "wangkheiphee" && onWangkheiPheeOpen) {
      event.preventDefault();
      onWangkheiPheeOpen();
      return;
    }
    if (style.id === "meritshawl" && onMeritShawlOpen) {
      event.preventDefault();
      onMeritShawlOpen();
      return;
    }
    if (style.id === "ganjifa-mysore" && onGanjifaMysoreOpen) {
      event.preventDefault();
      onGanjifaMysoreOpen();
      return;
    }
    if (style.id === "garoweaving" && onGaroWeavingOpen) {
      event.preventDefault();
      onGaroWeavingOpen();
      return;
    }
    if (style.id === "nagabodycloth" && onNagaBodyClothOpen) {
      event.preventDefault();
      onNagaBodyClothOpen();
      return;
    }
    if (style.id === "gondpainting" && onGondPaintingOpen) {
      event.preventDefault();
      onGondPaintingOpen();
      return;
    }
    if (style.id === "hardornament" && onHardOrnamentOpen) {
      event.preventDefault();
      onHardOrnamentOpen();
      return;
    }
    if (style.id === "himroo" && onHimrooOpen) {
      event.preventDefault();
      onHimrooOpen();
      return;
    }
    if (style.id === "hmaram" && onHmaramOpen) {
      event.preventDefault();
      onHmaramOpen();
      return;
    }
    if (style.id === "hoysalarelief" && onHoysalaReliefOpen) {
      event.preventDefault();
      onHoysalaReliefOpen();
      return;
    }
    if (style.id === "jaintiatextile" && onJaintiaTextileOpen) {
      event.preventDefault();
      onJaintiaTextileOpen();
      return;
    }
    switch (style.id) {
      case "jhabuadolls":
        onJhabuaDollsOpen?.();
        break;
      case "maheshwari":
        onMaheshwariOpen?.();
        break;
      case "mashruweaving":
        onMashruWeavingOpen?.();
        break;
      case "moirangphee":
        onMoirangPheeOpen?.();
        break;
      case "motibharat":
        onMotiBharatOpen?.();
        break;
      case "mysorepainting":
        onMysorePaintingOpen?.();
        break;
      case "rosewoodinlay":
        onRosewoodInlayOpen?.();
        break;
      case "nagashawlordinary":
        onNagaShawlOrdinaryOpen?.();
        break;
      case "ngotekherh":
        onNgotekherhOpen?.();
        break;
      case "nironalacquer":
        onNironaLacquerOpen?.();
        break;
      case "opaquewrap":
        onOpaqueWrapOpen?.();
        break;
      case "tawlhlohpuan":
        onTawlhlophuanMizoramOpen?.();
        break;
      case "tawlhlohpuan-ceremonial":
        onTawlhlohpuanCeremonialOpen?.();
        break;
      case "woodcarving":
        onWoodCarvingOpen?.();
        break;
      case "wroughtiron":
        onWroughtIronOpen?.();
        break;
      case "yakshagana":
        onYakshaganaOpen?.();
        break;
    }
  };

  const scrollRight = () => {
    const el = railRef.current;
    if (!el) return;
    el.scrollBy({ left: Math.max(260, el.clientWidth * 0.8), behavior: "smooth" });
  };

  const scrollLeft = () => {
    const el = railRef.current;
    if (!el) return;
    el.scrollBy({ left: -Math.max(260, el.clientWidth * 0.8), behavior: "smooth" });
  };

  useEffect(() => {
    const el = railRef.current;
    if (!el) return;

    const updateArrows = () => {
      const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
      setShowLeftArrow(el.scrollLeft > 2);
      setShowRightArrow(el.scrollLeft < maxScroll - 2);
    };

    updateArrows();
    el.addEventListener("scroll", updateArrows, { passive: true });
    window.addEventListener("resize", updateArrows);

    return () => {
      el.removeEventListener("scroll", updateArrows);
      window.removeEventListener("resize", updateArrows);
    };
  }, []);

  return (
    <section className="bg-[#0E0E12] pb-4 pt-8 sm:pb-8 sm:pt-18 px-4 sm:px-6 lg:px-8">
      <div className="mb-4 flex items-end justify-between ">
        <div>
          <p className="mb-1 flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.16em] text-[#3B82F6]">
            <span className="inline-block h-[1.5px] w-4 bg-[#3B82F6]" />
            Styles
          </p>
          <h2
            className="text-[30px] uppercase leading-none tracking-[0.03em] text-white sm:text-[38px]"
            style={{ fontFamily: "var(--font-bebas-neue), 'Bebas Neue', sans-serif" }}
          >
            Explore Indian Styles
          </h2>
        </div>

        <button
          type="button"
          onClick={onAllStylesOpen}
          className="hidden items-center gap-1 rounded-full border border-white/10 px-4 py-2 text-[11px] font-semibold text-white/55 transition-colors hover:border-[#3B82F6]/40 hover:text-[#3B82F6] md:inline-flex"
        >
          <span>All styles</span>
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M2.5 6h7M6 2.5L9.5 6 6 9.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <div className="relative">
        <div
          ref={railRef}
          className="scrollbar-hide flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 sm:gap-4 sm:px-6 lg:px-16 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {STYLES.map((style, index) => (
            <Link
              key={`${style.id}-${index}`}
              href={style.href}
              onClick={(event) => handleStyleClick(event, style)}
              className="w-full md:w-[340px] shrink-0 snap-start"
            >
              <div className="mb-2 overflow-hidden rounded-xl border border-white/10 bg-[#18181f] sm:mb-3">
                <div className="group relative h-[190px] sm:h-[220px]">
                  <img
                    src={style.image}
                    alt={style.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    style={{ filter: style.imageFilter }}
                  />
                  <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,transparent_40%,rgba(0,0,0,0.72)_100%)]" />
                  <div className="absolute left-3 top-3 rounded-full border border-white/15 bg-black/45 px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.08em] text-white/80 backdrop-blur-[6px] sm:left-4 sm:top-4 sm:px-3 sm:text-[9px]">
                    {style.tag}
                  </div>
                  <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4">
                    <div
                      className="text-[30px] uppercase leading-none tracking-[0.06em] sm:text-[34px]"
                      style={{
                        color: style.titleColor,
                        fontFamily: "var(--font-bebas-neue), 'Bebas Neue', sans-serif",
                        textShadow: "0 2px 12px rgba(0,0,0,0.5)",
                      }}
                    >
                      {style.title}
                    </div>
                    <div className="mt-1 text-[11px] font-semibold tracking-wide text-white/85 sm:text-[12px]">
                      {style.name}
                    </div>
                    <div className="mt-1 max-w-[280px] text-[10px] leading-snug text-white/60 line-clamp-2 sm:max-w-[300px]">
                      {style.desc}
                    </div>
                  </div>
                </div>
              </div>
              <div className="sr-only">
                <div>{style.name}</div>
                <p>{style.desc}</p>
              </div>
            </Link>
          ))}
        </div>

        <button
          type="button"
          onClick={scrollLeft}
          disabled={!showLeftArrow}
          aria-label="Scroll styles left"
          className={`absolute left-2 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/55 text-white/85 backdrop-blur-md transition-all hover:border-white/20 hover:bg-black/75 active:scale-95 disabled:cursor-not-allowed md:flex lg:left-8 ${
            showLeftArrow ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          <svg width="16" height="16" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M8 2.5L4.5 6L8 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <button
          type="button"
          onClick={scrollRight}
          disabled={!showRightArrow}
          aria-label="Scroll styles right"
          className={`absolute right-2 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/55 text-white/85 backdrop-blur-md transition-all hover:border-white/20 hover:bg-black/75 active:scale-95 disabled:cursor-not-allowed md:flex lg:right-8 ${
            showRightArrow ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          <svg width="16" height="16" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M4 2.5L7.5 6L4 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </section>
  );
}
