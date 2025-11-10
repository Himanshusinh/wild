import { promises as fs } from 'fs';
import path from 'path';

export const dynamic = 'force-static';

export async function GET() {
  const filePath = path.join(process.cwd(), 'public', 'sitemap.xml');
  const xml = await fs.readFile(filePath, 'utf8');
  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=600',
    },
  });
}
