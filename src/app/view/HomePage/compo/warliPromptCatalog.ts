export type WarliStyleType = "A" | "B" | "C";
export type WarliVariationKey = "template" | "variable" | "restyle";

export interface WarliPromptVariant {
  id: WarliVariationKey;
  label: string;
  shortLabel: string;
  description: string;
  prompt: string;
}

export interface WarliPromptFamily {
  id: WarliStyleType;
  title: string;
  summary: string;
  styleChip: string;
  benchmarkScene: string;
  variations: Record<WarliVariationKey, WarliPromptVariant>;
}

export const WARLI_PROMPT_FAMILIES: Record<WarliStyleType, WarliPromptFamily> = {
  A: {
    id: "A",
    title: "Traditional 2D mural",
    summary: "Authentic Maharashtrian Warli painting with white geometric figures on terracotta mud walls.",
    styleChip: "2D Mural",
    benchmarkScene:
      "A traditional Maharashtrian Warli tribal painting style, authentic Warli art from Maharashtra, white geometric stick figures made from triangles and circles, hand painted on earthy mud wall background, minimal tribal aesthetic, flat 2D composition, rhythmic folk patterns, simple symbolic forms, natural clay texture, handmade brush strokes. Scene: a Warli woman wearing a saree standing beside a bench, a small Warli girl holding a book standing next to her, a Warli man sitting on a bench, simple park environment with trees and walking path. All characters drawn as classic Warli tribal figures made of triangles and circles, bench, trees and environment also illustrated in Warli folk style. Flat composition, monochrome white on terracotta mud background, traditional Indian tribal art, clean minimal lines, balanced folk composition, highly detailed Warli mural.",
    variations: {
      template: {
        id: "template",
        label: "Template A",
        shortLabel: "Template",
        description: "Full style-locked conversion prompt for authentic flat Warli murals.",
        prompt: `Convert this image into an authentic traditional Maharashtrian Warli tribal painting mural.

STYLE LOCK:
authentic Warli folk art from Maharashtra, hand-painted mural on natural terracotta / red-ochre mud wall, monochrome white pigment painting, classic Warli visual language, all human figures constructed using simple geometric forms only: circle heads, triangle-based torsos, stick-like arms and legs, minimal symbolic anatomy, no realistic facial features, no realistic muscles, no volumetric rendering, no shading, no gradients, no 3D depth illusion, flat 2D tribal mural composition, rhythmic decorative folk patterns, handmade brushstroke imperfections, natural lime-paint feel, earthy wall texture visible underneath, balanced negative space, clear folk storytelling arrangement

FORM TRANSLATION RULE:
translate every person, object, prop, tree, plant, animal, building, furniture, and background element into authentic Warli symbolic drawing language; simplify forms into clean tribal geometry while preserving the core action, relation, pose, and scene meaning of the original image

COMPOSITION RULE:
preserve the main subject relationships and readable staging from the source image, but reinterpret the full scene as a hand-painted Warli wall mural; keep the composition flat, frontal or semi-symbolic, decorative, and visually balanced like a traditional folk narrative panel

SURFACE + COLOR RULE:
white painted forms only on earthy terracotta mud wall background, natural clay plaster texture, matte handmade surface, slightly uneven pigment edges, traditional mural finish

DETAIL RULE:
include Warli-style trees, plants, ground motifs, borders, pathways, domestic or environmental symbols, repeating folk marks, and rhythmic ornamental fillers only where compositionally appropriate, all in authentic Warli vocabulary

NEGATIVE LOCK:
no photorealism, no realistic anatomy, no cinematic lighting, no shadow rendering, no perspective-heavy depth, no modern illustration style, no glossy digital polish, no painterly western brushwork, no thick cartoon look, no color accents, no non-Warli ornament logic, no detailed face features, no realistic clothing folds, no high realism textures on figures

OUTPUT GOAL:
the final result must look like a genuine hand-painted Warli mural from Maharashtra, not a modern graphic imitation, not a vector poster, and not a generic tribal design`,
      },
      variable: {
        id: "variable",
        label: "Template A Reusable Variable",
        shortLabel: "Reusable Variable",
        description: "Reusable Warli mural prompt with subject and environment slots.",
        prompt: `Convert this image into an authentic traditional Maharashtrian Warli tribal painting mural.

Render [main subject / people / animals / objects / environment] in authentic Warli folk style from Maharashtra.

Use:
- white geometric stick figures made from circles, triangles, and simple lines
- flat 2D mural composition
- earthy terracotta mud wall background
- handmade white pigment painting
- minimal symbolic anatomy
- rhythmic folk pattern detailing
- natural clay wall texture
- traditional mural balance and storytelling clarity

Translate the source scene so that:
- [subject 1] becomes [Warli-translated role/action]
- [subject 2] becomes [Warli-translated role/action]
- [important object/prop] becomes simplified Warli symbolic form
- [environment] becomes Warli-style symbolic environment elements

Preserve:
- the basic action
- the relationship between subjects
- the spatial storytelling of the image

Keep everything in authentic Warli visual grammar:
no realism, no shading, no 3D modeling, no facial detail, no modern graphic design look, no extra colors, no cinematic depth, no western illustration influence

Final image should look like a real traditional Warli mural hand-painted in white on a mud wall.`,
      },
      restyle: {
        id: "restyle",
        label: "Template A Restyle",
        shortLabel: "Restyle",
        description: "Restyle an existing scene while preserving composition and Warli symbolism.",
        prompt: `Restyle this source image as an authentic traditional Maharashtrian Warli tribal mural.

Preserve the original scene's subject arrangement, pose logic, and action relationships, but translate every visible element into classic Warli folk painting language.

Use white geometric tribal figures made from circles, triangles, and simple lines, hand-painted on a terracotta mud wall. Simplify anatomy, clothing, props, furniture, plants, and environment into authentic Warli symbolic forms. Keep the composition flat, decorative, balanced, and mural-like.

Visible earthy clay wall texture, handmade lime-paint feel, minimal folk aesthetic, rhythmic ornament, traditional Maharashtrian tribal storytelling mural.

No photorealism, no cinematic lighting, no shading, no gradients, no 3D depth, no realistic faces, no glossy digital finish, no non-Warli stylization.`,
      },
    },
  },
  B: {
    id: "B",
    title: "Terracotta bas-relief",
    summary: "Warli-inspired sculpted relief with shallow cinematic depth and tactile clay surfaces.",
    styleChip: "Bas-Relief",
    benchmarkScene:
      "Create a premium fully volumetric 3D cinematic Indian style-test image of a simple locked benchmark scene: a middle-aged Indian man seated on a park bench, an Indian woman standing beside him, a school-age Indian girl holding a notebook slightly forward, and an elderly Indian man walking in the background of a small public park courtyard with trees, pathway, benches, and one distant tea cart. Morning light, same generic neutral benchmark scene, same camera logic for style testing. Now rebuild the entire image using Warli visual construction logic first, then translate it into premium 3D relief-like volume. Human figures must be designed through Warli-inspired geometric body grammar: simplified structural masses, triangular and tapered body relationships, reduced facial detail, strong silhouette clarity, rhythmic limb construction, communal grouping logic, and highly legible social arrangement. Trees, plants, benches, pathway, and park elements must be simplified into Warli-derived symbolic structural forms, with repeated rhythmic shape patterns and organized negative space. The scene must feel like a Warli mural world converted into shallow sculpted 3D relief, not a normal realistic park scene with Warli colors.",
    variations: {
      template: {
        id: "template",
        label: "Template B",
        shortLabel: "Template",
        description: "Locked Warli-derived sculpted bas-relief prompt with material and depth rules.",
        prompt: `Convert this image into a premium Warli-derived sculpted Indian bas-relief artwork.

STYLE LOCK:
authentic Warli-inspired visual construction logic from Maharashtra translated into premium shallow 3D relief sculpture, symbolic Indian folk geometry, simplified human anatomy built from circles, triangles, tapered masses, and clean structural limbs, reduced facial detail, highly legible silhouettes, communal grouping clarity, rhythmic spatial arrangement, Warli-derived symbolic environment design, repeated folk pattern logic, decorative border language, mural-like scene organization

MATERIAL LOCK:
terracotta clay / carved earthen relief surface, handmade sculpted wall-art feel, matte mineral surface, tactile clay texture, shallow bas-relief depth, slightly rounded carved edges, crafted artisanal finish, warm earthy material richness, subtle handcrafted imperfections

FORM TRANSLATION RULE:
translate every visible figure, object, prop, furniture element, tree, plant, pathway, animal, architecture, and background detail into Warli-derived symbolic relief form language; preserve the scene's core action, pose, relationship, and readable narrative structure, but simplify all visible forms into geometric folk construction with sculpted volume

DEPTH RULE:
the image must feel like a carved or molded wall relief, not a flat painting and not a full realistic 3D scene; use shallow layered depth, embossed surface logic, raised sculptural forms, and strong graphic separation between foreground motifs and background wall plane

LIGHTING RULE:
soft cinematic directional light across the relief surface, designed to reveal contour, carving depth, and tactile material form; lighting should support sculptural readability, not realism-heavy drama

COMPOSITION RULE:
preserve the main arrangement and social staging of the source image, but reinterpret it as a balanced Indian folk relief mural; maintain clear shape hierarchy, organized negative space, symbolic environment, and decorative visual rhythm

NEGATIVE LOCK:
no photorealism, no realistic anatomy, no detailed facial realism, no glossy modern 3D rendering, no plastic material look, no hyper-real park scene, no western sculpture style, no random ornament, no painterly brush texture, no flat vector look, no deep cinematic perspective realism, no modern game-art shading

OUTPUT GOAL:
the final result must look like a premium Indian Warli-inspired mural world transformed into shallow sculpted terracotta bas-relief, tactile, symbolic, rhythmic, cinematic, and handcrafted`,
      },
      variable: {
        id: "variable",
        label: "Template B Reusable Variable",
        shortLabel: "Reusable Variable",
        description: "Reusable bas-relief prompt with flexible subject, object, and environment slots.",
        prompt: `Convert this image into a Warli-derived premium 3D terracotta relief mural.

Render [main subjects / figures / objects / environment] using:
- Warli-inspired geometric human construction
- simplified symbolic anatomy
- rhythmic folk composition
- shallow sculpted bas-relief depth
- handcrafted terracotta clay material
- organized decorative environment forms
- tactile matte carved wall-art finish

Translate the source scene so that:
- [subject 1] becomes a Warli-derived sculpted relief figure
- [subject 2] becomes a simplified geometric relief figure
- [object/prop] becomes a symbolic folk relief form
- [environment] becomes a stylized Warli-inspired relief environment

Preserve:
- core action
- staging relationships
- readable scene meaning
- social grouping clarity

Style requirements:
Warli mural logic first, then convert into shallow volumetric clay bas-relief, with earthy handcrafted texture, symbolic reduction, repeated folk motifs, and cinematic sculptural readability

Avoid:
photorealism, realistic faces, glossy CGI, modern illustration look, western sculpture feel, deep realism, random decorative clutter, flat 2D vector finish`,
      },
      restyle: {
        id: "restyle",
        label: "Template B Restyle",
        shortLabel: "Restyle",
        description: "Restyle a source scene into a premium Warli-inspired sculpted terracotta mural.",
        prompt: `Restyle this source image as a premium Warli-derived Indian terracotta bas-relief mural.

Preserve the original scene's pose logic, main subject relationships, and narrative readability, but transform all visible elements into Warli-inspired symbolic sculptural form language. Human bodies should be simplified into geometric folk masses with reduced facial detail and strong silhouette clarity. Objects, furniture, plants, animals, and architecture should be translated into rhythmic, decorative, Warli-derived symbolic relief forms.

Use shallow embossed clay depth, matte terracotta material, handcrafted artisanal surface, organized mural composition, and cinematic directional light that reveals carved contour and tactile relief.

The final image must feel like a handcrafted Indian folk mural transformed into premium sculpted bas-relief wall art.

No photorealism, no glossy CGI, no realistic anatomy, no western sculpture influence, no flat vector poster finish.`,
      },
    },
  },
  C: {
    id: "C",
    title: "Full cinematic 3D world",
    summary: "Premium volumetric 3D scene using Warli intelligence without flattening into a mural.",
    styleChip: "3D World",
    benchmarkScene:
      "Create a premium fully volumetric 3D cinematic Indian image of a locked neutral benchmark scene: an Indian woman in a saree standing beside a seated Indian man on a park bench, a young Indian girl standing close to the woman holding a book, two or three ordinary people in the distant background, and a small tea cart far behind in a public park courtyard, soft daylight, clear foreground midground background separation, cinematic spatial depth, readable staging, grounded Indian anatomy. Now reconstruct this same scene through a Warli-derived 3D visual grammar, not flat painting. The dominant visual language must come from Warli structure translated into sculptural 3D form: human bodies simplified into clean geometric mass relationships, triangular and tapered body logic, reduced but expressive facial construction, clear symbolic grouping, rhythmic figure spacing, patterned tree and foliage organization, decorative linear repetition, tribal motif rhythm integrated into bench, path edges, tree surfaces, and environmental trims, shallow carved relief influence, earthy clay-lime visual language translated into volumetric 3D materials, strong silhouette clarity, organized negative space, graphic readability inside cinematic depth.",
    variations: {
      template: {
        id: "template",
        label: "Template C",
        shortLabel: "Template",
        description: "Full 3D Warli-derived cinematic prompt with spatial and material constraints.",
        prompt: `Convert this image into a premium fully volumetric Warli-derived cinematic 3D Indian scene.

STYLE LOCK:
Warli-inspired visual grammar from Maharashtra translated into premium cinematic 3D world design, symbolic folk structure converted into volumetric form, human bodies simplified through geometric mass relationships, tapered and triangular body logic, reduced but expressive facial construction, clear silhouette readability, rhythmic social grouping, organized negative space, folk motif repetition integrated into environment design, strong symbolic clarity inside a grounded 3D scene

FORM RULE:
translate every visible person, object, prop, bench, tree, plant, path, cart, architecture, and background element into Warli-derived 3D construction logic; preserve the source scene's action, relationships, posture, staging, and readable narrative structure, but rebuild all forms through simplified Indian folk geometry rather than realism

MATERIAL RULE:
earthy handcrafted terracotta-clay-wood-lime visual language, matte artisanal surfaces, warm natural material richness, carved or hand-finished detail accents, tactile but clean premium finish, no glossy synthetic CGI surfaces

SPATIAL RULE:
the scene must remain fully 3D, spatial, and cinematic with clear foreground, midground, and background separation; preserve depth, volume, and readable staging; do not flatten into mural logic; do not collapse the scene into relief or wall-art

WARLI-INTELLIGENCE RULE:
the dominant visual intelligence must come from Warli design principles: symbolic reduction, rhythmic repetition, geometric human grouping, decorative structural patterning, tree and foliage organization, patterned trims, and folk clarity - translated into a complete cinematic 3D world

LIGHTING RULE:
soft natural cinematic daylight, clear form separation, controlled shadows, warm earthy tonal harmony, high readability, elegant depth guidance, no dramatic realism-heavy lighting

COMPOSITION RULE:
preserve the core arrangement of the source image, but reinterpret the entire scene through Warli-derived spatial design logic; maintain balanced staging, strong silhouette hierarchy, visual calm, and communal folk readability

NEGATIVE LOCK:
no flat 2D mural, no white stick figures, no literal tribal wall painting, no shallow bas-relief only, no photorealism, no hyper-real anatomy, no glossy plastic CGI, no Pixar, no Disney, no DreamWorks, no childish cartoon, no random realism-dominant environment, no western stylization, no generic game-art look, no costume drift, no decorative clutter without structural purpose

OUTPUT GOAL:
the final image must feel like Warli visual intelligence transformed into a premium fully volumetric cinematic Indian 3D world - tactile, symbolic, spatial, readable, handcrafted, and culturally grounded`,
      },
      variable: {
        id: "variable",
        label: "Template C Reusable Variable",
        shortLabel: "Reusable Variable",
        description: "Reusable fully 3D prompt with Warli-derived cinematic world-building slots.",
        prompt: `Convert this image into a premium Warli-derived fully volumetric cinematic 3D Indian scene.

Rebuild [main subject / group / environment] using:
- Warli-inspired geometric body construction
- simplified but expressive facial structure
- tapered and triangular mass logic
- rhythmic figure spacing
- symbolic social grouping
- patterned environmental design
- handcrafted terracotta-clay-wood material language
- cinematic 3D spatial staging

Translate the source image so that:
- [subject 1] becomes a Warli-derived volumetric 3D figure
- [subject 2] becomes a simplified geometric Indian folk-styled character
- [object/prop] becomes a patterned Warli-derived 3D object
- [environment] becomes a Warli-structured cinematic spatial environment

Preserve:
- core action
- posture relationships
- scene readability
- foreground/midground/background logic
- narrative clarity

Keep the result fully 3D, fully spatial, and cinematic.
Do not flatten the image into a mural or relief.
Do not use white stick-figure Warli rendering.
The dominant visible language must be Warli-derived form logic translated into premium handcrafted cinematic 3D design.`,
      },
      restyle: {
        id: "restyle",
        label: "Template C Restyle",
        shortLabel: "Restyle",
        description: "Restyle an image into a premium Warli-derived cinematic 3D scene.",
        prompt: `Restyle this source image as a premium Warli-derived fully volumetric cinematic 3D Indian scene.

Preserve the original scene's action, pose logic, staging relationships, and spatial readability, but rebuild all visible people, props, and environment elements through Warli-inspired geometric construction logic. Human figures should use simplified tapered body masses, reduced but expressive facial design, strong silhouette clarity, and culturally grounded Indian presence. Environment elements should use patterned folk structure, rhythmic trims, organized decorative repetition, and symbolic clarity.

Use handcrafted terracotta-clay-wood-lime material language, matte tactile surfaces, warm earthy tones, and clear cinematic foreground/midground/background depth. The result must remain fully 3D and spatial, not flat, not relief-only, and not a literal Warli wall painting.

No white stick figures, no 2D mural flattening, no photorealism, no glossy CGI, no cartoon-feature contamination, no western stylization.`,
      },
    },
  },
};

export const WARLI_PROMPT_FAMILY_LIST = Object.values(WARLI_PROMPT_FAMILIES);
