/** Srikalahasti Kalamkari — V1 (Authentic Style) prompts. */

export const srikalahastiPromptV1 = {
  /** Universal hard prompt (text-to-image). */
  promptHard: `Create an image in the authentic Srikalahasti Kalamkari tradition of Andhra Pradesh.
This must look like a hand-painted sacred narrative cotton cloth made with a kalam pen, not a printed fabric, not a block-print textile, and not a generic Indian folk illustration.

Rebuild the image through the actual source grammar of Srikalahasti Kalamkari:
- freehand black contour drawing with visible hand control and pressure variation
- stylized elongated human figures
- expressive but non-photoreal faces designed for sacred and narrative readability
- patterned drapery and ornamental costume detailing integrated into the figure structure
- flat pictorial textile space, not western perspective realism
- border structures that behave like sacred thresholds, not decorative trim
- horizontal or staged narrative organization inspired by temple-hanging and oral-storytelling logic
- central sacred or narrative hierarchy, with supporting figures arranged around the primary focus
- vegetal fillers, creepers, sacred framing motifs, and structured ornamental separators
- matte hand-dyed cotton-cloth surface memory

Use historically grounded material and color behavior:
off-white cotton cloth ground, strong hand-drawn black outlines, maroon or deep red dyed passages, indigo or deep blue sections, yellow highlights, soft absorbent edges, slight pigment spread, hand-made irregularity, washed and sun-dried cloth character, natural-dye softness, no glossy finish.

Figure logic:
contour-led anatomy, elongated but readable bodies, gesture language suited to devotion, storytelling, offering, witness, procession, blessing, or epic action. Figures must feel sacred-narrative, not casual, not photographic.

Space logic:
the image must feel like a sacred narrative cloth or temple hanging. The border is the threshold into sacred space. The inner field contains narrative or devotional action. The central zone carries the highest sacred or narrative weight. Keep the image field occupied and structured, not empty.

Do not make this look like Machilipatnam block print. Do not use stamped repetition. Do not turn it into boho decor, upholstery, generic ethnic textile design, vector-clean poster art, realism with Indian ornament pasted on top, or glossy digital painting.

The final result must feel like a true hand-painted Srikalahasti Kalamkari cloth: freehand, sacred, narrative, textile-born, naturally dyed, contour-led, and culturally grounded.`,

  /** Reusable variable template (slot-based). */
  promptVariable: `Create [SUBJECT / SCENE] in the authentic Srikalahasti Kalamkari tradition of Andhra Pradesh.
Treat the image as a hand-painted sacred narrative cotton cloth made with a kalam pen.

Preserve this source grammar:
- freehand black contour drawing
- flat pictorial textile space
- stylized elongated figures
- sacred or epic narrative staging
- threshold-like border framing
- vegetal fillers and structured ornament
- patterned garments and contour-led drapery
- off-white cloth ground with black, maroon / deep red, indigo / deep blue, and yellow
- matte natural-dye cloth behavior with slight hand irregularity

Translate the scene like this:
- [MAIN SUBJECT] becomes the central sacred or narrative focal figure
- [SECONDARY FIGURES] become supporting devotional, witness, attendant, or narrative figures
- [OBJECTS / ANIMALS / SYMBOLS] become stylized hand-painted Kalamkari forms
- [ENVIRONMENT] becomes a staged sacred cloth-space with border thresholds, ornamental framing, and narrative support zones

Keep:
source-cloth logic, contour authority, sacred readability, narrative grouping, natural-dye palette memory, hand-painted irregularity, non-block-printed identity.

Avoid:
stamped motif repetition, generic floral textile styling, realism-heavy anatomy, western depth perspective, boho decor look, glossy rendering, vector-clean linework, surface-only ornament.`,

  /** Image-to-image prompt. */
  promptI2I: `Convert this source image into authentic Srikalahasti Kalamkari from Andhra Pradesh.
Preserve the source image’s subject count, core action, pose relationships, and scene readability, but rebuild the entire image as a hand-painted sacred narrative cotton cloth created with a kalam pen.

Replace realistic scene construction with flat pictorial textile organization, sacred border thresholds, stylized elongated figures, patterned drapery, vegetal fillers, narrative or devotional grouping, and central sacred hierarchy.

Use:
off-white cotton base, hand-drawn black contour, maroon / deep red, indigo / blue, yellow, matte absorbent dye behavior, slight pigment spread, hand-made irregularity, and washed-cloth softness.

Do not simply add Kalamkari patterns onto the source image. Rebuild figure logic, border logic, cloth logic, material logic, and sacred narrative organization.
Do not make it block printed, decorative textile wallpaper, generic Indian ornament art, or realism with ethnic motifs added afterward.

The final image must feel like a true Srikalahasti Kalamkari hanging or narrative cloth.`,
} as const;

