// src/services/llm.js — Groq (llama-3.3-70b) — ultra-fast, free tier
// Replaces slow local Ollama. Groq delivers responses 10-20x faster (~200ms vs 30s).
// Get FREE API key: https://console.groq.com (no credit card needed)
// Free tier: 14,400 requests/day — more than enough for a hackathon

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || '';
const GROQ_MODEL = 'llama-3.3-70b-versatile'; // Best Tamil quality + speed

// ─── Tamil Farmer Slang Dictionary ──────────────────────────────────────────
const TAMIL_SLANG = {
  'நெலு': 'நெல்', 'நெலம்': 'நெல் வயல்', 'நெல்லு': 'நெல்',
  'கப்பலங்கா': 'வாழை', 'கீரண்டி': 'கத்திரிக்காய்', 'கத்திரி': 'கத்திரிக்காய்',
  'மிளகா': 'மிளகாய்', 'மிளகாஞ்சு': 'மிளகாய்', 'வெங்காயன்': 'வெங்காயம்',
  'கொய்யா': 'கொய்யாப்பழம்', 'உளுந்து': 'உளுந்து (black gram)',
  'துவரை': 'துவரை (pigeon pea)', 'பயறு': 'பயறு (green gram)',
  'மண்ணு': 'மண்', 'மண்ணுல': 'மண்ணில்', 'கட்டி': 'மண் கட்டி',
  'களர்': 'களர் மண் (saline soil)', 'கரிசல்': 'கரிசல் மண் (black cotton soil)',
  'வாய்க்கால்': 'வாய்க்கால் (irrigation channel)',
  'தண்ணி': 'தண்ணீர்', 'தண்ணீரு': 'தண்ணீர்', 'நீரு': 'நீர்',
  'தண்ணி போதுமில்லை': 'நீர்ப்பாசனம் போதுமானதாக இல்லை',
  'தண்ணி குடுக்கணும்': 'நீர்ப்பாசனம் செய்ய வேண்டும்',
  'தண்ணி வரலை': 'தண்ணீர் வரவில்லை',
  'வெயிலு': 'வெயில்', 'காத்து': 'காற்று',
  'மழையே இல்லை': 'மழை இல்லாமல் உள்ளது (வறட்சி)',
  'உரம் போடணும்': 'உரம் இடுவது எப்படி', 'உரம் வேணும்': 'உரம் தேவை',
  'கெமிக்கல் உரம்': 'ரசாயன உரம் (chemical fertilizer)',
  'தெளிக்கணும்': 'தெளிக்க வேண்டும்', 'அடிக்கணும்': 'மருந்து அடிக்க வேண்டும்',
  'பூச்சி': 'பூச்சி (pest)', 'புழு': 'புழு (worm/caterpillar)',
  'இலை மஞ்சளாகுது': 'இலைகள் மஞ்சள் நிறமாகின்றன',
  'இலை மஞ்சளாச்சு': 'இலைகள் மஞ்சள் ஆகிவிட்டன',
  'சாகுது': 'பயிர் இறந்துவிடுகிறது', 'சாஞ்சிடுது': 'மரித்துவிட்டது',
  'காஞ்சிடுது': 'காய்ந்துவிடுகிறது', 'காஞ்சிட்டு': 'காய்ந்துவிட்டது',
  'மக்கிடுது': 'அழுகுகிறது', 'மக்கிட்டு': 'அழுகிவிட்டது',
  'வாடுது': 'வாடுகிறது (wilting)', 'வாடிடுது': 'வாடிவிட்டது',
  'பழுப்பாகுது': 'பழுப்பு நிறமாகிறது (brown spot)',
  'கருகுது': 'கருகுகிறது (burning/blast disease)',
  'துரு': 'துரு நோய் (rust disease)', 'பூஞ்சை': 'பூஞ்சை நோய் (fungal disease)',
  'கடன் வாங்கணும்': 'விவசாய கடன் பெறுவது எப்படி',
  'சர்க்கார்': 'அரசு', 'கார்டு': 'மண் ஆரோக்கிய அட்டை',
  'என்னன்னா': 'என்னவென்றால்', 'சொல்லுங்க': 'சொல்லுங்கள்',
  'எப்படி பண்றது': 'எப்படி செய்வது', 'என்ன பண்றது': 'என்ன செய்வது',
  'என்ன பண்ணலாம்': 'என்ன செய்யலாம்',
  'ஆகலை': 'ஆகவில்லை', 'ஆச்சு': 'ஆகிவிட்டது',
  'ரொம்ப': 'மிகவும்', 'கொஞ்சம்': 'சிறிது', 'நிறைய': 'அதிகமாக',
  'வேணும்': 'வேண்டும்', 'வேணா': 'வேண்டாம்',
  'காஞ்சிடுச்சு': 'காய்ந்துவிட்டது', 'சாஞ்சிடுச்சு': 'சாய்ந்துவிட்டது',
  'ஒடஞ்சிடுச்சு': 'உடைந்துவிட்டது', 'புடிச்சிடுச்சு': 'பிடித்துவிட்டது',
  'பாருங்க': 'பாருங்கள்', 'குடுங்க': 'கொடுங்கள்', 'குடு': 'கொடு',
  'போதல': 'போதவில்லை', 'எங்க': 'எங்கே', 'எப்ப': 'எப்போது',
  'தெரியலை': 'தெரியவில்லை', 'ஏன்னா': 'ஏனென்றால்',
  // Phonetic / STT romanized errors
  'nellam': 'நெல்', 'tanni': 'தண்ணீர்', 'poochu': 'பூச்சி',
  'uruvam': 'உரம்', 'mazhai': 'மழை', 'veyil': 'வெயில்',
  'mann': 'மண்', 'pairu': 'பயிர்', 'saagudhu': 'இறந்துவிடுகிறது',
  'manjal': 'மஞ்சள் நிறம்', 'thakkali': 'தக்காளி',
  'karumbu': 'கரும்பு', 'cholam': 'சோளம்', 'kadala': 'கடலை',
};

