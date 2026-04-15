"use client";

function extensionFromUrl(url: string): string {
  try {
    const path = new URL(url, "https://example.com").pathname;
    const m = path.match(/\.(webp|png|jpe?g|gif)(\?|$)/i);
    if (m) return m[1].toLowerCase() === "jpeg" ? "jpg" : m[1].toLowerCase();
  } catch {
    /* ignore */
  }
  return "jpg";
}

export async function downloadImageUrl(url: string, baseName: string): Promise<void> {
  const ext = extensionFromUrl(url);
  const safeName = baseName.replace(/[^\w.-]+/g, "_").slice(0, 80);

  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) throw new Error(String(res.status));
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = `${safeName}.${ext}`;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objectUrl);
  } catch {
    const a = document.createElement("a");
    a.href = url;
    a.download = `${safeName}.${ext}`;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
}

export async function downloadAllImageUrls(
  urls: string[],
  baseName: string,
  onProgress?: (done: number, total: number) => void,
): Promise<void> {
  const list = urls.filter(Boolean);
  for (let i = 0; i < list.length; i++) {
    await downloadImageUrl(list[i], `${baseName}-${i + 1}`);
    onProgress?.(i + 1, list.length);
    if (i < list.length - 1) {
      await new Promise((r) => setTimeout(r, 350));
    }
  }
}
