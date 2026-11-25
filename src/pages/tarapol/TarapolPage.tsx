import React, { useState, useEffect } from 'react';
import { GlobalHeader } from '../../components/GlobalHeader';
import { Footer } from '../../components/Footer';
import { CheckoutModal } from '../../components/CheckoutModal';
import { setPageSeo } from '../../lib/seo';
import { toPersianDigits } from '../../lib/persianUtils';
import { useSettingsStore } from '../../store/settingsStore';
import { TarapolHero } from './components/TarapolHero';
import { IdeIntegrationTabs } from './components/IdeIntegrationTabs';
import { ComparisonMatrix } from './components/ComparisonMatrix';
import { FeatureBentoGrid } from './components/FeatureBentoGrid';
import { PricingCards3D } from './components/PricingCards3D';
import { TechnicalFaq } from './components/TechnicalFaq';
import { PricingPlan } from './data/tarapolContent';

export function TarapolPage() {
  const { settings } = useSettingsStore();
  const usePersianDigits = settings?.appearance?.persianNumerals ?? false;

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [productData, setProductData] = useState<any>(null);
  const [selectedVariation, setSelectedVariation] = useState<any>(null);

  useEffect(() => {
    setPageSeo({
      title: 'تَراپُل (Tarapol) | شورای مشاوران ارشد هوش مصنوعی برای Antigravity و Cursor',
      description:
        'پل ارتباطی اختصاصی میان محیط توسعه (Google Antigravity و Cursor) و مدل‌های وب پرچمدار Google Gemini 4 Neon و Alibaba Qwen4-Max برای بازبینی عمیق کد، معماری سیستم و عیب‌یابی بدون هزینه دلاری API.',
      keywords:
        'تراپل, tarapol, antigravity, antigravity bridge, gemini 4 neon, qwen4-max, cursor ai, هوش مصنوعی برنامه نویسی, شورای هوش مصنوعی, آنتی گرویتی, دستیار هوشمند کدنویسی, خرید لایسنس تراپل',
      canonical: `${window.location.origin}/tarapol`,
      ogImage: `${window.location.origin}/images/products/tarapol-box.jpg`,
      ogType: 'product',
      schema: {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'نرم‌افزار تَراپُل (Tarapol Universal AI Gateway)',
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'Windows 10/11, macOS, Linux',
        description:
          'شورای مشاوران ارشد هوش مصنوعی و گیت‌وی محلی برای ارتباط محیط‌های کدنویسی با برترین مدل‌های استدلالی وب (Gemini 4 Neon و Qwen4-Max).',
        image: `${window.location.origin}/images/products/tarapol-box.jpg`,
        offers: {
          '@type': 'AggregateOffer',
          priceCurrency: 'IRR',
          lowPrice: '3900000',
          highPrice: '14900000',
          offerCount: '3',
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.95',
          reviewCount: '48',
        },
      },
    });

    fetch('/api/products')
      .then((res) => res.json())
      .then((data: any[]) => {
        const found = data.find(
          (p) => p.id === 34 || p.title?.includes('تراپل') || p.title?.includes('Tarapol')
        );
        if (found) {
          setProductData(found);
          let vars = [];
          try {
            vars =
              typeof found.variations === 'string'
                ? JSON.parse(found.variations)
                : found.variations || [];
          } catch {
            vars = [];
          }
          if (vars.length > 0) {
            const defaultVar = vars.find((v: any) => v.id === 'pro') || vars[0];
            setSelectedVariation(defaultVar);
          }
        }
      })
      .catch(() => {});
  }, []);

  const handleOpenCheckout = (planId: PricingPlan['id']) => {
    let chosenVar = null;
    if (productData && productData.variations) {
      try {
        const vars =
          typeof productData.variations === 'string'
            ? JSON.parse(productData.variations)
            : productData.variations;
        chosenVar = vars.find((v: any) => v.id === planId) || vars[0];
      } catch {
        chosenVar = null;
      }
    }

    const fallbackProduct = productData || {
      id: 34,
      title: 'لایسنس نرم‌افزار تَراپُل (Tarapol AI Gateway) | شورای مشاوران ارشد هوش مصنوعی',
      price: planId === 'starter' ? 390000 : planId === 'team' ? 1490000 : 690000,
      category: 'software',
      image: '/images/products/tarapol-box.jpg',
    };

    setProductData(fallbackProduct);
    setSelectedVariation(
      chosenVar || {
        id: planId,
        title:
          planId === 'starter'
            ? 'پلن پایه (Starter - ۱ سیستم)'
            : planId === 'team'
            ? 'پلن استودیو و تیمی (Team Edition)'
            : 'پلن حرفه‌ای (Pro Developer)',
        price: planId === 'starter' ? 390000 : planId === 'team' ? 1490000 : 690000,
      }
    );
    setIsCheckoutOpen(true);
  };

  const formatPrice = (p: number) => {
    const formatted = (p || 0).toLocaleString();
    return usePersianDigits ? toPersianDigits(formatted) : formatted;
  };

  return (
    <div
      className="min-h-screen clay-landing-bg text-[var(--text-main)] flex flex-col justify-between transition-colors overflow-x-hidden"
      dir="rtl"
    >
      <GlobalHeader />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-20 sm:space-y-28">
        <TarapolHero usePersianDigits={usePersianDigits} />
        <FeatureBentoGrid />
        <IdeIntegrationTabs />
        <ComparisonMatrix usePersianDigits={usePersianDigits} />
        <PricingCards3D formatPrice={formatPrice} onSelectPlan={handleOpenCheckout} />
        <TechnicalFaq />
      </main>

      <Footer />

      {isCheckoutOpen && productData && (
        <CheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          product={productData}
          selectedVariation={selectedVariation}
        />
      )}
    </div>
  );
}

export default TarapolPage;
