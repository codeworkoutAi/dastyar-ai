export interface PageSeoOptions {
  title: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'product';
  schema?: Record<string, any>;
}

/**
 * Updates document.title, meta tags (description, Open Graph, Twitter),
 * canonical link, and JSON-LD schema dynamically during SPA navigation.
 */
export function setPageSeo({
  title,
  description,
  keywords,
  canonical,
  ogImage,
  ogType = 'website',
  schema
}: PageSeoOptions) {
  if (typeof document === 'undefined') return;

  const fullTitle = title.includes('دستیار هوشمند') ? title : `${title} | دستیار هوشمند`;
  document.title = fullTitle;

  const setMeta = (nameOrProperty: string, content: string, isProperty = false) => {
    const attr = isProperty ? 'property' : 'name';
    let el = document.querySelector(`meta[${attr}="${nameOrProperty}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attr, nameOrProperty);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  };

  if (description) {
    setMeta('description', description);
    setMeta('og:description', description, true);
    setMeta('twitter:description', description);
  }

  if (keywords) {
    setMeta('keywords', keywords);
  }

  setMeta('og:title', fullTitle, true);
  setMeta('twitter:title', fullTitle);
  setMeta('og:type', ogType, true);

  if (ogImage) {
    setMeta('og:image', ogImage, true);
    setMeta('twitter:image', ogImage);
  }

  // Canonical
  let canonicalEl = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!canonicalEl) {
    canonicalEl = document.createElement('link');
    canonicalEl.setAttribute('rel', 'canonical');
    document.head.appendChild(canonicalEl);
  }
  canonicalEl.setAttribute('href', canonical || window.location.href);

  // Dynamic Structured Data (JSON-LD)
  let schemaEl = document.getElementById('page-dynamic-schema');
  if (schema) {
    if (!schemaEl) {
      schemaEl = document.createElement('script');
      schemaEl.setAttribute('type', 'application/ld+json');
      schemaEl.setAttribute('id', 'page-dynamic-schema');
      document.head.appendChild(schemaEl);
    }
    schemaEl.textContent = JSON.stringify(schema);
  } else if (schemaEl) {
    schemaEl.remove();
  }
}
