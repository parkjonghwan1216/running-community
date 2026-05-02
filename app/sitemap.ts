import type { MetadataRoute } from 'next';

const BASE = process.env.SITE_URL ?? 'http://localhost:3000';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${BASE}/`, lastModified: now },
    { url: `${BASE}/posts/free`, lastModified: now },
    { url: `${BASE}/posts/training`, lastModified: now },
    { url: `${BASE}/races`, lastModified: now },
    { url: `${BASE}/glossary`, lastModified: now },
  ];
}
