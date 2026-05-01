export const kutchPromptV2 = {
  promptHard: `Create a creative 2D + 3D image translation rooted in Kutch embroidery from Gujarat, but locked strictly to one branch only: [CHOSEN_BRANCH].
This is not generic Kutchi decoration and not a full realistic world yet.
It must remain source-rooted in the branch grammar of [CHOSEN_BRANCH]:
branch-specific stitch behavior,
branch-specific density,
branch-specific geometry or motif logic,
branch-correct mirror rule if relevant,
cloth-surface segmentation,
embroidered field construction.
Let the image gain dimensional body, layered stitched-field depth, richer textile tactility, stronger distinction between filled and open zones, more articulated embroidered segmentation, and greater surface presence.
But keep the image embroidery-field-first.
It should still feel like [CHOSEN_BRANCH] is constructing the image, not generic realism.
Extend the chosen branch across all elements:
humans are shaped through embroidered garment-field logic, stitched mass grouping, and branch-specific pattern structure;
animals are shaped through branch-correct stitched segmentation and surface logic;
trees are shaped through embroidered field clustering and branch-specific fill behavior;
props, ground, and architecture are shaped through the same branch's stitched order.
Faces and skin stay readable and human.
No thread lumps on skin.
No fake printed embroidery.
No mixed branches.
Avoid:
branch mixing,
generic mirror-work,
printed embroidery simulation,
surface embellishment added afterward,
architecture-only solution,
normal realism with one embroidered garment inserted.`,
  promptVariable: `Create [SUBJECT / SCENE / WORLD] as a creative 2D + 3D translation rooted in Kutch embroidery from Gujarat, locked to [CHOSEN_BRANCH].
Preserve these source-core rules:
one branch only,
branch-specific stitch grammar remains primary,
embroidered cloth logic remains structural,
branch-correct density remains active,
mirror use stays branch-correct if relevant,
the whole frame remains inside one [CHOSEN_BRANCH] system.
Translate the image like this:
[MAIN SUBJECT / MAIN FIELD] becomes a dimensionalized [CHOSEN_BRANCH] embroidered image-zone.
[HUMANS] are rebuilt through branch-specific embroidered segmentation, garment-field order, and stitched surface grouping; skin remains clean.
[ANIMALS] are rebuilt through branch-correct stitched markings and cloth-surface logic.
[TREES / FOLIAGE] are rebuilt through embroidered clustering, field segmentation, and branch-specific fill rhythm.
[OBJECTS / GROUND / ARCHITECTURE] gain richer layering but remain governed by [CHOSEN_BRANCH] embroidery order.
[ENVIRONMENT] becomes a branch-embroidered image-field rather than generic realism.
Let these become richer:
stitched-field depth,
surface tactility,
density variation,
embroidered segmentation,
image-body.
Keep unchanged:
branch purity,
stitch-built construction,
cloth identity,
branch-correct mirror rule,
community-owned grammar.
Avoid:
mixed Kutchi look,
generic craft ornament,
print pretending to be stitch,
one embroidered section inside an unrelated image.`,
  promptI2I: `Convert this source image into a creative 2D + 3D Kutch embroidery translation from Gujarat, locked strictly to [CHOSEN_BRANCH].
Preserve the source image's main action, subject count, and readability, but reconstruct the full image through the chosen branch's embroidery grammar.
Replace ordinary surfaces with stitched cloth behavior.
Replace general decoration with branch-specific stitch construction.
Replace broad folk styling with [CHOSEN_BRANCH] logic:
its field density,
its motif or geometric system,
its outlining behavior,
its mirror rule if relevant,
its surface-building method.
Allow the image to gain layered embroidered depth, richer textile tactility, stronger segmentation, and more visible image-body.
But do not let it become full realism.
It must still behave like a dimensionalized embroidered field.
Do not paste embroidery onto a normal image.
Do not let humans, trees, and animals remain generic.
Do not mix branches.
The result must feel like [CHOSEN_BRANCH] embroidery logic has gained image-body across the whole frame.`,
};
