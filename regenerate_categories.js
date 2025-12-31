const fs = require('fs');
const path = require('path');

const CATEGORIES = ["All", "General", "Fun", "Viral Trend", "Architecture", "Photography", "Fashion", "Virtual Tryon", "Social Media", "Film Industry", "Branding"];

const slugify = (cat) => cat.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '').trim();

const BASE_DIR = path.join(process.cwd(), 'src/app/view/workflows/(categories)');

if (!fs.existsSync(BASE_DIR)) {
    console.error(`Base directory not found: ${BASE_DIR}`);
    process.exit(1);
}

CATEGORIES.forEach(cat => {
    if (cat === "All") return; // "All" doesn't have a subfolder in (categories) usually, it's handled by root workflows page. Or did I create one? 
    // In my previous script I processed "All" but used "All" as directory?? 
    // Actually "All" usually maps to the root view.
    // The root page handles "All". 
    // But let's check if "all" folder exists? The user didn't ask for it.
    // I previously filtered: const categoryData = cat === "All" ? ...
    // If "All" folder exists, I should update it too?
    // Let's assume we skip "All" for subfolders as it's the index.

    const slug = slugify(cat);
    const dir = path.join(BASE_DIR, slug);

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`Created ${dir}`);
    }

    // Dynamic data.js content
    const dataContent = `import { WORKFLOWS_DATA } from '../../components/data';

export const DATA = WORKFLOWS_DATA.filter(wf => wf.category === "${cat}");
`;
    fs.writeFileSync(path.join(dir, 'data.js'), dataContent);

    // Dynamic page.tsx content
    const pageContent = `'use client';
import { WorkflowsPageComponent } from '../../components/WorkflowsPageComponent';
import { DATA } from './data';

export default function Page() {
  return (
    <WorkflowsPageComponent 
      initialCategory="${cat}" 
      workflows={DATA} 
      basePath="/view/workflows" 
    />
  );
}
`;
    fs.writeFileSync(path.join(dir, 'page.tsx'), pageContent);
    console.log(`Regenerated dynamic content for ${cat}`);
});
