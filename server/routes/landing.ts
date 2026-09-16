import { Router } from 'express';
import db from '../db/database.js';
import { 
  getFullSiteDesign, 
  getSectionData, 
  DEFAULT_LANDING_HERO,
  DEFAULT_LANDING_MANIFESTO, 
  DEFAULT_LANDING_PROFESSIONS, 
  DEFAULT_LANDING_GALLERY,
  DEFAULT_LANDING_PRICING_HEADER,
  DEFAULT_LANDING_FAQS, 
  DEFAULT_LANDING_CTA, 
  DEFAULT_LANDING_GIFT_CARD, 
  DEFAULT_FOOTER_SETTINGS 
} from '../services/landingService.js';

const router = Router();

// GET /api/landing-content (Public, fast)
router.get('/landing-content', (_req, res) => {
  try {
    const hero = getSectionData('landing_hero', DEFAULT_LANDING_HERO);
    const manifesto = getSectionData('landing_manifesto', DEFAULT_LANDING_MANIFESTO);
    const professions = getSectionData('landing_professions', DEFAULT_LANDING_PROFESSIONS);
    const gallery = getSectionData('landing_gallery', DEFAULT_LANDING_GALLERY);
    const pricingHeader = getSectionData('landing_pricing_header', DEFAULT_LANDING_PRICING_HEADER);
    const faqs = getSectionData('landing_faqs', DEFAULT_LANDING_FAQS);
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

    res.json({ hero, manifesto, professions, gallery, pricingHeader, faqs, cta, giftCard, footer, plans });
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