const HINDI_SLANG = {
  'पानी नई': 'पानी नहीं', 'पानी नइ': 'पानी नहीं',
  'कीड़ा लगा': 'कीट लग गया', 'कीड़े लगे': 'कीट लग गए हैं',
  'पत्ता पीला': 'पत्ते पीले हो रहे हैं',
  'फसल मर रई': 'फसल मर रही है', 'फसल सूख रई': 'फसल सूख रही है',
  'खाद डालो': 'खाद / उर्वरक डालें',
  'सरकारी पैसा': 'सरकारी अनुदान / सब्सिडी',
  'कर्जा': 'कृषि ऋण', 'उधार': 'किसान क्रेडिट कार्ड से ऋण',
  'दवाई छिड़को': 'कीटनाशक छिड़काव करें',
  'पानी कम है': 'सिंचाई की कमी है',
};

export const normalizeSlang = (text, language) => {
  if (language !== 'ta' && language !== 'hi') return text;
  const dict = language === 'ta' ? TAMIL_SLANG : HINDI_SLANG;
  let normalized = text;
  for (const [slang, standard] of Object.entries(dict)) {
    try { normalized = normalized.replace(new RegExp(slang, 'g'), standard); } catch (_) {}
  }
  return normalized;
};

// ─── System Prompt ───────────────────────────────────────────────────────────
const buildSystemPrompt = (language = 'en') => {
  // Tamil: real Tamil script — Sarvam Bulbul v3 TTS reads it perfectly including
  // "ங" (nga), "ழ" (zh), "ண" (retroflex n) and all colloquial forms
  const langInstruction =
    language === 'ta'
      ? `spoken Tamil (தமிழ்) using Tamil script.
Use colloquial spoken Tamil — NOT formal written Tamil:
  ✓ "தண்ணி குடுங்க" (not "தண்ணீர் கொடுங்கள்")
  ✓ "வேணும்" (not "வேண்டும்"), "ரொம்ப நல்லா" (not "மிகவும் நன்றாக")
  ✓ Address warmly as "அண்ணா", "அக்கா", "ஐயா"
Sarvam AI TTS will read the Tamil script with correct pronunciation.`
      : language === 'hi'
      ? `simple Hindi (Devanagari script). Keep sentences short and warm.`
      : `simple English`;

  const slangNote =
    language === 'ta'
      ? `CRITICAL — FARMER LANGUAGE RULES:
Farmers speak colloquial Tamil from Tamil Nadu (Madurai, Coimbatore, Thanjavur regions).
MUST understand spoken/slang forms:
• "தண்ணி"=water, "மண்ணு"=soil, "வெயிலு"=sunlight, "காத்து"=wind, "நெல்லு"=paddy
• "போடணும்"=need to apply, "அடிக்கணும்"=need to spray, "தெளிக்கணும்"=need to spray
• "காஞ்சிடுது"=dried up, "மக்கிடுது"=rotting, "சாகுது"=dying, "வாடுது"=wilting
• "மஞ்சளாகுது"=turning yellow, "கருகுது"=burning, "பழுப்பாகுது"=turning brown
• "ரொம்ப"=very much, "கொஞ்சம்"=a little, "வேணும்"=I need, "போதலை"=not enough
• Even romanized or broken Tamil — understand the INTENT
• Illiterate farmers describe symptoms, not disease names — DIAGNOSE from description

IMPORTANT OUTPUT RULES FOR TAMIL:
- You MUST reply entirely in natural spoken Tamil script (தமிழ்).
- NEVER use formal textbook Tamil (செந்தமிழ்).
- Use colloquial verb endings: "பண்ணுங்க" (not "செய்யுங்கள்"), "சொல்றேன்" (not "சொல்கிறேன்"), "இருக்கு" (not "இருக்கிறது").
- For example: "பூச்சி மருந்து அடிக்கணும்" instead of "பூச்சிக்கொல்லி தெளிக்க வேண்டும்".`
      : language === 'hi'
      ? `CRITICAL: Farmers use rural Hindi/Bhojpuri. Understand "पत्ता पीला"=leaf yellowing, "फसल मर रई"=crop dying, "कीड़ा लगा"=pest attack, "दवाई"=pesticide. Respond in simple, warm Hindi.`
      : `Farmers may use broken English. Understand intent. Respond simply.`;

  return `You are Uzhavar AI (உழவர் AI), a warm agricultural assistant for Tamil Nadu farmers.

Knowledge: crops (paddy, wheat, sugarcane, banana, groundnut, turmeric, cotton, vegetables, pulses), soil health, NPK fertilizers, organic manure, pest/disease ID with home remedies, weather-based advice, Tamil Nadu seasonal calendar, Government schemes (PM-KISAN ₹6000/yr, PMFBY crop insurance, Soil Health Card, Kisan Credit Card, eNAM), drip irrigation, market prices, organic farming (neem, panchagavya, jeevamrutha).

${slangNote}

RESPOND in ${langInstruction}

RULES:
1. ONLY output text in the requested script (Tamil script for Tamil, Devanagari for Hindi, English for English).
2. Simple language — like talking to an illiterate neighbor
3. Practical advice doable TODAY with local resources
4. Max 3-5 sentences (or up to 4 bullets)
5. Warm tone — address as "Anna", "Amma", or "Nanbare" (for Tamil)
6. Unsure? Give Kisan Helpline: 1800-180-1551 (free, 24/7)
7. Home remedy FIRST before suggesting buying chemicals
8. End with ONE clear action step`;
};

