import { Router } from 'express';
import db from '../db/database.js';
import { 
  getFullSiteDesign, 
  getSectionData, 
  DEFAULT_LANDING_VISIBILITY,
  DEFAULT_LANDING_HERO,
  DEFAULT_LANDING_FEATURES,
  DEFAULT_LANDING_MANIFESTO, 
  DEFAULT_LANDING_PROFESSIONS, 
  DEFAULT_LANDING_PROFESSIONS_SETTINGS,
  DEFAULT_LANDING_GALLERY,
  DEFAULT_LANDING_GALLERY_SETTINGS,
  DEFAULT_LANDING_ANALYTICS_SETTINGS,
  DEFAULT_LANDING_PRICING_HEADER,
  DEFAULT_LANDING_FAQS, 
  DEFAULT_LANDING_FAQS_SETTINGS,
  DEFAULT_LANDING_CTA, 
  DEFAULT_LANDING_GIFT_CARD, 
  DEFAULT_FOOTER_SETTINGS 
} from '../services/landingService.js';

const router = Router();

// GET /api/landing-content (Public, fast)
router.get('/landing-content', (_req, res) => {
  try {
    const visibility = getSectionData('landing_visibility', DEFAULT_LANDING_VISIBILITY);
    const hero = getSectionData('landing_hero', DEFAULT_LANDING_HERO);
    const features = getSectionData('landing_features', DEFAULT_LANDING_FEATURES);
    const manifesto = getSectionData('landing_manifesto', DEFAULT_LANDING_MANIFESTO);
    const professions = getSectionData('landing_professions', DEFAULT_LANDING_PROFESSIONS);
    const professionsSettings = getSectionData('landing_professions_settings', DEFAULT_LANDING_PROFESSIONS_SETTINGS);
    const gallery = getSectionData('landing_gallery', DEFAULT_LANDING_GALLERY);
    const gallerySettings = getSectionData('landing_gallery_settings', DEFAULT_LANDING_GALLERY_SETTINGS);
    const analytics = getSectionData('landing_analytics', DEFAULT_LANDING_ANALYTICS_SETTINGS);
    const pricingHeader = getSectionData('landing_pricing_header', DEFAULT_LANDING_PRICING_HEADER);
    const faqs = getSectionData('landing_faqs', DEFAULT_LANDING_FAQS);
    const faqsSettings = getSectionData('landing_faqs_settings', DEFAULT_LANDING_FAQS_SETTINGS);
    const cta = getSectionData('landing_cta', DEFAULT_LANDING_CTA);
    const giftCard = getSectionData('landing_gift_card', DEFAULT_LANDING_GIFT_CARD);
    const footer = getSectionData('footer_settings', DEFAULT_FOOTER_SETTINGS);
    
    // Fetch active plans from products table
    let plans: any[] = [];
    try {
      plans = db.prepare(`
        SELECT * FROM products 
        WHERE category = 'plan' 
          AND (status = 'active' OR status IS NULL)
          AND (showOnLanding = 1 OR showOnLanding IS NULL)
        ORDER BY price ASC
      `).all();
    } catch (e) {
      console.warn('[Landing API] Could not fetch plans from products:', e);
    }

    res.json({
      visibility,
      hero,
      features,
      manifesto,
      professions,
      professionsSettings,
      gallery,
      gallerySettings,
      analytics,
      pricingHeader,
      faqs,
      faqsSettings,
      cta,
      giftCard,
      footer,
      plans
    });
  } catch (error) {
    console.error('[Landing API] Error fetching landing content:', error);
    res.status(500).json({ error: 'خطا در دریافت محتوای صفحه اصلی' });
  }
});

// GET /api/site-design (Public)
router.get('/site-design', (_req, res) => {
  try {
    const design = getFullSiteDesign();
    res.json(design);
  } catch (error) {
    console.error('[Landing API] Error fetching site design:', error);
    res.status(500).json({ error: 'خطا در دریافت تنظیمات طراحی' });
  }
});

export default router;
