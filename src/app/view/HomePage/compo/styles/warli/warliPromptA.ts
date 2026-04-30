/** Style A — backend Warli prompts (benchmark + template + variable + restyle). */

export const warliPromptBodyA = {
  benchmarkScene: `A traditional Maharashtrian Warli tribal painting style, authentic Warli art from Maharashtra, white geometric stick figures made from triangles and circles, hand painted on earthy mud wall background, minimal tribal aesthetic, flat 2D composition, rhythmic folk patterns, simple symbolic forms, natural clay texture, handmade brush strokes. Scene: a Warli woman wearing a saree standing beside a bench, a small Warli girl holding a book standing next to her, a Warli man sitting on a bench, simple park environment with trees and walking path. All characters drawn as classic Warli tribal figures made of triangles and circles, bench, trees and environment also illustrated in Warli folk style. Flat composition, monochrome white on terracotta mud background, traditional Indian tribal art, clean minimal lines, balanced folk composition, highly detailed Warli mural.`,

  promptTemplate: `Convert this image into an authentic traditional Maharashtrian Warli tribal painting mural.

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

  promptVariable: `Convert this image into an authentic traditional Maharashtrian Warli tribal painting mural.

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

  promptRestyle: `Restyle this source image as an authentic traditional Maharashtrian Warli tribal mural.

Preserve the original scene's subject arrangement, pose logic, and action relationships, but translate every visible element into classic Warli folk painting language.

Use white geometric tribal figures made from circles, triangles, and simple lines, hand-painted on a terracotta mud wall. Simplify anatomy, clothing, props, furniture, plants, and environment into authentic Warli symbolic forms. Keep the composition flat, decorative, balanced, and mural-like.

Visible earthy clay wall texture, handmade lime-paint feel, minimal folk aesthetic, rhythmic ornament, traditional Maharashtrian tribal storytelling mural.

No photorealism, no cinematic lighting, no shading, no gradients, no 3D depth, no realistic faces, no glossy digital finish, no non-Warli stylization.`,
} as const;