// ─── Groq API Call ────────────────────────────────────────────────────────────
export const callGroq = async (messages, language = 'en', onChunk = null) => {
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY missing. Get free key: https://console.groq.com');
  }

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [{ role: 'system', content: buildSystemPrompt(language) }, ...messages],
      temperature: 0.65,
      max_tokens: 450,
      top_p: 0.9,
      stream: !!onChunk,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq ${res.status}: ${errText}`);
  }

  if (onChunk) {
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      for (const line of decoder.decode(value).split('\n')) {
        const trimmed = line.replace(/^data: /, '').trim();
        if (!trimmed || trimmed === '[DONE]') continue;
        try {
          const content = JSON.parse(trimmed).choices?.[0]?.delta?.content;
          if (content) { fullText += content; onChunk(content, fullText); }
        } catch (_) {}
      }
    }
    return fullText;
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
};

// ─── Fallback Responses ───────────────────────────────────────────────────────
const FALLBACK_RESPONSES = {
  en: {
    weather: "Check local weather or call Kisan Call Center: 1800-180-1551 (free).",
    pest: "Spray neem oil solution (5ml per liter water) as a safe first step.",
    soil: "Get free soil testing under Soil Health Card scheme at your agriculture office.",
    scheme: "PM-KISAN (₹6000/year), PMFBY crop insurance, Kisan Credit Card available.",
    water: "Drip irrigation saves 50% water. Ask agriculture dept for subsidy.",
    default: "Trouble connecting. Call Kisan Call Center: 1800-180-1551 (free, 24/7)."
  },
  ta: {
    weather: "வானிலை அறிய கிசான் கால் சென்டர்: 1800-180-1551 (இலவசம்) அழைக்கவும்.",
    pest: "வேப்ப எண்ணெய் கரைசல் (1 லிட்டர் தண்ணிக்கு 5மி.லி) தெளிக்கவும்.",
    soil: "மண் சுகாதார அட்டை திட்டத்தில் இலவசமா மண் பரிசோதனை செய்யலாம்.",
    scheme: "PM-KISAN (₹6000/ஆண்டு), PMFBY பயிர் காப்பீடு பெறலாம்.",
    water: "சொட்டு நீர்ப்பாசனம் 50% தண்ணி சேமிக்கும். Agriculture office-ல subsidy இருக்கு.",
    default: "இப்போ பதில் சொல்ல சிரமம். கிசான் கால் சென்டர்: 1800-180-1551 அழைக்கவும்."
  },
  hi: {
    weather: "मौसम के लिए किसान कॉल सेंटर: 1800-180-1551 (मुफ़्त) पर कॉल करें।",
    pest: "नीम के तेल का घोल (1 लीटर पानी में 5ml) छिड़कें।",
    soil: "मृदा स्वास्थ्य कार्ड योजना में मुफ़्त मिट्टी जांच करवाएं।",
    scheme: "PM-KISAN (₹6000/साल), PMFBY फसल बीमा का लाभ लें।",
    water: "ड्रिप सिंचाई से 50% पानी बचता है।",
    default: "अभी जुड़ने में समस्या है। किसान कॉल सेंटर: 1800-180-1551 पर कॉल करें।"
  }
};

const detectTopic = (text) => {
  const t = text.toLowerCase();
  if (/weather|rain|மழை|வானிலை|வறட்சி|வெயில்|बारिश/.test(t)) return 'weather';
  if (/pest|insect|disease|பூச்சி|புழு|நோய்|மக்கி|காஞ்சி|சாகு|वाडु|कीट/.test(t)) return 'pest';
  if (/soil|மண்|கரிசல்|மண்ணு|मिट्टी|fertilizer|உரம்|खाद/.test(t)) return 'soil';
  if (/scheme|திட்டம்|योजना|government|சர்க்கார்|கடன்|காப்பீடு|बीमा/.test(t)) return 'scheme';
  if (/water|தண்ணீர்|தண்ணி|நீர்|पानी|सिंचाई/.test(t)) return 'water';
  return 'default';
};

export const getFallbackResponse = (query, language = 'en') =>
  FALLBACK_RESPONSES[language]?.[detectTopic(query)] || FALLBACK_RESPONSES.en[detectTopic(query)];

// ─── Main Entry Point ─────────────────────────────────────────────────────────
export const askLLM = async (messages, language = 'en', onChunk = null) => {
  const normalizedMessages = messages.map((m, i) =>
    i === messages.length - 1 && m.role === 'user'
      ? { ...m, content: normalizeSlang(m.content, language) }
      : m
  );

  try {
    return await callGroq(normalizedMessages, language, onChunk);
  } catch (err) {
    console.warn('Groq unavailable, using fallback:', err.message);
    const lastMsg = messages[messages.length - 1];
    const fallback = getFallbackResponse(lastMsg?.content || '', language);
    if (onChunk) {
      for (const [i, word] of fallback.split(' ').entries()) {
        await new Promise(r => setTimeout(r, 40));
        onChunk(word + ' ', fallback.split(' ').slice(0, i + 1).join(' '));
      }
    }
    return fallback;
  }
};

export const translateText = async (text, targetLang) => {
  try {
    const prompt = targetLang === 'ta'
      ? `Translate to simple spoken Tamil for a Tamil farmer (use colloquial: "தண்ணி", "வேணும்", not formal): "${text}"`
      : targetLang === 'hi'
      ? `Translate to simple Hindi for a farmer: "${text}"`
      : `Translate to simple English: "${text}"`;
    return await callGroq([{ role: 'user', content: prompt }], 'en');
  } catch (_) { return text; }
};
