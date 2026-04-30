/** Style B — backend Warli prompts (benchmark + template + variable + restyle). */

export const warliPromptBodyB = {
  benchmarkScene: `Create a premium fully volumetric 3D cinematic Indian style-test image of a simple locked benchmark scene: a middle-aged Indian man seated on a park bench, an Indian woman standing beside him, a school-age Indian girl holding a notebook slightly forward, and an elderly Indian man walking in the background of a small public park courtyard with trees, pathway, benches, and one distant tea cart. Morning light, same generic neutral benchmark scene, same camera logic for style testing. Now rebuild the entire image using Warli visual construction logic first, then translate it into premium 3D relief-like volume. Human figures must be designed through Warli-inspired geometric body grammar: simplified structural masses, triangular and tapered body relationships, reduced facial detail, strong silhouette clarity, rhythmic limb construction, communal grouping logic, and highly legible social arrangement. Trees, plants, benches, pathway, and park elements must be simplified into Warli-derived symbolic structural forms, with repeated rhythmic shape patterns and organized negative space. The scene must feel like a Warli mural world converted into shallow sculpted 3D relief, not a normal realistic park scene with Warli colors. Keep the image fully volumetric, tactile, and cinematic, but the dominant visible language must be Warli form logic: symbolic reduction, rhythmic repetition, geometric human grouping, ritual mural clarity, earthy clay-lime-charcoal material behavior, carved-surface feeling, shallow layered relief depth, and strong graphic readability. This should look like Warli transformed into 3D sculpted cinematic satire language, not plain realism.`,

  promptTemplate: `Convert this image into a premium Warli-derived sculpted Indian bas-relief artwork.

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

  promptVariable: `Convert this image into a Warli-derived premium 3D terracotta relief mural.

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

  promptRestyle: `Restyle this source image as a premium Warli-derived Indian terracotta bas-relief mural.

Preserve the original scene's pose logic, main subject relationships, and narrative readability, but transform all visible elements into Warli-inspired symbolic sculptural form language. Human bodies should be simplified into geometric folk masses with reduced facial detail and strong silhouette clarity. Objects, furniture, plants, animals, and architecture should be translated into rhythmic, decorative, Warli-derived symbolic relief forms.

Use shallow embossed clay depth, matte terracotta material, handcrafted artisanal surface, organized mural composition, and cinematic directional light that reveals carved contour and tactile relief.

The final image must feel like a handcrafted Indian folk mural transformed into premium sculpted bas-relief wall art.

No photorealism, no glossy CGI, no realistic anatomy, no western sculpture influence, no flat vector poster finish.`,
} as const;
