import { useEffect } from 'react';

interface SEOProps {
  title: string;
  description?: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  twitterCard?: 'summary' | 'summary_large_image';
}

export function SEO({
  title,
  description,
  keywords,
  ogTitle,
  ogDescription,
  ogImage,
  ogType = 'website',
  twitterCard = 'summary_large_image'
}: SEOProps) {
  useEffect(() => {
    document.title = title;

    const updateMeta = (name: string, content: string | undefined, isProperty = false) => {
      if (!content) return;
      
      const selector = isProperty 
        ? `meta[property="${name}"]` 
        : `meta[name="${name}"]`;
      let meta = document.querySelector(selector) as HTMLMetaElement | null;
      
      if (!meta) {
        meta = document.createElement('meta');
        if (isProperty) {
          meta.setAttribute('property', name);
        } else {
          meta.setAttribute('name', name);
        }
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    if (description) {
      updateMeta('description', description);
    }
    
    if (keywords) {
      updateMeta('keywords', keywords);
    }

    updateMeta('og:title', ogTitle || title, true);
    updateMeta('og:description', ogDescription || description, true);
    updateMeta('og:type', ogType, true);
    
    if (ogImage) {
      updateMeta('og:image', ogImage, true);
    }

    updateMeta('twitter:card', twitterCard);
    updateMeta('twitter:title', ogTitle || title);
    updateMeta('twitter:description', ogDescription || description);
    
    if (ogImage) {
      updateMeta('twitter:image', ogImage);
    }

  }, [title, description, keywords, ogTitle, ogDescription, ogImage, ogType, twitterCard]);

  return null;
}
