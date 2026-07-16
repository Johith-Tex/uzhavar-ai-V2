// src/pages/SchemesPage.jsx
import { useState } from 'react';
import { Phone, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

const SCHEMES = [
  {
    id: 'pmkisan', icon: '💰', color: '#f0b429',
    en: { name: 'PM-KISAN', desc: 'Direct income support of ₹6,000/year in 3 installments of ₹2,000 to eligible farmer families.', eligibility: 'All landholding farmer families (exceptions: income tax payers, government employees)', howToApply: 'Visit nearest Common Service Centre (CSC) or pmkisan.gov.in', benefit: '₹6,000 / year', helpline: '155261' },
    ta: { name: 'PM-KISAN', desc: 'தகுதியான விவசாய குடும்பங்களுக்கு ஆண்டுக்கு ₹6,000 நேரடி வருமான ஆதரவு (3 தவணைகள்).', eligibility: 'அனைத்து நில உரிமை விவசாய குடும்பங்களும் (வருமான வரி, அரசு ஊழியர்கள் தவிர)', howToApply: 'அருகில் உள்ள CSC மையம் அல்லது pmkisan.gov.in', benefit: '₹6,000 / ஆண்டு', helpline: '155261' },
    hi: { name: 'PM-KISAN', desc: 'पात्र किसान परिवारों को ₹6,000/साल सीधी आय सहायता (₹2,000 की 3 किस्तें).', eligibility: 'सभी भूमिधारी किसान परिवार (आयकर दाता और सरकारी कर्मचारी छोड़कर)', howToApply: 'नज़दीकी CSC केंद्र या pmkisan.gov.in', benefit: '₹6,000 / साल', helpline: '155261' },
  },
  {
    id: 'pmfby', icon: '🛡️', color: '#3ab5f5',
    en: { name: 'PMFBY – Crop Insurance', desc: 'Financial support against crop loss due to natural calamities, pests & diseases.', eligibility: 'All farmers growing notified crops. Compulsory for loanee farmers.', howToApply: 'Apply through your bank or pmfby.gov.in before cut-off date.', benefit: 'Full sum insured', helpline: '14447' },
    ta: { name: 'PMFBY – பயிர் காப்பீடு', desc: 'இயற்கை சேதங்கள், பூச்சிகள் மற்றும் நோய்களால் பயிர் இழப்பு ஏற்பட்டால் நிதி உதவி.', eligibility: 'கடன் பெற்ற விவசாயிகளுக்கு கட்டாயம், மற்றவர்களுக்கு விருப்பம்.', howToApply: 'உங்கள் வங்கி மூலம் அல்லது pmfby.gov.in இல் விண்ணப்பிக்கவும்.', benefit: 'முழு காப்பீடு தொகை', helpline: '14447' },
    hi: { name: 'PMFBY – फसल बीमा', desc: 'प्राकृतिक आपदाओं, कीट और बीमारियों से फसल नुकसान पर वित्तीय सहायता.', eligibility: 'कर्जदार किसानों के लिए अनिवार्य, बाकी के लिए स्वैच्छिक.', howToApply: 'अपने बैंक या pmfby.gov.in से आवेदन करें.', benefit: 'पूरी बीमा राशि', helpline: '14447' },
  },
  {
    id: 'shc', icon: '🧪', color: '#48c96a',
    en: { name: 'Soil Health Card', desc: 'Free soil testing and personalized fertilizer recommendations every 2 years.', eligibility: 'All farmers in India.', howToApply: 'Contact nearest Krishi Vigyan Kendra (KVK) or Agriculture Extension Officer.', benefit: 'Free soil test + fertilizer guidance', helpline: '1800-180-1551' },
    ta: { name: 'மண் சுகாதார அட்டை', desc: 'இலவச மண் பரிசோதனை மற்றும் தனிப்பட்ட உர பரிந்துரை (ஒவ்வொரு 2 ஆண்டுகளும்).', eligibility: 'இந்தியாவில் உள்ள அனைத்து விவசாயிகளும்.', howToApply: 'அருகில் உள்ள KVK அல்லது வேளாண்மை விரிவாக்க அலுவலர்.', benefit: 'இலவச மண் பரிசோதனை + உர வழிகாட்டுதல்', helpline: '1800-180-1551' },
    hi: { name: 'मृदा स्वास्थ्य कार्ड', desc: 'हर 2 साल में मुफ़्त मिट्टी जाँच और व्यक्तिगत उर्वरक सिफ़ारिश.', eligibility: 'भारत के सभी किसान.', howToApply: 'नज़दीकी कृषि विज्ञान केंद्र (KVK) या कृषि विस्तार अधिकारी से संपर्क करें.', benefit: 'मुफ़्त मिट्टी जाँच + खाद मार्गदर्शन', helpline: '1800-180-1551' },
  },
  {
    id: 'kcc', icon: '💳', color: '#c47a2a',
    en: { name: 'Kisan Credit Card (KCC)', desc: 'Low-interest credit for crop cultivation, harvest expenses, and allied activities.', eligibility: 'All farmers, sharecroppers, and SHGs engaged in farming.', howToApply: 'Apply at any nationalized bank or RRB with land documents.', benefit: 'Credit up to ₹3 lakh at 4% interest', helpline: '1800-180-1551' },
    ta: { name: 'கிசான் கிரெடிட் கார்டு (KCC)', desc: 'குறைந்த வட்டியில் பயிர் சாகுபடி மற்றும் அறுவடை செலவுகளுக்கு கடன்.', eligibility: 'விவசாயம் செய்யும் அனைத்து விவசாயிகளும், குத்தகை விவசாயிகளும்.', howToApply: 'நில ஆவணங்களுடன் தேசியமயமாக்கப்பட்ட வங்கியை அணுகவும்.', benefit: '4% வட்டியில் ₹3 லட்சம் வரை', helpline: '1800-180-1551' },
    hi: { name: 'किसान क्रेडिट कार्ड (KCC)', desc: 'कम ब्याज पर फसल खेती, कटाई खर्चों और संबद्ध गतिविधियों के लिए ऋण.', eligibility: 'सभी किसान, बटाईदार और SHG जो खेती करते हैं.', howToApply: 'जमीन के दस्तावेजों के साथ राष्ट्रीयकृत बैंक या RRB में आवेदन करें.', benefit: '4% ब्याज पर ₹3 लाख तक', helpline: '1800-180-1551' },
  },
  {
    id: 'drip', icon: '💧', color: '#3ab5f5',
    en: { name: 'Drip Irrigation Subsidy', desc: 'Per Drop More Crop – 55% subsidy for small farmers, 45% for large farmers on drip & sprinkler systems.', eligibility: 'All farmers. Priority to SC/ST, small & marginal farmers.', howToApply: 'Apply through your state Agriculture Department or pmksy.gov.in.', benefit: '45–55% subsidy on equipment', helpline: '1800-180-1551' },
    ta: { name: 'சொட்டு நீர்ப்பாசன மானியம்', desc: 'சிறு விவசாயிகளுக்கு 55%, பெரு விவசாயிகளுக்கு 45% மானியம்.', eligibility: 'அனைத்து விவசாயிகளும். SC/ST, சிறு மற்றும் குறு விவசாயிகளுக்கு முன்னுரிமை.', howToApply: 'மாநில வேளாண்மை துறை அல்லது pmksy.gov.in மூலம் விண்ணப்பிக்கவும்.', benefit: '45–55% உபகரண மானியம்', helpline: '1800-180-1551' },
    hi: { name: 'ड्रिप सिंचाई सब्सिडी', desc: 'छोटे किसानों के लिए 55% और बड़े किसानों के लिए 45% सब्सिडी.', eligibility: 'सभी किसान। SC/ST, छोटे और सीमांत किसानों को प्राथमिकता.', howToApply: 'राज्य कृषि विभाग या pmksy.gov.in से आवेदन करें.', benefit: '45–55% उपकरण सब्सिडी', helpline: '1800-180-1551' },
  },
];

function SchemeCard({ scheme }) {
  const { language } = useApp();
  const [open, setOpen] = useState(false);
  const s = scheme[language] || scheme.en;
  const isNonEn = language !== 'en';
  const labels = {
    en: { eligibility: 'Who can apply:', how: 'How to apply:', call: 'Call Helpline' },
    ta: { eligibility: 'தகுதி:', how: 'விண்ணப்பிக்க:', call: 'உதவி அழைப்பு' },
    hi: { eligibility: 'पात्रता:', how: 'आवेदन कैसे करें:', call: 'हेल्पलाइन' },
  }[language] || { eligibility: 'Who can apply:', how: 'How to apply:', call: 'Call Helpline' };

  return (
    <div className={`scheme-card-v2 ${open ? 'scheme-card-v2--open' : ''}`} style={{ '--scheme-color': scheme.color }}>
      <button className="scheme-header-v2" onClick={() => setOpen(!open)}>
        <div className="scheme-icon-area">
          <span className="scheme-icon-v2">{scheme.icon}</span>
          <div>
            <h3 className="scheme-name-v2">{s.name}</h3>
            <span className="scheme-benefit-badge">{s.benefit}</span>
          </div>
        </div>
        <div className={`scheme-chevron ${open ? 'scheme-chevron--open' : ''}`}>
          <ChevronDown size={18} />
        </div>
      </button>

      {open && (
        <div className={`scheme-body-v2 ${isNonEn ? 'font-tamil' : ''}`}>
          <p className="scheme-desc-v2">{s.desc}</p>
          <div className="scheme-detail-v2">
            <span className="scheme-detail-label">{labels.eligibility}</span>
            <p>{s.eligibility}</p>
          </div>
          <div className="scheme-detail-v2">
            <span className="scheme-detail-label">{labels.how}</span>
            <p>{s.howToApply}</p>
          </div>
          <a href={`tel:${s.helpline}`} className="scheme-helpline-btn">
            <Phone size={14} />
            <span>{labels.call}: {s.helpline}</span>
          </a>
        </div>
      )}
    </div>
  );
}

export default function SchemesPage() {
  const { language } = useApp();
  const isNonEn = language !== 'en';
  const T = {
    en: { title: 'Government Schemes', sub: 'Tap any scheme for full details & apply', helpline: 'Kisan Call Center (Free 24/7)' },
    ta: { title: 'அரசு திட்டங்கள்', sub: 'விவரங்களுக்கு திட்டத்தை தட்டவும்', helpline: 'கிசான் கால் சென்டர் (இலவசம் 24/7)' },
    hi: { title: 'सरकारी योजनाएं', sub: 'पूरी जानकारी के लिए किसी योजना पर टैप करें', helpline: 'किसान कॉल सेंटर (मुफ़्त 24/7)' },
  }[language] || { title: 'Government Schemes', sub: 'Tap to expand', helpline: 'Kisan Call Center' };

  return (
    <div className="schemes-page-v2">
      <div className="page-header-v2">
        <div>
          <h2 className={`page-title-v2 ${isNonEn ? 'font-tamil' : ''}`}>{T.title}</h2>
          <p className={`page-sub-v2 ${isNonEn ? 'font-tamil' : ''}`}>{T.sub}</p>
        </div>
      </div>

      <a href="tel:1800-180-1551" className="helpline-banner-v2">
        <span className="helpline-icon">📞</span>
        <div>
          <div className="helpline-number">1800-180-1551</div>
          <div className={`helpline-label ${isNonEn ? 'font-tamil' : ''}`}>{T.helpline}</div>
        </div>
        <Phone size={18} className="helpline-arrow" />
      </a>

      <div className="schemes-list-v2">
        {SCHEMES.map(s => <SchemeCard key={s.id} scheme={s} />)}
      </div>
    </div>
  );
}
