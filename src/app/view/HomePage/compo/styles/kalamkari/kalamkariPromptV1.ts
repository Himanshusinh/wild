/** Machilipatnam Kalamkari — V1 (Authentic Style) prompts. */

export const kalamkariPromptV1 = {
  /** Universal hard prompt (text-to-image). */
  promptHard: `Create an image in the authentic Machilipatnam Kalamkari tradition of Andhra Pradesh.
This must look like a hand block-printed natural-dye textile from the Machilipatnam / Pedana Kalamkari system, not a freehand-painted Kalamkari cloth and not a generic Indian floral fabric.

Rebuild the image through the actual source grammar of Machilipatnam Kalamkari:
- hand block-printed identity as the primary image engine
- all-over floral twine and Persian-inspired ornamental vocabulary
- repeating patterns, floral trellises, creepers, leaf networks, and geometric border systems
- field-centered textile composition rather than a single painted narrative panel
- motif distribution across the cloth surface
- border-to-field organization that feels usable as real textile design
- printed contour discipline rather than expressive freehand pen-line dominance
- natural-dye palette memory and matte cloth behavior
- applied textile intelligence suitable for furnishing, apparel, or decorative cloth use

Material and surface behavior:
off-white or light natural cloth ground, black outlines, maroon / deep red, indigo / deep blue, yellow, and where appropriate soft green or pink derived from mixed natural-dye behavior; matte absorbent textile surface; hand-processed irregularity; block-print registration memory; no synthetic gloss.

If figures, birds, animals, lotus, tree-of-life, or other motifs appear, they must remain subordinate to the block-printed field logic and ornamental structure. They should feel motif-stable, repeat-capable, and textile-compatible, not like freehand scene illustration.

The whole image must behave like a printed textile field: distributed, patterned, border-aware, and surface-organized.

Do not turn this into Srikalahasti-style freehand mythological cloth.
Do not make it a single sacred narrative tableau.
Do not make it generic boho floral textile.
Do not use glossy digital rendering, vector-clean synthetic finish, or realism-first illustration.
Do not lose the block-print discipline.

The final result must feel like a true Machilipatnam Kalamkari textile: block-printed, natural-dyed, Persian-floral, field-centered, matte, and cloth-intelligent.`,

  /** Reusable variable template (slot-based). */
  promptVariable: `Create [SUBJECT / SCENE / MOTIF SYSTEM] in the authentic Machilipatnam Kalamkari tradition of Andhra Pradesh.
Treat the image as a hand block-printed natural-dye textile.

Preserve these source rules:
- block-printed identity, not freehand-painted identity
- field-centered textile organization
- all-over floral twine / Persian-inspired ornament grammar
- repeat-capable and border-aware motif design
- natural-dye palette memory: off-white, black, maroon / deep red, indigo / deep blue, yellow, optional soft green or pink
- matte absorbent cloth behavior
- printed contour discipline and registration awareness
- furnishing / apparel / textile-surface usability

Translate the design like this:
- [MAIN MOTIF OR SUBJECT] becomes a block-capable textile motif or grouped motif system
- [SECONDARY MOTIFS] become supporting repeat-compatible forms
- [BORDER] becomes a structured geometric or ornamental frame linked to the field
- [FIELD] becomes a distributed printed textile surface, not a scene-background

Keep:
surface rhythm, motif repetition or spread, textile-field logic, Persian-floral twining structure, printed cloth identity.

Avoid:
freehand-painted Kalamkari look, single-scene sacred composition, generic floral wallpaper styling, glossy digital polish, realism-heavy illustration, and decorative motifs without print grammar.`,

  /** Image-to-image prompt. */
  promptI2I: `Convert this source image into the authentic Machilipatnam Kalamkari tradition of Andhra Pradesh.
Preserve the source image’s core subject identity and major visual relationships, but rebuild the entire image as a hand block-printed natural-dye textile.

Replace free illustration logic with:
field-centered textile organization,
all-over or distributed floral twine / Persian-inspired ornament,
repeat-capable motif design,
printed contour discipline,
border-to-field structure,
and matte natural-dye cloth memory.

Use:
off-white cloth ground, black contour, maroon / deep red, indigo / deep blue, yellow, optional soft green or pink, absorbent textile finish, slight hand irregularity, and block-print registration character.

If the source contains figures or objects, convert them into textile-compatible printed motifs rather than scene-dominant painted forms.
Do not simply place floral patterns over the original image.
Rebuild the image as a true printed cloth surface.

Do not drift into Srikalahasti-style freehand narrative cloth, generic Indian floral textile, or glossy decorative digital design.
The final result must feel like authentic Machilipatnam Kalamkari.`,
} as const;

