import { ScrapingResult } from './scraper';
import { PageSpeedResult } from './pagespeed';
import { MozMetrics, mozMetricsToScores } from './moz';
import { DomainKeywordMetrics, keywordMetricsToScores } from './dataforseo';
import { GSCMetrics, gscMetricsToScores } from './google-search-console';

// New 5-pillar structure (108 pts total, normalized to 100)
export interface PillarScores {
  contentStructure: number;   // 30 pts
  brandRanking: number;       // 10 pts (was combined with technical)
  websiteTechnical: number;   // 18 pts (NEW - separated from brand)
  keywordVisibility: number;  // 25 pts
  aiTrust: number;            // 25 pts
}

export interface MetricDetail {
  score: number;
  value?: string | number;
  insight?: string;
  recommendation?: string;
}

export interface DetailedScores extends PillarScores {
  total: number;              // Normalized to 100
  rawTotal: number;           // Raw 108
  breakdown: {
    contentStructure: {
      schema: MetricDetail;
      headings: MetricDetail;
      multimodal: MetricDetail;
      imageAlt: MetricDetail;       // NEW
      tableLists: MetricDetail;
      directAnswer: MetricDetail;
      contentGap: MetricDetail;
    };
    brandRanking: {
      brandSearch: MetricDetail;
      brandSentiment: MetricDetail; // NEW
    };
    websiteTechnical: {             // NEW pillar
      lcp: MetricDetail;
      inp: MetricDetail;
      cls: MetricDetail;
      mobile: MetricDetail;
      ssl: MetricDetail;
      brokenLinks: MetricDetail;
      llmsTxt: MetricDetail;        // NEW
      sitemap: MetricDetail;        // NEW
    };
    keywordVisibility: {
      keywords: MetricDetail;
      positions: MetricDetail;
      intentMatch: MetricDetail;
    };
    aiTrust: {
      backlinks: MetricDetail;
      referringDomains: MetricDetail;
      sentiment: MetricDetail;
      eeat: MetricDetail;
      local: MetricDetail;
    };
  };
  dataSource: {
    moz: boolean;
    dataforseo: boolean;
    gsc: boolean;
    pagespeed: boolean;
    scraping: boolean;
    ahrefs: boolean;    // NEW
    gemini: boolean;    // NEW
  };
}

export function calculateContentStructureScore(scraping: ScrapingResult): {
  score: number;
  breakdown: DetailedScores['breakdown']['contentStructure'];
} {
  let schemaScore = 0;
  let tableListScore = 0;
  let headingScore = 0;
  let multimodalScore = 0;
  let directAnswerScore = 0;
  let contentGapScore = 0;

  // 1. Schema Coverage (9 points)
  let schemaInsight = "";
  let schemaRec = "";

  if (!scraping.hasSchema) {
    schemaInsight = `No schema markup detected. Without structured data, AI systems (Google AI Overviews, ChatGPT, Perplexity) cannot understand your content's context, making it unlikely to be cited in AI responses. Schema markup is critical for GEO (Generative Engine Optimization) as it helps LLMs parse and extract information accurately.`;
    schemaRec = `Implement JSON-LD schema markup immediately: 1) Add Article or BlogPosting schema to all content pages, 2) Add FAQPage schema to pages with Q&A sections (this dramatically increases AI citation chances), 3) Add HowTo schema for tutorial/guide content, 4) Validate with Google's Rich Results Test. Start with FAQPage schema as it's proven to increase AI Overview citations by 40%+.`;
  } else {
    schemaScore += 4;
    const richTypes = ['FAQ', 'HowTo', 'Product', 'Recipe', 'Article'];
    const foundRichTypes = scraping.schemaTypes.filter(type =>
      richTypes.some(rich => type.includes(rich))
    );

    if (foundRichTypes.length > 0) {
      schemaScore += 5;
      schemaInsight = `Rich schema types detected: ${foundRichTypes.join(', ')}. This is excellent for AI visibility because structured data helps LLMs understand content relationships and extract key information. FAQPage schema is particularly valuable for AI Overview citations, while HowTo schema helps with step-by-step queries. Your content is well-structured for GEO optimization.`;
      schemaRec = `Maintain and expand your schema implementation: 1) Ensure all FAQPage schemas include natural-language questions (not just keywords), 2) Add Article schema with author information for E-E-A-T signals, 3) Consider adding LocalBusiness schema if applicable, 4) Regularly validate schema with Google's Rich Results Test to catch any errors.`;
    } else {
      schemaInsight = `Basic schema detected (${scraping.schemaTypes.join(', ') || 'generic'}), but no rich schema types found. While basic schema helps, rich schema types (FAQPage, HowTo, Article) significantly increase your chances of being cited in AI Overviews. Without FAQPage schema, you're missing a major opportunity for AI citation.`;
      schemaRec = `Upgrade to rich schema types: 1) Add FAQPage schema with 3-5 natural questions and answers (this is the #1 schema for AI Overview citations), 2) Add Article schema with author credentials for E-E-A-T, 3) Add HowTo schema if you have tutorial content, 4) Use Google's Structured Data Testing Tool to validate. FAQPage schema alone can increase AI citation rates by 40%+.`;
    }
  }

  // 2. Table/List Utilization (2 points)
  if (scraping.tableCount >= 1) tableListScore += 1;
  if (scraping.listCount >= 3) tableListScore += 1;
  else if (scraping.listCount >= 1) tableListScore += 0.5;

  const tableListValue = `${scraping.tableCount} Tables, ${scraping.listCount} Lists`;
  let tableListInsight = "";
  let tableListRec = "";

  if (tableListScore >= 2) {
    tableListInsight = `Excellent structured content: ${scraping.tableCount} tables and ${scraping.listCount} lists detected. Tables and lists are critical for AI readability because LLMs can easily extract structured information from them. AI assistants often pull data directly from comparison tables, making this format ideal for GEO optimization. Your content structure supports both human readers and AI systems.`;
    tableListRec = `Maintain this structured approach: 1) Keep using comparison tables for product/service comparisons (AI frequently cites these), 2) Use bulleted lists for feature lists and benefits, 3) Consider adding more comparison tables for competitive content, 4) Ensure tables are HTML-based (not images) so AI can parse them.`;
  } else if (tableListScore >= 1) {
    tableListInsight = `Some structured content found (${scraping.tableCount} tables, ${scraping.listCount} lists), but more is needed. AI systems prefer structured formats because they can extract information more accurately. Without sufficient tables and lists, your content may be overlooked when AI needs to cite specific data points or comparisons.`;
    tableListRec = `Add more structured content: 1) Create comparison tables for any product/service comparisons (these are gold for AI citations), 2) Convert long paragraphs into bulleted lists where appropriate, 3) Add feature comparison tables if comparing options, 4) Use HTML tables (not images) so AI can parse the data. Aim for at least 2 tables and 5+ lists per page for optimal AI readability.`;
  } else {
    tableListInsight = `Content lacks structured data formats (${scraping.tableCount} tables, ${scraping.listCount} lists). This is a major missed opportunity for AI citation. AI assistants frequently pull information directly from comparison tables and structured lists. Without these formats, your content is harder for LLMs to parse and cite, reducing your chances of appearing in AI Overviews.`;
    tableListRec = `Implement structured content immediately: 1) Add comparison tables for any product/service comparisons (AI often cites these directly), 2) Convert key information into bulleted lists (AI can extract these easily), 3) Use HTML tables for data comparisons (not images), 4) Add feature comparison tables if relevant. Tables and lists increase AI citation probability by 30%+. Start with at least 1 comparison table and 3+ bulleted lists per page.`;
  }

  // 3. Heading Structure (6 points)
  const hasH1 = scraping.h1.length > 0;
  const hasH2 = scraping.h2.length > 0;
  const hasH3 = scraping.h3.length > 0;
  const properH1Count = scraping.h1.length === 1;
  const multipleH1 = scraping.h1.length > 1;

  // +3.5 points: Exactly 1 H1 (most important)
  if (properH1Count) {
    headingScore += 3.5;
  }

  // Hierarchy scoring (H1 > H2 nesting)
  if (hasH1 && hasH2) {
    if (properH1Count) {
      // +2 points: Good hierarchy with proper single H1
      headingScore += 2;
    } else if (multipleH1) {
      // +1 point: Has hierarchy but penalized for multiple H1
      headingScore += 1;
    }
  }

  // +0.5 points: Has all heading levels (H1, H2, H3)
  if (hasH1 && hasH2 && hasH3) {
    headingScore += 0.5;
  }

  let headingInsight = "";
  let headingRec = "";

  if (scraping.h1.length === 0) {
    headingInsight = `Missing H1 tag - this is critical for both SEO and AI understanding. Without an H1, search engines and AI systems cannot identify the main topic of your page. H1 tags create a clear content outline that helps AI understand page structure and extract key information. This significantly reduces your chances of being cited in AI Overviews because LLMs rely on heading hierarchy to understand content organization.`;
    headingRec = `Add exactly one H1 tag that: 1) Includes your primary keyword naturally, 2) Describes the main topic clearly, 3) Matches user search intent, 4) Is placed near the top of the page (within first 100 words). The H1 should answer "What is this page about?" in a way that both humans and AI can understand. Example: "Complete Guide to [Topic] in 2025" or "How to [Action] - Step-by-Step Guide".`;
  } else if (multipleH1) {
    headingInsight = `Multiple H1 tags found (${scraping.h1.length}) - this confuses both search engines and AI systems. Google recommends exactly one H1 per page. Multiple H1s dilute the main topic signal and make it harder for AI to identify the primary subject. This hurts your GEO optimization because AI systems use H1 to understand what your content is about.`;
    headingRec = `Fix heading structure: 1) Keep only ONE H1 that best represents the main topic, 2) Convert all other H1s to H2 tags, 3) Ensure proper hierarchy: H1 → H2 → H3 (never skip levels), 4) Use H2s for main sections and H3s for subsections. This creates a clear content outline that AI can follow. Example structure: H1 (main topic) → H2 (section 1) → H3 (subsection 1.1) → H2 (section 2).`;
  } else if (properH1Count && hasH2 && hasH3) {
    headingInsight = `Excellent heading structure: 1 H1, ${scraping.h2.length} H2s, and ${scraping.h3.length} H3s create a clear content hierarchy. This structure helps AI systems understand your content organization and extract information efficiently. Proper heading hierarchy is essential for GEO optimization because it allows LLMs to navigate your content and cite specific sections accurately.`;
    headingRec = `Maintain this structure: 1) Keep exactly one H1 per page, 2) Use H2s for main sections (break content every 300 words), 3) Use H3s for subsections within H2s, 4) Ensure headings include relevant keywords naturally, 5) Make headings question-based when possible (e.g., "What is...?" "How to...?") as this matches AI query patterns. This structure maximizes both SEO and AI citation potential.`;
  } else if (properH1Count && hasH2) {
    headingInsight = `Good foundation with proper H1 and ${scraping.h2.length} H2 sections, but missing H3 subsections. While this works for basic content, adding H3s creates deeper structure that helps AI understand content relationships. Without H3s, longer sections become harder for AI to parse, reducing citation opportunities for specific subtopics.`;
    headingRec = `Enhance heading hierarchy: 1) Add H3 tags to break up longer H2 sections (aim for H3 every 200-300 words), 2) Use H3s for specific subtopics or FAQs within main sections, 3) Ensure H3s are nested under H2s (never skip levels), 4) Make H3s question-based when possible (matches AI query patterns). Example: H1 "SEO Guide" → H2 "Technical SEO" → H3 "What is Core Web Vitals?" → H3 "How to Optimize LCP?". This structure increases AI citation chances for specific topics.`;
  } else if (properH1Count) {
    headingInsight = `Has proper H1 but missing H2/H3 hierarchy. Without section headings (H2s), your content lacks structure that helps AI understand organization. AI systems use heading hierarchy to create content outlines and extract information. Without H2s, your content appears as one long block, making it harder for AI to identify and cite specific sections.`;
    headingRec = `Build proper heading structure: 1) Add H2 tags for each main section (break content every 300 words), 2) Use H2s to answer different aspects of the main topic, 3) Add H3s for subsections within H2s, 4) Make H2s question-based when possible (e.g., "What is...?" "How does...?" "Why is...?") as this matches how AI processes queries. Example: H1 "SEO Guide" → H2 "What is Technical SEO?" → H2 "How to Optimize Core Web Vitals?" → H2 "Why is Schema Important?". This structure dramatically improves AI readability and citation potential.`;
  }

  const headingValue = `H1: ${scraping.h1.length}, H2: ${scraping.h2.length}, H3: ${scraping.h3.length}`;


  // 4. Multimodal Content (5 points)
  const imageAltRatio = scraping.imageCount > 0
    ? scraping.imagesWithAlt / scraping.imageCount
    : 0;

  if (imageAltRatio >= 0.8) multimodalScore += 2;
  else if (imageAltRatio >= 0.5) multimodalScore += 1;

  if (scraping.videoCount >= 2) multimodalScore += 2;
  else if (scraping.videoCount >= 1) multimodalScore += 1;

  if (scraping.imageCount >= 5 || scraping.videoCount >= 1) multimodalScore += 1;

  const multimodalValue = `${scraping.imageCount} Images (${Math.round(imageAltRatio * 100)}% Alt), ${scraping.videoCount} Videos`;

  // 5. Direct Answer (5 points)
  if (scraping.wordCount >= 50 && scraping.h1.length > 0) {
    directAnswerScore = 5;
  } else if (scraping.wordCount >= 30) {
    directAnswerScore = 3;
  } else if (scraping.wordCount >= 15) {
    directAnswerScore = 1;
  }

  // 6. Content Gap (3 points)
  if (scraping.wordCount >= 1000 && scraping.h2.length >= 3) {
    contentGapScore = 3;
  } else if (scraping.wordCount >= 500) {
    contentGapScore = 2;
  } else if (scraping.wordCount >= 200) {
    contentGapScore = 1;
  }

  const total = Math.min(30, Math.round(
    schemaScore + tableListScore + headingScore +
    multimodalScore + directAnswerScore + contentGapScore
  ));

  // Image ALT scoring (3 pts) - FIXED
  // Score based on percentage of images with alt text
  // Excludes small images (assumed to be icons) in a real implementation
  let imageAltScore = 0;
  let imageAltValue = 'No images';

  if (scraping.imageCount > 0) {
    const altCoverage = (scraping.imagesWithAlt / scraping.imageCount) * 100;

    if (altCoverage >= 80) {
      imageAltScore = 3;
      imageAltValue = `${Math.round(altCoverage)}% coverage (Excellent)`;
    } else if (altCoverage >= 60) {
      imageAltScore = 2;
      imageAltValue = `${Math.round(altCoverage)}% coverage (Good)`;
    } else if (altCoverage >= 40) {
      imageAltScore = 1;
      imageAltValue = `${Math.round(altCoverage)}% coverage (Needs improvement)`;
    } else {
      imageAltScore = 0;
      imageAltValue = `${Math.round(altCoverage)}% coverage (Poor)`;
    }
  }

  // Multimodal insights
  let multimodalInsight = "";
  let multimodalRec = "";
  
  if (multimodalScore >= 4) {
    multimodalInsight = `Excellent multimodal content: ${scraping.imageCount} images (${Math.round(imageAltRatio * 100)}% with alt text) and ${scraping.videoCount} videos. Multimodal content is crucial for GEO optimization because AI systems can extract information from images (via alt text) and videos (via transcripts). Rich visual content signals comprehensive coverage to AI, increasing citation likelihood. Your content provides multiple content types that enhance understanding.`;
    multimodalRec = `Maintain this multimodal approach: 1) Keep alt text coverage above 80% for all images, 2) Add transcripts to videos (AI can read these), 3) Use images to illustrate key concepts (screenshots, infographics, diagrams), 4) Ensure images are optimized (WebP format, compressed) for fast loading, 5) Consider adding more infographics or process diagrams as these are frequently cited by AI.`;
  } else if (multimodalScore >= 2) {
    multimodalInsight = `Moderate multimodal content: ${scraping.imageCount} images (${Math.round(imageAltRatio * 100)}% with alt text) and ${scraping.videoCount} videos. While you have some visual elements, more multimodal content would significantly improve AI understanding. AI systems use images (via alt text) and videos (via transcripts) to understand content better. Without sufficient multimodal signals, your content may be overlooked when AI needs visual context.`;
    multimodalRec = `Enhance multimodal content: 1) Add more images with descriptive alt text (aim for 5+ images per page, especially screenshots, infographics, or process diagrams), 2) Embed relevant videos with transcripts (AI can read transcripts), 3) Use images to break up text and illustrate concepts, 4) Ensure all images >200px have descriptive alt text (not just "image" or "photo"), 5) Consider adding comparison infographics or flowcharts as these are frequently cited by AI. Multimodal content increases AI citation probability by 25%+.`;
  } else {
    multimodalInsight = `Limited multimodal content: Only ${scraping.imageCount} images and ${scraping.videoCount} videos found. This is a major gap for GEO optimization. AI systems rely on multimodal signals (images with alt text, videos with transcripts) to understand content comprehensively. Text-only content is harder for AI to process and cite, especially for visual concepts. Without sufficient visual elements, your content lacks the richness that AI systems prefer when selecting citations.`;
    multimodalRec = `Add multimodal content immediately: 1) Add 5+ images per page with descriptive alt text (screenshots, infographics, diagrams work best), 2) Embed relevant videos with transcripts (AI can read transcripts to understand video content), 3) Use images to illustrate key concepts and break up long text blocks, 4) Ensure all images >200px have descriptive alt text that explains what the image shows (not generic text), 5) Consider adding comparison infographics or process flowcharts as these are frequently cited by AI. Multimodal content is essential for AI Overview citations - aim for at least 5 images and 1 video per comprehensive page.`;
  }

  // Direct Answer insights
  let directAnswerInsight = '';
  let directAnswerRec = '';
  if (directAnswerScore >= 5) {
    directAnswerInsight = `Content starts with a clear, direct answer (${scraping.wordCount >= 50 ? '50+' : scraping.wordCount} words) that addresses the main query immediately. This is excellent for GEO optimization because AI systems extract the first 50-100 words to understand what your content answers. When AI Overviews need a quick answer, they look for direct answers in the opening paragraph. Your content structure follows the "inverted pyramid" approach that AI prefers.`;
    directAnswerRec = `Maintain this direct answer format: 1) Keep answering the main query in the first 50-100 words, 2) Use the "inverted pyramid" structure (answer first, details later), 3) Make the opening paragraph standalone (AI often extracts just this), 4) Include key facts/numbers in the opening if relevant, 5) Ensure the first paragraph can serve as a featured snippet answer. This format maximizes AI citation chances.`;
  } else if (directAnswerScore >= 3) {
    directAnswerInsight = `Content has a brief introduction (${scraping.wordCount} words) but could be more direct. While you have some opening content, it may not clearly answer the main query immediately. AI systems prioritize content that answers queries in the first 50 words. Without a direct answer upfront, your content may be overlooked when AI needs quick information. The opening should answer "What is this about?" immediately.`;
    directAnswerRec = `Restructure the opening: 1) Answer the main query in the first 50 words (use the "inverted pyramid" approach), 2) Start with a direct answer, then provide context, 3) Include key facts or numbers in the opening if relevant, 4) Make the first paragraph standalone (AI often extracts just this), 5) Ensure the opening can serve as a featured snippet answer. Example: "Generative Engine Optimization (GEO) is the practice of optimizing content so AI systems like Google AI Overviews can discover, understand, and cite your content. Unlike traditional SEO focused on rankings, GEO focuses on being cited in AI responses..."`;
  } else if (directAnswerScore >= 1) {
    directAnswerInsight = `Content has minimal introduction (${scraping.wordCount} words) but lacks a clear direct answer to the main query. This is a critical gap for GEO optimization. AI systems extract the first 50 words to understand what your content answers. Without a direct answer upfront, AI cannot quickly identify if your content is relevant, reducing citation chances. The opening should immediately answer the user's query.`;
    directAnswerRec = `Add a direct answer immediately: 1) Restructure the opening to answer the main query in the first 50 words, 2) Use the "inverted pyramid" structure (answer first, details later), 3) Start with "What is...?" or "How to...?" format if applicable, 4) Include key facts in the opening, 5) Make the first paragraph standalone and comprehensive. Example: "SEO in 2025 requires three key elements: GEO optimization for AI citations, Core Web Vitals performance, and E-E-A-T signals. Unlike traditional SEO..." This format dramatically increases AI citation probability.`;
  } else {
    directAnswerInsight = `Content lacks a direct answer or TL;DR section at the beginning. This is a major problem for GEO optimization. AI systems scan the first 50-100 words to understand what your content answers. Without a direct answer upfront, AI cannot quickly identify relevance, significantly reducing your chances of being cited in AI Overviews. The opening should immediately answer the user's query, not build up to it.`;
    directAnswerRec = `Implement direct answer format: 1) Add a clear, concise answer to the main question in the first 50 words (use "inverted pyramid" structure), 2) Answer "What is this about?" immediately, 3) Include key facts or numbers in the opening if relevant, 4) Make the first paragraph standalone (AI often extracts just this), 5) Ensure the opening can serve as a featured snippet. Example: "[Topic] is [definition]. It works by [key mechanism]. The main benefits are [3 key points]. Here's how to [action]..." This format is essential for AI citation - it increases citation probability by 50%+.`;
  }

  // Content Gap insights
  let contentGapInsight = '';
  let contentGapRec = '';
  if (contentGapScore >= 3) {
    contentGapInsight = `Comprehensive content depth: ${scraping.wordCount} words with ${scraping.h2.length} main sections. This level of depth signals comprehensive coverage to both search engines and AI systems. Deep, well-structured content is more likely to be cited by AI because it provides thorough information that answers multiple aspects of a query. Your content matches or exceeds competitor depth, giving you a competitive advantage.`;
    contentGapRec = `Maintain this comprehensive approach: 1) Keep updating content quarterly with fresh information, 2) Add new sections when competitors publish new angles, 3) Include original data or insights to maintain information gain advantage, 4) Expand sections that competitors cover but you don't, 5) Monitor competitor content depth and ensure you match or exceed it. Comprehensive content depth is essential for both rankings and AI citations.`;
  } else if (contentGapScore >= 2) {
    contentGapInsight = `Good content depth: ${scraping.wordCount} words with ${scraping.h2.length} sections, but could expand further to match top competitors. While your content covers the basics, top-ranking pages typically have 1000+ words with 3+ main sections. Shorter content may miss information gaps that competitors cover, reducing your chances of being cited when AI needs comprehensive answers.`;
    contentGapRec = `Expand content depth: 1) Add 2-3 more main sections (H2s) covering related subtopics, 2) Expand each section to 200-300 words with specific details, 3) Add FAQ section addressing "People Also Ask" questions, 4) Include original data, case studies, or expert quotes to add information gain, 5) Cover aspects that competitors mention but you don't. Aim for 1000+ words with 3+ main sections to match top competitors. This depth increases AI citation probability by 30%+.`;
  } else if (contentGapScore >= 1) {
    contentGapInsight = `Moderate content depth: ${scraping.wordCount} words is significantly shorter than top competitors (typically 1000+ words). This content gap is problematic because: 1) Competitors likely cover topics you don't, 2) AI systems prefer comprehensive content that answers multiple aspects of a query, 3) Shorter content may miss information that users (and AI) expect. Without sufficient depth, your content may be overlooked when AI needs thorough answers.`;
    contentGapRec = `Significantly expand content: 1) Add 3+ main sections (H2s) covering different aspects of the topic, 2) Expand each section to 200-300 words with specific details and examples, 3) Add FAQ section with 5-10 questions from "People Also Ask", 4) Include original data, statistics, or expert insights to add information gain, 5) Analyze competitor content to identify gaps you should cover. Aim for 500+ words minimum, ideally 1000+ words with multiple sections. This depth is essential for competing with top-ranking pages and increasing AI citation chances.`;
  } else {
    contentGapInsight = `Limited content depth: Only ${scraping.wordCount} words is much shorter than competitors (typically 1000+ words for comprehensive topics). This is a critical content gap because: 1) Your content likely misses key information that competitors cover, 2) AI systems prefer comprehensive content that thoroughly answers queries, 3) Shorter content signals thin coverage to both search engines and AI, 4) You're missing opportunities to cover related subtopics that users search for. Without sufficient depth, your content will struggle to compete and be cited by AI.`;
    contentGapRec = `Dramatically expand content immediately: 1) Add 5+ main sections (H2s) covering different aspects of the topic, 2) Expand each section to 200-300 words with specific details, examples, and actionable advice, 3) Add comprehensive FAQ section (10+ questions) from "People Also Ask", 4) Include original data, case studies, expert quotes, or statistics to add information gain, 5) Analyze top 5 competitor pages to identify all topics they cover that you don't, 6) Add comparison tables, lists, and visual elements. Aim for 1000+ words with 5+ main sections. This depth is non-negotiable for competing with top pages and maximizing AI citation potential.`;
  }

  // Image Alt insights
  let imageAltInsight = '';
  let imageAltRec = '';
  if (imageAltScore >= 3) {
    imageAltInsight = `${imageAltValue}. Excellent alt text coverage is crucial for GEO optimization because AI systems use alt text to understand images. When AI needs to describe visual content or cite information from images, descriptive alt text enables accurate extraction. Your images are well-optimized for both accessibility and AI understanding.`;
    imageAltRec = `Maintain this standard: 1) Keep alt text coverage above 80% for all images, 2) Ensure alt text describes what the image shows (not just "image" or "photo"), 3) Include relevant keywords naturally in alt text when appropriate, 4) For infographics or diagrams, describe the key information shown, 5) Update alt text if images change. Descriptive alt text helps AI understand visual content and increases citation chances for image-rich queries.`;
  } else if (imageAltScore >= 2) {
    imageAltInsight = `${imageAltValue}. While most images have alt text, reaching 80%+ coverage is important for GEO optimization. AI systems rely on alt text to understand images, and missing alt text means AI cannot extract information from those images. This reduces your content's multimodal signal strength, potentially impacting AI citation chances for visual queries.`;
    imageAltRec = `Complete alt text coverage: 1) Add descriptive alt text to all remaining images (especially those >200px), 2) Describe what the image shows, not just generic terms, 3) For infographics, describe the key data or information displayed, 4) Include relevant keywords naturally when appropriate, 5) Aim for 80%+ coverage to maximize AI understanding. Example: Instead of "chart", use "Bar chart showing SEO traffic growth from 2020-2025, increasing from 1,000 to 15,000 monthly visitors". This level of detail helps AI extract information from images.`;
  } else if (imageAltScore >= 1) {
    imageAltInsight = `${imageAltValue}. This low coverage is problematic for GEO optimization because AI systems cannot understand images without alt text. When AI needs to cite visual information or describe content, missing alt text means those images are invisible to AI. This significantly reduces your multimodal content signal and limits AI citation opportunities for image-related queries.`;
    imageAltRec = `Add alt text immediately: 1) Add descriptive alt text to ALL images >200px (this is critical for AI understanding), 2) Describe what the image shows in detail (not just "image" or "photo"), 3) For infographics or charts, describe the key data or information displayed, 4) Include relevant keywords naturally when appropriate, 5) Aim for 80%+ coverage. Example: Instead of "screenshot", use "Screenshot of Google Search Console showing Core Web Vitals report with LCP at 2.1s, INP at 150ms, and CLS at 0.05". This detail enables AI to extract information from images.`;
  } else {
    imageAltInsight = imageAltValue || 'No images found or no alt text detected. This is a critical gap for GEO optimization. Images with descriptive alt text are essential for multimodal content signals that AI systems use to understand your content. Without alt text, images are invisible to AI, reducing your chances of being cited for visual queries or when AI needs to describe visual content.';
    imageAltRec = `Implement alt text strategy: 1) Add descriptive alt text to ALL images (especially those >200px), 2) Describe what the image shows in detail, not generic terms, 3) For infographics/charts, describe the key information or data displayed, 4) Include relevant keywords naturally when appropriate, 5) Aim for 80%+ coverage. Example: "Comparison table showing SEO tools: Ahrefs (DA: 91), Semrush (DA: 88), Moz (DA: 92) with pricing and features". This level of detail enables AI to extract information from images and increases citation chances. Alt text is non-negotiable for GEO optimization.`;
  }

  return {
    score: total,
    breakdown: {
      schema: { score: schemaScore, value: scraping.schemaTypes.join(', ') || 'None', insight: schemaInsight, recommendation: schemaRec },
      headings: { score: headingScore, value: headingValue, insight: headingInsight, recommendation: headingRec },
      multimodal: { score: multimodalScore, value: multimodalValue, insight: multimodalInsight, recommendation: multimodalRec },
      imageAlt: { score: imageAltScore, value: imageAltValue, insight: imageAltInsight, recommendation: imageAltRec },
      tableLists: { score: tableListScore, value: tableListValue, insight: tableListInsight, recommendation: tableListRec },
      directAnswer: { score: directAnswerScore, value: directAnswerScore >= 3 ? 'Present' : 'Missing', insight: directAnswerInsight, recommendation: directAnswerRec },
      contentGap: { score: contentGapScore, value: `${scraping.wordCount} words`, insight: contentGapInsight, recommendation: contentGapRec }
    }
  };
}

// PILLAR 2: Brand Ranking (10 points)
// - brandSearch: 5 pts
// - brandSentiment: 5 pts
export function calculateBrandRankingScore(
  scraping: ScrapingResult,
  // TODO: Add Ahrefs data for brand search
  // TODO: Add Gemini sentiment data
): {
  score: number;
  breakdown: DetailedScores['breakdown']['brandRanking'];
} {
  // Brand Search Score (5 points)
  // TODO: Implement with Ahrefs API - search for brand name keyword
  // - Rank 1 = 5 points
  // - Rank 2-3 = 3 points
  // - Rank 4-10 = 1.5 points
  // - Not in top 10 = 0 points
  const brandSearchScore = 0; // Pending Ahrefs API
  
  // Extract domain name for brand search check
  let domainName = '';
  try {
    const url = new URL(scraping.url);
    domainName = url.hostname.replace('www.', '').split('.')[0];
  } catch {}

  // Brand Sentiment Score (5 points)
  // TODO: Implement with Gemini Deep Research
  // - 2+ community positive = 5 pts
  // - 1 community pos + PR = 4 pts
  // - Neutral/Mixed = 2.5 pts
  // - PR only = 2 pts
  // - 1 community negative = 1 pt
  // - 2+ community negative = 0 pts (OVERRIDE)
  const brandSentimentScore = 0; // Pending Gemini API

  const total = Math.round(brandSearchScore + brandSentimentScore);

  return {
    score: total,
    breakdown: {
      brandSearch: {
        score: brandSearchScore,
        value: domainName || 'Unknown',
        insight: `Brand search ranking analysis requires Ahrefs API integration. Currently unable to verify if "${domainName || 'your brand'}" ranks #1 for branded searches. This metric scores 0/5 points until API is configured.`,
        recommendation: `To improve Brand Search Rank: 1) Connect Ahrefs API to check actual ranking position, 2) Ensure your brand name appears in title tags and H1 headings, 3) Build brand awareness through PR and social media, 4) Create a dedicated brand page optimized for your brand name keyword.`
      },
      brandSentiment: {
        score: brandSentimentScore,
        value: 'Not analyzed',
        insight: `Brand sentiment analysis requires Gemini API integration. Currently unable to analyze community sentiment from sources like Reddit, Pantip, reviews, or social media. This metric scores 0/5 points until API is configured.`,
        recommendation: `To improve Brand Sentiment: 1) Connect Gemini API for sentiment analysis, 2) Monitor community discussions (Reddit, Pantip, forums), 3) Respond to reviews and feedback proactively, 4) Build positive brand associations through content marketing, 5) Address any negative sentiment quickly and transparently.`
      }
    }
  };
}

// PILLAR 3: Website Technical (18 points)
// - LCP: 3 pts (<5s = 3, 5-7s = 1.5, >7s = 0)
// - INP: 1 pt (≤200ms = 1, >200ms = 0)
// - CLS: 1 pt (0 = 1, >0 = 0)
// - Mobile: 3 pts
// - SSL: 3 pts (HTTPS = 3, No HTTPS = 0)
// - Broken Links: 2 pts
// - LLMs.txt: 2.5 pts
// - Sitemap: 2.5 pts (must have ALL required elements)
export function calculateWebsiteTechnicalScore(
  scraping: ScrapingResult,
  pagespeed: PageSpeedResult
): {
  score: number;
  breakdown: DetailedScores['breakdown']['websiteTechnical'];
} {
  let lcpScore = 0;
  let inpScore = 0;
  let clsScore = 0;
  let mobileScore = 0;
  let sslScore = 0;
  let brokenLinksScore = 2; // Default to good until link checker implemented
  let llmsTxtScore = 0;
  let sitemapScore = 0;

  // LCP Score (3 points) - NEW THRESHOLDS
  // <5s = 3pts, 5-7s = 1.5pts, >7s = 0pts
  const lcpSeconds = pagespeed.lcp || 0;
  if (lcpSeconds < 5) lcpScore = 3;
  else if (lcpSeconds <= 7) lcpScore = 1.5;
  // else 0

  // INP Score (1 point) - SIMPLIFIED
  // ≤200ms = 1pt, >200ms = 0pts
  const inpMs = pagespeed.fid || 0; // Using FID as proxy
  if (inpMs <= 200) inpScore = 1;
  // else 0

  // CLS Score (1 point) - Per measurement_config.md
  // ≤0.1 (Good) = 1pt, >0.1 = 0pts
  const clsValue = pagespeed.cls ?? 0;
  if (clsValue <= 0.1) clsScore = 1;
  // else 0

  // Mobile Score (3 points)
  if (pagespeed.mobileScore >= 90) mobileScore = 3;
  else if (pagespeed.mobileScore >= 50) mobileScore = 1.5;

  // SSL Score (3 points) - SIMPLIFIED
  // HTTPS = 3pts, No HTTPS = 0pts
  if (scraping.hasSSL) sslScore = 3;

  // LLMs.txt Score (2 points) - From scraper detection
  llmsTxtScore = scraping.hasLlmsTxt ? 2 : 0;

  // Sitemap Score (2 points) - From scraper validation
  sitemapScore = scraping.sitemapValid ? 2 : 0;

  const total = Math.round(
    lcpScore + inpScore + clsScore + mobileScore +
    sslScore + brokenLinksScore + llmsTxtScore + sitemapScore
  );

  // LCP Insights
  let lcpInsight = '';
  let lcpRec = '';
  if (lcpScore >= 3) {
    lcpInsight = `LCP (Largest Contentful Paint) is ${lcpSeconds.toFixed(2)}s, which is excellent (< 2.5s target). Fast LCP is critical for Core Web Vitals and user experience. Google uses LCP as a ranking factor, and fast-loading pages are more likely to be crawled and indexed efficiently. This performance level supports both SEO and GEO optimization.`;
    lcpRec = `Maintain this performance: 1) Continue optimizing images (use WebP/AVIF format, compress files), 2) Keep using CDN for fast delivery, 3) Preload critical resources, 4) Minimize server response time (TTFB < 800ms), 5) Monitor LCP monthly to catch regressions. Fast LCP improves both rankings and user experience.`;
  } else if (lcpScore >= 1.5) {
    lcpInsight = `LCP is ${lcpSeconds.toFixed(2)}s, which needs improvement (target: < 2.5s for optimal). While not poor, this speed may impact Core Web Vitals scores and user experience. Google uses LCP as a ranking factor, and slower pages may rank lower. Additionally, slow-loading pages are crawled less frequently, potentially impacting indexation.`;
    lcpRec = `Optimize LCP immediately: 1) Identify LCP element (usually hero image or H1) and preload it, 2) Optimize images (convert to WebP/AVIF, compress to reduce file size), 3) Use CDN for faster delivery, 4) Minimize server response time (TTFB < 800ms), 5) Consider lazy-loading below-the-fold images. Target: < 2.5s for optimal Core Web Vitals score. Fast LCP is essential for both rankings and user retention.`;
  } else {
    lcpInsight = `LCP is ${lcpSeconds.toFixed(2)}s, which is poor (> 4.0s). This is a critical performance issue that: 1) Hurts Core Web Vitals scores (major ranking factor), 2) Negatively impacts user experience (high bounce rates), 3) Reduces crawl efficiency (Google crawls slow pages less frequently), 4) May prevent your content from being featured in AI Overviews (slow pages are deprioritized). This must be fixed immediately.`;
    lcpRec = `Fix LCP urgently: 1) Identify LCP element (Chrome DevTools → Performance → LCP), 2) Preload LCP image in <head>: <link rel="preload" as="image" href="hero-image.webp">, 3) Optimize images (convert to WebP/AVIF, compress 70%+, use responsive images), 4) Use CDN for faster delivery, 5) Minimize server response time (TTFB < 800ms - check hosting/CDN), 6) Consider upgrading hosting if server is slow. Target: < 2.5s. This is critical for rankings and user experience.`;
  }

  // INP Insights
  let inpInsight = '';
  let inpRec = '';
  if (inpScore >= 1) {
    inpInsight = `INP (Interaction to Next Paint) is ${inpMs.toFixed(0)}ms, which is excellent (≤ 200ms target). Fast INP means your page responds quickly to user interactions, providing excellent user experience. INP is a Core Web Vital ranking factor, and good INP scores support both SEO and user satisfaction.`;
    inpRec = `Maintain this responsiveness: 1) Continue deferring non-critical JavaScript, 2) Keep JavaScript bundles small and optimized, 3) Avoid long tasks (> 50ms) in JavaScript, 4) Use web workers for heavy computations, 5) Monitor INP monthly. Fast INP improves both rankings and user experience.`;
  } else {
    inpInsight = `INP is ${inpMs.toFixed(0)}ms, which is poor (> 200ms target). This means your page responds slowly to user interactions (clicks, taps, keyboard input), creating a frustrating user experience. INP is a Core Web Vital ranking factor, and poor INP can hurt rankings. Additionally, slow interactivity may cause users to bounce, reducing engagement signals.`;
    inpRec = `Optimize INP immediately: 1) Identify long tasks (> 50ms) in Chrome DevTools Performance tab, 2) Break up long JavaScript tasks using setTimeout or requestIdleCallback, 3) Defer non-critical JavaScript (use defer or async attributes), 4) Remove or optimize third-party scripts (analytics, ads, widgets), 5) Use web workers for heavy computations, 6) Minimize JavaScript execution time. Target: ≤ 200ms. This is critical for Core Web Vitals and user experience.`;
  }

  // CLS Insights
  let clsInsight = '';
  let clsRec = '';
  if (clsScore >= 1) {
    clsInsight = `CLS (Cumulative Layout Shift) is ${clsValue.toFixed(3)}, which is excellent (≤ 0.1 target). Low CLS means your page is visually stable during loading, providing a smooth user experience. CLS is a Core Web Vital ranking factor, and good CLS scores support both SEO and user satisfaction.`;
    clsRec = `Maintain this stability: 1) Continue setting explicit width/height on images and videos, 2) Reserve space for ads and embeds, 3) Avoid inserting content above existing content, 4) Use font-display: swap for web fonts, 5) Avoid animations that trigger layout changes. Low CLS improves both rankings and user experience.`;
  } else {
    clsInsight = `CLS is ${clsValue.toFixed(3)}, which is poor (> 0.1 target). This means your page has significant layout shifts during loading, causing content to jump around. This creates a frustrating user experience and can cause accidental clicks. CLS is a Core Web Vital ranking factor, and poor CLS can hurt rankings. Additionally, layout shifts may cause users to bounce, reducing engagement.`;
    clsRec = `Fix CLS immediately: 1) Set explicit width/height on ALL images and videos: <img src="image.jpg" width="800" height="600" alt="...">, 2) Reserve space for ads and embeds (use aspect-ratio CSS), 3) Avoid inserting content above existing content (use transform instead of changing layout), 4) Use font-display: swap for web fonts to prevent font swap shifts, 5) Avoid animations that change layout properties. Target: ≤ 0.1. This is critical for Core Web Vitals and user experience.`;
  }

  // Mobile Insights
  let mobileInsight = '';
  let mobileRec = '';
  if (mobileScore >= 3) {
    mobileInsight = `Mobile performance score is ${pagespeed.mobileScore}/100, which is excellent (≥ 90). Fast mobile performance is critical because: 1) Google uses mobile-first indexing, 2) Most users browse on mobile devices, 3) Mobile performance impacts Core Web Vitals, 4) Poor mobile experience increases bounce rates. Your site is well-optimized for mobile users.`;
    mobileRec = `Maintain mobile optimization: 1) Continue using responsive design, 2) Keep images optimized for mobile (use srcset for responsive images), 3) Minimize JavaScript execution time, 4) Use touch-friendly targets (48px minimum), 5) Test on real mobile devices regularly. Mobile-first indexing means mobile performance directly impacts rankings.`;
  } else if (mobileScore >= 1.5) {
    mobileInsight = `Mobile performance score is ${pagespeed.mobileScore}/100, which needs improvement (target: ≥ 90). This is problematic because: 1) Google uses mobile-first indexing (mobile performance affects rankings), 2) Most users browse on mobile, 3) Poor mobile experience increases bounce rates, 4) Mobile Core Web Vitals impact rankings. Your site may rank lower due to mobile performance issues.`;
    mobileRec = `Optimize mobile performance: 1) Use responsive design (test on multiple devices), 2) Optimize images for mobile (compress, use WebP, implement responsive images with srcset), 3) Minimize JavaScript (defer non-critical scripts, code-split large bundles), 4) Use touch-friendly targets (buttons/links ≥ 48px), 5) Test on real mobile devices (not just desktop emulation), 6) Consider AMP for content pages if applicable. Target: ≥ 90. Mobile-first indexing means this directly impacts rankings.`;
  } else {
    mobileInsight = `Mobile performance score is ${pagespeed.mobileScore}/100, which is poor (< 50). This is critical because: 1) Google uses mobile-first indexing (your mobile site is what gets ranked), 2) Most users browse on mobile, 3) Poor mobile experience causes high bounce rates, 4) Mobile Core Web Vitals directly impact rankings, 5) Slow mobile pages are crawled less frequently. This must be fixed immediately.`;
    mobileRec = `Fix mobile performance urgently: 1) Implement responsive design (test on real devices), 2) Optimize images aggressively (compress 70%+, use WebP, implement responsive images), 3) Minimize JavaScript (remove unused code, defer non-critical scripts, code-split), 4) Use touch-friendly design (buttons ≥ 48px, adequate spacing), 5) Test on real mobile devices (iPhone, Android), 6) Consider mobile-specific optimizations (lazy-loading, conditional loading). Target: ≥ 90. Mobile-first indexing means poor mobile performance directly hurts rankings.`;
  }

  // SSL Insights
  let sslInsight = '';
  let sslRec = '';
  if (sslScore >= 3) {
    sslInsight = `HTTPS is properly configured. SSL/HTTPS is essential for: 1) Security (encrypts data between users and your site), 2) SEO (Google prefers HTTPS sites), 3) Trust signals (users see secure padlock), 4) Core Web Vitals (some features require HTTPS). Your site meets security and SEO requirements.`;
    sslRec = `Maintain HTTPS: 1) Keep SSL certificate valid and up-to-date, 2) Use HTTPS everywhere (redirect HTTP to HTTPS), 3) Use HSTS header for security, 4) Monitor certificate expiration, 5) Ensure all resources load over HTTPS (no mixed content). HTTPS is non-negotiable for modern SEO.`;
  } else {
    sslInsight = `No HTTPS detected - this is critical. Without HTTPS: 1) Google may mark your site as "Not Secure", 2) Browsers show security warnings, 3) You lose ranking benefits (Google prefers HTTPS), 4) Users may not trust your site, 5) Some modern web features require HTTPS. This must be fixed immediately.`;
    sslRec = `Implement HTTPS immediately: 1) Get SSL certificate (free via Let's Encrypt or your hosting provider), 2) Install certificate on your server, 3) Redirect all HTTP traffic to HTTPS (301 redirects), 4) Update all internal links to use HTTPS, 5) Ensure all resources (images, CSS, JS) load over HTTPS (no mixed content), 6) Use HSTS header for security. HTTPS is mandatory for modern SEO and user trust.`;
  }

  // LLMs.txt Insights
  let llmsTxtInsight = '';
  let llmsTxtRec = '';
  if (llmsTxtScore >= 2) {
    llmsTxtInsight = `LLMs.txt file detected. This file helps AI crawlers (ChatGPT, Perplexity, Claude) understand your site structure and which content to prioritize. LLMs.txt is becoming important for GEO optimization as more AI systems crawl the web. Having this file signals that your site is optimized for AI discovery.`;
    llmsTxtRec = `Maintain LLMs.txt: 1) Keep the file updated when you add new important pages, 2) List your most important content first, 3) Include clear descriptions of what each section contains, 4) Update quarterly to reflect site changes, 5) Ensure the file is accessible at /llms.txt or /llms-full.txt. This file helps AI systems discover and cite your content.`;
  } else {
    llmsTxtInsight = `No LLMs.txt file detected. This file helps AI crawlers (ChatGPT, Perplexity, Claude) understand your site structure and prioritize content. Without LLMs.txt, AI systems may miss important content or crawl inefficiently. As AI systems become more prevalent, LLMs.txt is becoming important for GEO optimization and AI discovery.`;
    llmsTxtRec = `Create LLMs.txt file: 1) Create /llms.txt or /llms-full.txt at your domain root, 2) List your most important pages and content sections, 3) Include brief descriptions of what each section contains, 4) Prioritize content you want AI to cite, 5) Update quarterly. Example format: "Important Pages: /blog/seo-guide (Complete SEO guide), /services (Our services), /about (Company information)". This helps AI systems discover and cite your content more effectively.`;
  }

  // Sitemap Insights
  let sitemapInsight = '';
  let sitemapRec = '';
  if (sitemapScore >= 2) {
    sitemapInsight = `Valid XML sitemap detected with all required elements. A proper sitemap helps search engines discover and index your pages efficiently. Sitemaps are especially important for: 1) New sites (helps discovery), 2) Large sites (ensures all pages are found), 3) Sites with complex navigation, 4) Sites with dynamic content. Your sitemap is properly configured.`;
    sitemapRec = `Maintain sitemap: 1) Keep sitemap updated when you add/remove pages, 2) Submit sitemap to Google Search Console, 3) Ensure all important pages are included, 4) Use lastmod dates to indicate freshness, 5) Keep sitemap under 50,000 URLs (split if larger). A well-maintained sitemap improves indexation efficiency.`;
  } else {
    sitemapInsight = `Sitemap is missing or invalid. Without a proper sitemap: 1) Search engines may miss pages (especially new or deep pages), 2) Indexation is slower and less efficient, 3) You lose control over what gets crawled, 4) Dynamic or complex sites struggle with discovery. This is especially problematic for large sites or sites with complex navigation.`;
    sitemapRec = `Create valid XML sitemap: 1) Generate sitemap (use tools like Yoast, Screaming Frog, or sitemap generators), 2) Include all important pages, 3) Ensure sitemap includes required elements: <urlset>, <url>, <loc>, <lastmod>, <changefreq>, <priority>, 4) Submit to Google Search Console, 5) Keep sitemap updated when pages change, 6) Split into multiple sitemaps if you have >50,000 URLs. A proper sitemap is essential for efficient indexation.`;
  }

  // Broken Links Insights (placeholder - will be enhanced when link checker is implemented)
  const brokenLinksInsight = 'Broken links check pending implementation. Broken links hurt user experience and may impact crawl efficiency.';
  const brokenLinksRec = 'Regularly check for broken links using tools like Screaming Frog or Ahrefs Site Audit. Fix 404 errors promptly to maintain good user experience and crawl efficiency.';

  return {
    score: total,
    breakdown: {
      lcp: { score: lcpScore, value: `${pagespeed.lcp?.toFixed(2)}s`, insight: lcpInsight, recommendation: lcpRec },
      inp: { score: inpScore, value: `${pagespeed.fid?.toFixed(0)}ms`, insight: inpInsight, recommendation: inpRec },
      cls: { score: clsScore, value: pagespeed.cls?.toFixed(3) || '0', insight: clsInsight, recommendation: clsRec },
      mobile: { score: mobileScore, value: `${pagespeed.mobileScore}/100`, insight: mobileInsight, recommendation: mobileRec },
      ssl: { score: sslScore, value: scraping.hasSSL ? 'HTTPS' : 'No HTTPS', insight: sslInsight, recommendation: sslRec },
      brokenLinks: { score: brokenLinksScore, value: '0 found', insight: brokenLinksInsight, recommendation: brokenLinksRec },
      llmsTxt: { score: llmsTxtScore, value: scraping.hasLlmsTxt ? 'Detected ✓' : 'Not found', insight: llmsTxtInsight, recommendation: llmsTxtRec },
      sitemap: { score: sitemapScore, value: scraping.sitemapValid ? 'Valid ✓' : 'Missing/Invalid', insight: sitemapInsight, recommendation: sitemapRec }
    }
  };
}


export function calculateKeywordVisibilityScore(
  scraping: ScrapingResult,
  keywordData?: DomainKeywordMetrics,
  gscData?: GSCMetrics
): {
  score: number;
  breakdown: DetailedScores['breakdown']['keywordVisibility'];
  dataSource: 'ahrefs' | 'dataforseo' | 'gsc' | 'estimated';
} {
  // PILLAR 4: Keyword Visibility (25 pts total)
  // - Organic Keywords: 10 pts (vs SERP benchmark)
  // - Avg Position: 7.5 pts
  // - Search Intent Match: 7.5 pts

  let keywordsScore = 0;
  let positionsScore = 0;
  let intentScore = 0;
  let dataSource: 'ahrefs' | 'dataforseo' | 'gsc' | 'estimated' = 'estimated';

  let keywordsValue = 'Pending API';
  let positionsValue = 'N/A';
  let intentValue = 'Pending API';

  // TODO: Implement Ahrefs API integration
  // Step 1: Call site-explorer-organic-keywords for target URL
  // Step 2: Get primary keyword (highest traffic)
  // Step 3: Call serp-overview for competitor benchmark
  // Step 4: Calculate scores based on new logic

  // METRIC #1: Organic Keywords (12.5 pts)
  // Logic: Compare URL's keyword count vs SERP competitor benchmark
  // Scoring: ≥100% = 12.5, 80-99% = 10, 60-79% = 7.5, 40-59% = 5, 20-39% = 2.5, <20% = 0

  // METRIC #2: Avg Position (7.5 pts)
  // Logic: Average SERP position of ranking keywords
  // Scoring: ≤3 = 7.5, 4-10 = 5, 11-20 = 2.5, >20 = 0

  // METRIC #3: Search Intent Match (7.5 pts)
  // Logic: % of keywords with consistent dominant intent
  // Scoring: ≥80% = 7.5, 60-79% = 6, 40-59% = 4, 20-39% = 2, <20% = 0

  // Intent breakdown (to be populated from Ahrefs API)
  let intentBreakdown = {
    informational: { count: 0, percent: 0 },
    commercial: { count: 0, percent: 0 },
    transactional: { count: 0, percent: 0 },
    navigational: { count: 0, percent: 0 },
    dominant: 'unknown' as string,
    matchPercent: 0
  };

  // Fallback: Use existing data if available
  if (keywordData && keywordData.totalKeywords > 0) {
    // Use DataForSEO data as temporary source
    const benchmarkDefault = 20; // Default benchmark
    const percentage = Math.min(100, (keywordData.totalKeywords / benchmarkDefault) * 100);

    // Organic Keywords Score (10 pts)
    if (percentage >= 100) keywordsScore = 10;
    else if (percentage >= 80) keywordsScore = 8;
    else if (percentage >= 60) keywordsScore = 6;
    else if (percentage >= 40) keywordsScore = 4;
    else if (percentage >= 20) keywordsScore = 2;
    else keywordsScore = 0;

    keywordsValue = `${keywordData.totalKeywords} keywords`;

    // Avg Position Score (7.5 pts)
    if (keywordData.averagePosition > 0) {
      if (keywordData.averagePosition <= 3) positionsScore = 7.5;
      else if (keywordData.averagePosition <= 10) positionsScore = 5;
      else if (keywordData.averagePosition <= 20) positionsScore = 2.5;
      else positionsScore = 0;
      positionsValue = `Avg #${keywordData.averagePosition.toFixed(1)}`;
    }

    dataSource = 'dataforseo';

    // Intent Match - placeholder with fake breakdown until Ahrefs API
    intentBreakdown = {
      informational: { count: 6, percent: 60 },
      commercial: { count: 2, percent: 20 },
      transactional: { count: 1, percent: 10 },
      navigational: { count: 1, percent: 10 },
      dominant: 'informational',
      matchPercent: 60
    };
    intentScore = 6; // 60-79% = 6 pts
    intentValue = '📘 Informational (60%)';

  } else {
    // Fallback estimates based on content signals
    const h2Count = scraping.h2.length;

    // Estimate keyword potential from content structure
    if (h2Count >= 5) keywordsScore = 4;
    else if (h2Count >= 3) keywordsScore = 2;

    // Default position estimate
    positionsScore = 2.5;
    positionsValue = 'Est. Page 2';

    // Default intent estimate
    intentBreakdown = {
      informational: { count: 0, percent: 0 },
      commercial: { count: 0, percent: 0 },
      transactional: { count: 0, percent: 0 },
      navigational: { count: 0, percent: 0 },
      dominant: 'unknown',
      matchPercent: 0
    };
    intentScore = 4; // Default middle score
    intentValue = 'Pending Ahrefs API';

    keywordsValue = 'Est. Low';
    dataSource = 'estimated';
  }

  const total = Math.min(25, Math.round(keywordsScore + positionsScore + intentScore));

  // Build intent breakdown string for UI
  const intentDetails = dataSource !== 'estimated'
    ? `📘 Info: ${intentBreakdown.informational.count} (${intentBreakdown.informational.percent}%) | 🛒 Comm: ${intentBreakdown.commercial.count} (${intentBreakdown.commercial.percent}%) | 💳 Trans: ${intentBreakdown.transactional.count} (${intentBreakdown.transactional.percent}%) | 🧭 Nav: ${intentBreakdown.navigational.count} (${intentBreakdown.navigational.percent}%)`
    : 'Ahrefs API required for intent breakdown';

  // Keywords Insights
  let keywordsInsight = '';
  let keywordsRec = '';
  if (dataSource === 'estimated') {
    keywordsInsight = `Keyword data requires API integration (Ahrefs, DataForSEO, or Google Search Console). Without real keyword data, we cannot accurately assess your organic keyword visibility. Organic keyword count is critical because: 1) More keywords = more opportunities to rank, 2) Keyword diversity reduces dependency on single rankings, 3) AI systems consider keyword coverage when evaluating content authority.`;
    keywordsRec = `Connect keyword data source: 1) Integrate Ahrefs API for comprehensive keyword data (best option), 2) Or use DataForSEO API for keyword rankings, 3) Or connect Google Search Console API for your own site's keyword data, 4) Once connected, aim for 100+ organic keywords ranking in top 100 to compete with SERP leaders. More keywords = more ranking opportunities and better AI visibility.`;
  } else if (keywordsScore >= 8) {
    keywordsInsight = `Excellent organic keyword visibility: ${keywordData?.totalKeywords || 0} keywords ranking. This level of keyword coverage indicates strong content depth and relevance. More keywords mean: 1) More opportunities to rank and drive traffic, 2) Reduced dependency on single rankings, 3) Better signals to AI systems about content comprehensiveness, 4) Higher chances of appearing in AI Overviews for various queries. Your content covers multiple search intents effectively.`;
    keywordsRec = `Maintain and expand keyword coverage: 1) Continue creating comprehensive content that targets multiple related keywords, 2) Build topic clusters around core topics, 3) Target long-tail keywords (3-5 word phrases) for easier wins, 4) Monitor keyword rankings monthly and optimize pages losing positions, 5) Add new content targeting keyword gaps identified in competitor analysis. Aim for 200+ keywords to maximize visibility.`;
  } else if (keywordsScore >= 4) {
    keywordsInsight = `Moderate organic keyword visibility: ${keywordData?.totalKeywords || 0} keywords ranking. While you have some keyword coverage, you're likely missing opportunities compared to top competitors. Limited keywords mean: 1) Fewer opportunities to rank and drive traffic, 2) Higher dependency on single rankings (risky), 3) Less comprehensive content signals to AI systems, 4) Reduced chances of appearing in AI Overviews for various queries. Your content may not cover enough search intents.`;
    keywordsRec = `Expand keyword coverage: 1) Create comprehensive content targeting multiple related keywords (aim for 100+ keywords), 2) Build topic clusters around core topics (pillar page + 5-10 supporting articles), 3) Target long-tail keywords (3-5 word phrases) for easier wins, 4) Analyze competitor keywords and identify gaps, 5) Optimize existing pages for additional keywords naturally. More keywords = more ranking opportunities and better AI visibility.`;
  } else {
    keywordsInsight = `Low organic keyword visibility: ${keywordData?.totalKeywords || 0} keywords ranking. This is problematic because: 1) Very few opportunities to rank and drive traffic, 2) High dependency on single rankings (very risky), 3) Weak content comprehensiveness signals to AI systems, 4) Minimal chances of appearing in AI Overviews for various queries, 5) Content likely doesn't cover enough search intents or topics. This significantly limits your SEO and GEO potential.`;
    keywordsRec = `Dramatically expand keyword coverage: 1) Create comprehensive content targeting 50+ keywords minimum (aim for 100+), 2) Build topic clusters (pillar page + 5-10 supporting articles per cluster), 3) Target long-tail keywords (3-5 word phrases) for easier wins, 4) Analyze top 5 competitor pages to identify all keywords they rank for, 5) Optimize existing pages for additional keywords naturally, 6) Add FAQ sections targeting "People Also Ask" questions. More keywords = more ranking opportunities. This is essential for competing with top pages.`;
  }

  // Positions Insights
  let positionsInsight = '';
  let positionsRec = '';
  if (positionsScore >= 7.5) {
    positionsInsight = `Excellent average position: ${positionsValue}. Ranking in top 3 positions means: 1) Maximum visibility and click-through rates (CTR), 2) Strong authority signals to search engines, 3) Higher likelihood of being cited in AI Overviews (top positions are prioritized), 4) Better user trust and engagement. Your content is performing exceptionally well in search results.`;
    positionsRec = `Maintain top positions: 1) Continue optimizing content for target keywords, 2) Monitor rankings weekly and address any drops immediately, 3) Update content quarterly to maintain freshness, 4) Build quality backlinks to maintain authority, 5) Ensure Core Web Vitals remain excellent. Top positions maximize both traffic and AI citation chances.`;
  } else if (positionsScore >= 5) {
    positionsInsight = `Good average position: ${positionsValue}. Ranking in positions 4-10 means: 1) Decent visibility but lower CTR than top 3, 2) Opportunity to improve to top 3 for maximum impact, 3) Moderate authority signals, 4) Some chance of AI citation but not prioritized. While good, moving to top 3 would significantly increase traffic and AI citation probability.`;
    positionsRec = `Improve to top 3: 1) Optimize on-page SEO (title tags, headings, content depth), 2) Improve Core Web Vitals (fast pages rank higher), 3) Build quality backlinks to increase authority, 4) Add comprehensive content to match/exceed top 3 competitors, 5) Target featured snippets with direct answers. Moving from position 4-10 to top 3 can increase traffic by 50%+ and AI citation probability.`;
  } else if (positionsScore >= 2.5) {
    positionsInsight = `Low average position: ${positionsValue}. Ranking in positions 11-20 means: 1) Limited visibility and very low CTR, 2) Weak authority signals, 3) Minimal chance of AI citation (AI prioritizes top results), 4) Content likely doesn't match search intent as well as top results. This position range significantly limits your SEO and GEO potential.`;
    positionsRec = `Improve rankings urgently: 1) Optimize on-page SEO comprehensively (title tags, meta descriptions, headings, content depth), 2) Improve Core Web Vitals (fast pages rank higher), 3) Build quality backlinks to increase domain authority, 4) Add comprehensive content to match/exceed top 10 competitors, 5) Target featured snippets with direct answers and FAQ schema, 6) Ensure content matches search intent perfectly. Moving to top 10 is essential for meaningful traffic and AI visibility.`;
  } else {
    positionsInsight = `Very low average position: ${positionsValue}. Ranking beyond position 20 means: 1) Minimal visibility and almost no CTR, 2) Very weak authority signals, 3) Almost no chance of AI citation, 4) Content likely doesn't match search intent or lacks authority. This position range provides almost no SEO value and zero GEO potential.`;
    positionsRec = `Fix rankings immediately: 1) Comprehensive on-page SEO optimization (title tags, meta descriptions, headings, content depth, internal linking), 2) Improve Core Web Vitals (fast pages rank higher), 3) Build quality backlinks aggressively to increase domain authority, 4) Create comprehensive content that matches/exceeds top 10 competitors, 5) Target featured snippets with direct answers and FAQ schema, 6) Ensure perfect search intent match, 7) Consider targeting less competitive keywords first. Moving to top 20 is essential for any meaningful SEO/GEO results.`;
  }

  // Intent Match Insights
  let intentInsight = '';
  let intentRec = '';
  if (intentScore >= 6) {
    intentInsight = `${intentDetails}. Strong intent alignment means your content matches what users are searching for, which: 1) Improves rankings (Google rewards intent match), 2) Increases CTR (users find what they want), 3) Signals relevance to AI systems, 4) Reduces bounce rates. Your content effectively targets the primary search intent.`;
    intentRec = `Maintain intent alignment: 1) Continue focusing content on the dominant intent (${intentBreakdown.dominant}), 2) Ensure all pages clearly match their target intent, 3) Use intent-appropriate content formats (guides for informational, comparisons for commercial, product pages for transactional), 4) Monitor intent consistency across keywords. Strong intent alignment improves both rankings and user satisfaction.`;
  } else {
    intentInsight = `${intentDetails}. Weak intent alignment means your content may not match what users are searching for, which: 1) Hurts rankings (Google penalizes intent mismatch), 2) Reduces CTR (users don't find what they want), 3) Weakens relevance signals to AI systems, 4) Increases bounce rates. Your content may be targeting mixed intents or not clearly matching user expectations.`;
    intentRec = `Fix intent alignment: 1) Identify the primary intent for each page (informational, commercial, transactional, navigational), 2) Restructure content to match that intent clearly, 3) Use intent-appropriate formats (guides for informational, comparison tables for commercial, product pages for transactional), 4) Ensure title tags and meta descriptions match intent, 5) Focus on one primary intent per page (don't mix intents). Strong intent alignment is essential for rankings and AI relevance.`;
  }

  return {
    score: total,
    breakdown: {
      keywords: {
        score: keywordsScore,
        value: keywordsValue,
        insight: keywordsInsight,
        recommendation: keywordsRec
      },
      positions: {
        score: positionsScore,
        value: positionsValue,
        insight: positionsInsight,
        recommendation: positionsRec
      },
      intentMatch: {
        score: intentScore,
        value: intentValue,
        insight: intentInsight,
        recommendation: intentRec
      }
    },
    dataSource
  };
}

export function calculateAITrustScore(
  scraping: ScrapingResult,
  mozMetrics?: MozMetrics
): {
  score: number;
  breakdown: DetailedScores['breakdown']['aiTrust'];
} {
  let backlinkScore = 2;
  let referringDomainsScore = 2;
  let sentimentScore = 2;
  let eeatScore = 0;
  let localScore = 0;
  let backlinkValue = 'N/A';

  if (mozMetrics && mozMetrics.domainAuthority > 0) {
    const mozScores = mozMetricsToScores(mozMetrics);
    backlinkScore = mozScores.backlinkScore;
    referringDomainsScore = mozScores.referringDomainsScore;
    backlinkValue = mozMetrics.linkingDomains.toString();
  } else {
    if (scraping.externalLinks >= 10) {
      backlinkScore = 4;
      referringDomainsScore = 3;
    } else if (scraping.externalLinks >= 5) {
      backlinkScore = 3;
      referringDomainsScore = 2;
    }
    backlinkValue = `Est. ${scraping.externalLinks} ext links`;
  }

  // Sentiment
  if (scraping.wordCount >= 500) sentimentScore = 3;

  // E-E-A-T
  const hasAuthor = scraping.schemaTypes.some(t => t.includes('Person'));
  if (hasAuthor) eeatScore += 1.5;
  if (scraping.externalLinks >= 3) eeatScore += 1;

  // Local
  const hasLocal = scraping.schemaTypes.some(t => t.includes('LocalBusiness'));
  if (hasLocal) localScore += 2;

  const total = Math.min(25, Math.round(
    backlinkScore + referringDomainsScore + sentimentScore +
    eeatScore + localScore
  ));

  // Backlinks Insights
  let backlinksInsight = '';
  let backlinksRec = '';
  if (mozMetrics && mozMetrics.linkingDomains > 0) {
    if (backlinkScore >= 5) {
      backlinksInsight = `Strong backlink profile: ${mozMetrics.linkingDomains} referring domains with ${mozMetrics.inboundLinks} inbound links. High-quality backlinks are critical for: 1) Domain authority (DA ${mozMetrics.domainAuthority}), 2) Search rankings (backlinks are a major ranking factor), 3) AI trust signals (AI systems consider backlink quality when evaluating content), 4) Brand authority. Your backlink profile signals strong authority to both search engines and AI systems.`;
      backlinksRec = `Maintain and grow backlinks: 1) Continue building quality backlinks from authoritative sites (DA 50+), 2) Focus on relevant, contextual links (same industry/topic), 3) Diversify anchor text (avoid over-optimization), 4) Monitor backlink quality (avoid spam/low-quality links), 5) Build relationships for natural link acquisition. Quality backlinks improve both rankings and AI trust signals.`;
    } else if (backlinkScore >= 3) {
      backlinksInsight = `Moderate backlink profile: ${mozMetrics.linkingDomains} referring domains with ${mozMetrics.inboundLinks} inbound links (DA ${mozMetrics.domainAuthority}). While you have some backlinks, more quality links would significantly improve authority. Limited backlinks mean: 1) Lower domain authority, 2) Weaker ranking signals, 3) Reduced AI trust signals, 4) Less brand authority. Your backlink profile needs strengthening to compete with top sites.`;
      backlinksRec = `Build more quality backlinks: 1) Create linkable assets (comprehensive guides, original research, tools), 2) Reach out to relevant sites for guest posts or resource page links, 3) Build relationships with industry influencers, 4) Focus on authoritative sites (DA 50+), 5) Ensure links are contextual and relevant, 6) Monitor backlink quality (avoid spam). Aim for 50+ quality referring domains to significantly improve authority and AI trust signals.`;
    } else {
      backlinksInsight = `Weak backlink profile: ${mozMetrics.linkingDomains} referring domains with ${mozMetrics.inboundLinks} inbound links (DA ${mozMetrics.domainAuthority}). This is problematic because: 1) Low domain authority hurts rankings, 2) Weak ranking signals, 3) Poor AI trust signals (AI systems consider backlink quality), 4) Limited brand authority. Without quality backlinks, your content will struggle to compete and be cited by AI systems.`;
      backlinksRec = `Build backlinks urgently: 1) Create linkable assets (comprehensive guides, original research/data, free tools), 2) Digital PR outreach (get mentioned in industry publications), 3) Guest posting on authoritative sites (DA 50+), 4) Build relationships with industry influencers, 5) Resource page outreach (get listed on relevant resource pages), 6) Monitor backlink quality (avoid spam/low-quality links). Aim for 30+ quality referring domains minimum. Quality backlinks are essential for rankings and AI trust.`;
    }
  } else {
    backlinksInsight = `Backlink data requires Moz API integration. Without backlink data, we cannot accurately assess your link profile. Backlinks are critical for: 1) Domain authority (major ranking factor), 2) AI trust signals (AI systems consider backlink quality), 3) Brand authority, 4) Search rankings. Quality backlinks from authoritative sites significantly improve both SEO and GEO potential.`;
    backlinksRec = `Connect Moz API for backlink data: 1) Integrate Moz API to get accurate backlink metrics (DA, PA, linking domains), 2) Or use Ahrefs API for comprehensive backlink data, 3) Once connected, aim for 50+ quality referring domains (DA 50+) to compete with top sites, 4) Focus on building contextual, relevant links from authoritative sites. Quality backlinks are essential for rankings and AI trust signals.`;
  }

  // Referring Domains Insights
  let referringDomainsInsight = '';
  let referringDomainsRec = '';
  if (mozMetrics && mozMetrics.linkingDomains > 0) {
    if (referringDomainsScore >= 3) {
      referringDomainsInsight = `Good referring domain diversity: ${mozMetrics.linkingDomains} unique domains linking to your site. Diverse referring domains signal: 1) Natural link profile (not manipulative), 2) Broad authority recognition, 3) Strong trust signals to search engines and AI, 4) Reduced risk of penalties. Your link profile shows healthy diversity.`;
      referringDomainsRec = `Maintain domain diversity: 1) Continue building links from diverse, authoritative domains, 2) Avoid over-reliance on single domains, 3) Focus on relevant, contextual links, 4) Monitor link diversity (aim for links from 50+ unique domains), 5) Build relationships across your industry. Diverse referring domains improve both rankings and AI trust signals.`;
    } else {
      referringDomainsInsight = `Limited referring domain diversity: ${mozMetrics.linkingDomains} unique domains linking to your site. Low diversity may signal: 1) Over-reliance on few sources (risky), 2) Limited authority recognition, 3) Weaker trust signals, 4) Potential manipulation risk. More diverse referring domains would significantly improve authority and trust signals.`;
      referringDomainsRec = `Increase domain diversity: 1) Build links from diverse, authoritative domains (aim for 50+ unique domains), 2) Avoid over-reliance on single domains or sources, 3) Focus on relevant, contextual links from various sites, 4) Build relationships across your industry, 5) Create linkable assets that attract diverse links. More diverse referring domains improve both rankings and AI trust signals.`;
    }
  } else {
    referringDomainsInsight = 'Referring domain data requires Moz API integration. Domain diversity is important for natural link profiles and trust signals.';
    referringDomainsRec = 'Connect Moz API to get referring domain metrics. Aim for 50+ unique referring domains for optimal authority and trust signals.';
  }

  // Sentiment Insights
  let sentimentInsight = '';
  let sentimentRec = '';
  if (sentimentScore >= 3) {
    sentimentInsight = `Content sentiment appears neutral to positive based on content depth (${scraping.wordCount} words). However, accurate sentiment analysis requires Gemini API integration to analyze community discussions (Reddit, Pantip, forums, reviews). Positive sentiment signals: 1) Brand trust and reputation, 2) User satisfaction, 3) Strong signals to AI systems, 4) Better chances of AI citation. Your content depth suggests positive signals, but community sentiment analysis would provide more accurate assessment.`;
    sentimentRec = `Monitor sentiment proactively: 1) Connect Gemini API for accurate sentiment analysis from community sources, 2) Monitor reviews and social media mentions, 3) Respond to feedback proactively (especially negative), 4) Build positive brand associations through content marketing, 5) Address any negative sentiment quickly and transparently. Positive sentiment improves both brand trust and AI citation chances.`;
  } else {
    sentimentInsight = `Sentiment analysis requires Gemini API integration. Without community sentiment data (Reddit, Pantip, forums, reviews), we cannot accurately assess brand sentiment. Sentiment is important because: 1) Positive sentiment signals trust to AI systems, 2) Negative sentiment can hurt brand authority, 3) Community discussions influence AI understanding of your brand, 4) Sentiment affects AI citation probability. Your content depth (${scraping.wordCount} words) suggests neutral sentiment, but community analysis would provide accurate assessment.`;
    sentimentRec = `Connect Gemini API for sentiment analysis: 1) Integrate Gemini API to analyze community sentiment from Reddit, Pantip, forums, and reviews, 2) Monitor brand mentions across platforms, 3) Build positive sentiment through excellent content and customer service, 4) Respond to negative sentiment quickly and transparently, 5) Build positive brand associations. Positive sentiment improves AI trust signals and citation chances.`;
  }

  // E-E-A-T Insights
  let eeatInsight = '';
  let eeatRec = '';
  if (eeatScore >= 3) {
    eeatInsight = `Strong E-E-A-T signals: Author information detected in schema markup, and content includes external citations. E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness) is critical for: 1) YMYL (Your Money Your Life) content ranking, 2) AI trust signals (AI systems evaluate E-E-A-T), 3) User trust and credibility, 4) Search rankings. Your content demonstrates expertise and trustworthiness.`;
    eeatRec = `Enhance E-E-A-T further: 1) Add detailed author bios with credentials and photos, 2) Include author schema markup with credentials, 3) Link to authoritative external sources, 4) Add "About" page with team credentials, 5) Include case studies and real examples, 6) Add "Last updated" dates to show freshness. Strong E-E-A-T signals improve both rankings and AI trust.`;
  } else if (eeatScore >= 1.5) {
    eeatInsight = `Moderate E-E-A-T signals: Some author or citation information detected, but more is needed. E-E-A-T is critical for: 1) YMYL content ranking, 2) AI trust signals, 3) User credibility, 4) Search rankings. Without strong E-E-A-T signals, your content may struggle to rank, especially for YMYL topics, and AI systems may not trust your content enough to cite it.`;
    eeatRec = `Strengthen E-E-A-T signals: 1) Add author information with credentials and photos, 2) Implement author schema markup, 3) Link to authoritative external sources (peer-reviewed studies, official sources), 4) Add "About" page with team credentials and experience, 5) Include case studies and real examples, 6) Add "Last updated" dates. Strong E-E-A-T signals are essential for rankings and AI trust, especially for YMYL topics.`;
  } else {
    eeatInsight = `Weak E-E-A-T signals: No author information or minimal citations detected. This is critical because: 1) E-E-A-T is essential for YMYL content ranking, 2) AI systems evaluate E-E-A-T when deciding what to cite, 3) Weak E-E-A-T hurts user trust and credibility, 4) Content may struggle to rank without strong E-E-A-T. Your content lacks the trust signals that search engines and AI systems look for.`;
    eeatRec = `Implement E-E-A-T immediately: 1) Add author information with credentials, photos, and bios on all content pages, 2) Implement author schema markup (Person schema with credentials), 3) Link to authoritative external sources (peer-reviewed studies, official sources, industry publications), 4) Create comprehensive "About" page with team credentials and experience, 5) Include case studies, real examples, and first-person narratives, 6) Add "Last updated" dates to show freshness, 7) For YMYL topics, ensure medical/legal/financial credentials are clearly displayed. Strong E-E-A-T signals are non-negotiable for rankings and AI trust, especially for YMYL content.`;
  }

  // Local Insights
  let localInsight = '';
  let localRec = '';
  if (localScore >= 2) {
    localInsight = `Local/GEO signals detected: LocalBusiness schema markup found. Local signals are important for: 1) Local SEO rankings, 2) Google Maps visibility, 3) Local AI queries (e.g., "best restaurants near me"), 4) Trust signals for location-based content. Your site is optimized for local search and GEO queries.`;
    localRec = `Enhance local signals: 1) Ensure Google Business Profile is complete and optimized, 2) Add address and contact information consistently across site, 3) Include local schema markup (LocalBusiness, Place), 4) Create location-specific content, 5) Build local citations, 6) Encourage local reviews. Strong local signals improve both local rankings and local AI query visibility.`;
  } else {
    localInsight = `No local/GEO signals detected. If your business serves local customers, this is a missed opportunity. Local signals help with: 1) Local SEO rankings, 2) Google Maps visibility, 3) Local AI queries, 4) Trust signals for location-based content. Without local signals, you may miss local search and AI query opportunities.`;
    localRec = `Add local signals if applicable: 1) Add LocalBusiness schema markup with address, phone, and business hours, 2) Create and optimize Google Business Profile, 3) Ensure NAP (Name, Address, Phone) consistency across site, 4) Create location-specific landing pages, 5) Build local citations, 6) Encourage local reviews. Local signals improve both local rankings and local AI query visibility. If you don't serve local customers, you can skip this.`;
  }

  return {
    score: total,
    breakdown: {
      backlinks: { score: Math.min(6, backlinkScore), value: backlinkValue, insight: backlinksInsight, recommendation: backlinksRec },
      referringDomains: { score: Math.min(4, referringDomainsScore), value: mozMetrics?.linkingDomains?.toString() || 'N/A', insight: referringDomainsInsight, recommendation: referringDomainsRec },
      sentiment: { score: Math.min(4, sentimentScore), value: 'Neutral', insight: sentimentInsight, recommendation: sentimentRec },
      eeat: { score: Math.min(4, eeatScore), value: hasAuthor ? 'Author Found' : 'No Author', insight: eeatInsight, recommendation: eeatRec },
      local: { score: Math.min(2, localScore), value: hasLocal ? 'Yes' : 'No', insight: localInsight, recommendation: localRec }
    }
  };
}

export function calculateTotalScore(
  scraping: ScrapingResult,
  pagespeed: PageSpeedResult,
  mozMetrics?: MozMetrics,
  keywordData?: DomainKeywordMetrics,
  gscData?: GSCMetrics
): DetailedScores {
  const contentStructure = calculateContentStructureScore(scraping);
  const brandRanking = calculateBrandRankingScore(scraping);
  const websiteTechnical = calculateWebsiteTechnicalScore(scraping, pagespeed);
  const keywordVisibility = calculateKeywordVisibilityScore(scraping, keywordData, gscData);
  const aiTrust = calculateAITrustScore(scraping, mozMetrics);

  // Direct 100-point system (no normalization)
  // Content: 28, Brand: 9, Technical: 17, Keywords: 23, AI Trust: 23 = 100
  const total =
    contentStructure.score +    // 28 pts max
    brandRanking.score +        // 9 pts max
    websiteTechnical.score +    // 17 pts max
    keywordVisibility.score +   // 23 pts max
    aiTrust.score;              // 23 pts max

  return {
    total,
    rawTotal: total,  // Same as total in direct 100-point system
    contentStructure: contentStructure.score,
    brandRanking: brandRanking.score,
    websiteTechnical: websiteTechnical.score,
    keywordVisibility: keywordVisibility.score,
    aiTrust: aiTrust.score,
    breakdown: {
      contentStructure: contentStructure.breakdown,
      brandRanking: brandRanking.breakdown,
      websiteTechnical: websiteTechnical.breakdown,
      keywordVisibility: keywordVisibility.breakdown,
      aiTrust: aiTrust.breakdown
    },
    dataSource: {
      moz: !!(mozMetrics && mozMetrics.domainAuthority > 0),
      dataforseo: keywordVisibility.dataSource === 'dataforseo',
      gsc: keywordVisibility.dataSource === 'gsc',
      pagespeed: true,
      scraping: true,
      ahrefs: false,   // TODO: Set true when Ahrefs integrated
      gemini: false    // TODO: Set true when Gemini integrated
    }
  };
}

export function getScoreLabel(score: number): {
  label: string;
  color: string;
  description: string;
} {
  if (score >= 90) return { label: 'Excellent', color: 'green', description: 'Well-optimized for AI' };
  if (score >= 70) return { label: 'Good', color: 'blue', description: 'Performing well' };
  if (score >= 50) return { label: 'Needs Improvement', color: 'yellow', description: 'Needs attention' };
  return { label: 'Poor', color: 'red', description: 'Significant optimization needed' };
}

export function compareScores(
  mainScores: DetailedScores,
  competitorScores: DetailedScores[]
): {
  rank: number;
  avgCompetitorScore: number;
  gaps: { pillar: string; mainScore: number; avgCompetitorScore: number; gap: number }[];
} {
  const avgTotal = competitorScores.reduce((sum, c) => sum + c.total, 0) / competitorScores.length;
  const allScores = [mainScores.total, ...competitorScores.map(c => c.total)].sort((a, b) => b - a);
  const rank = allScores.indexOf(mainScores.total) + 1;

  const pillars = ['contentStructure', 'brandRanking', 'websiteTechnical', 'keywordVisibility', 'aiTrust'] as const;
  const gaps = pillars.map(pillar => {
    const avgCompetitor = competitorScores.reduce((sum, c) => sum + c[pillar], 0) / competitorScores.length;
    return {
      pillar,
      mainScore: mainScores[pillar],
      avgCompetitorScore: Math.round(avgCompetitor * 10) / 10,
      gap: Math.round((mainScores[pillar] - avgCompetitor) * 10) / 10
    };
  });

  return { rank, avgCompetitorScore: Math.round(avgTotal), gaps };
}

export function calculateAverageScores(scores: DetailedScores[]): DetailedScores {
  if (scores.length === 0) {
    // Return empty/zero structure
    return calculateTotalScore(
      { url: '', h1: [], h2: [], h3: [], hasSchema: false, schemaTypes: [], tableCount: 0, listCount: 0, imageCount: 0, imagesWithAlt: 0, videoCount: 0, internalLinks: 0, externalLinks: 0, hasSSL: false, hasRobotsTxt: false, hasLlmsTxt: false, sitemapValid: false, wordCount: 0 },
      { url: '', lcp: 0, fid: 0, cls: 0, mobileScore: 0, lcpCategory: 'POOR', fidCategory: 'POOR', clsCategory: 'POOR', performanceScore: 0, accessibilityScore: 0, seoScore: 0, bestPracticesScore: 0 }
    );
  }

  const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;

  const base = scores[0];
  const total = Math.round(avg(scores.map(s => s.total)));
  const rawTotal = Math.round(avg(scores.map(s => s.rawTotal || s.total)));

  return {
    ...base,
    total,
    rawTotal,
    contentStructure: Math.round(avg(scores.map(s => s.contentStructure))),
    brandRanking: Math.round(avg(scores.map(s => s.brandRanking))),
    websiteTechnical: Math.round(avg(scores.map(s => s.websiteTechnical || 0))),
    keywordVisibility: Math.round(avg(scores.map(s => s.keywordVisibility))),
    aiTrust: Math.round(avg(scores.map(s => s.aiTrust))),
    breakdown: {
      contentStructure: {
        schema: { 
          score: Math.round(avg(scores.map(s => s.breakdown.contentStructure.schema.score))),
          insight: scores[0]?.breakdown.contentStructure.schema.insight,
          recommendation: scores[0]?.breakdown.contentStructure.schema.recommendation,
          value: scores[0]?.breakdown.contentStructure.schema.value
        },
        headings: { 
          score: Math.round(avg(scores.map(s => s.breakdown.contentStructure.headings.score))),
          insight: scores[0]?.breakdown.contentStructure.headings.insight,
          recommendation: scores[0]?.breakdown.contentStructure.headings.recommendation,
          value: scores[0]?.breakdown.contentStructure.headings.value
        },
        multimodal: { 
          score: Math.round(avg(scores.map(s => s.breakdown.contentStructure.multimodal.score))),
          insight: scores[0]?.breakdown.contentStructure.multimodal.insight,
          recommendation: scores[0]?.breakdown.contentStructure.multimodal.recommendation,
          value: scores[0]?.breakdown.contentStructure.multimodal.value
        },
        imageAlt: { 
          score: Math.round(avg(scores.map(s => s.breakdown.contentStructure.imageAlt?.score || 0))),
          insight: scores[0]?.breakdown.contentStructure.imageAlt?.insight,
          recommendation: scores[0]?.breakdown.contentStructure.imageAlt?.recommendation,
          value: scores[0]?.breakdown.contentStructure.imageAlt?.value
        },
        tableLists: { 
          score: Math.round(avg(scores.map(s => s.breakdown.contentStructure.tableLists.score))),
          insight: scores[0]?.breakdown.contentStructure.tableLists.insight,
          recommendation: scores[0]?.breakdown.contentStructure.tableLists.recommendation,
          value: scores[0]?.breakdown.contentStructure.tableLists.value
        },
        directAnswer: { 
          score: Math.round(avg(scores.map(s => s.breakdown.contentStructure.directAnswer.score))),
          insight: scores[0]?.breakdown.contentStructure.directAnswer.insight,
          recommendation: scores[0]?.breakdown.contentStructure.directAnswer.recommendation,
          value: scores[0]?.breakdown.contentStructure.directAnswer.value
        },
        contentGap: { 
          score: Math.round(avg(scores.map(s => s.breakdown.contentStructure.contentGap.score))),
          insight: scores[0]?.breakdown.contentStructure.contentGap.insight,
          recommendation: scores[0]?.breakdown.contentStructure.contentGap.recommendation,
          value: scores[0]?.breakdown.contentStructure.contentGap.value
        }
      },
      brandRanking: {
        brandSearch: { 
          score: Math.round(avg(scores.map(s => s.breakdown.brandRanking.brandSearch?.score || 0))),
          insight: scores[0]?.breakdown.brandRanking.brandSearch?.insight,
          recommendation: scores[0]?.breakdown.brandRanking.brandSearch?.recommendation,
          value: scores[0]?.breakdown.brandRanking.brandSearch?.value
        },
        brandSentiment: { 
          score: Math.round(avg(scores.map(s => s.breakdown.brandRanking.brandSentiment?.score || 0))),
          insight: scores[0]?.breakdown.brandRanking.brandSentiment?.insight,
          recommendation: scores[0]?.breakdown.brandRanking.brandSentiment?.recommendation,
          value: scores[0]?.breakdown.brandRanking.brandSentiment?.value
        }
      },
      websiteTechnical: {
        lcp: { 
          score: Math.round(avg(scores.map(s => s.breakdown.websiteTechnical?.lcp?.score || 0))),
          insight: scores[0]?.breakdown.websiteTechnical?.lcp?.insight,
          recommendation: scores[0]?.breakdown.websiteTechnical?.lcp?.recommendation,
          value: scores[0]?.breakdown.websiteTechnical?.lcp?.value
        },
        inp: { 
          score: Math.round(avg(scores.map(s => s.breakdown.websiteTechnical?.inp?.score || 0))),
          insight: scores[0]?.breakdown.websiteTechnical?.inp?.insight,
          recommendation: scores[0]?.breakdown.websiteTechnical?.inp?.recommendation,
          value: scores[0]?.breakdown.websiteTechnical?.inp?.value
        },
        cls: { 
          score: Math.round(avg(scores.map(s => s.breakdown.websiteTechnical?.cls?.score || 0))),
          insight: scores[0]?.breakdown.websiteTechnical?.cls?.insight,
          recommendation: scores[0]?.breakdown.websiteTechnical?.cls?.recommendation,
          value: scores[0]?.breakdown.websiteTechnical?.cls?.value
        },
        mobile: { 
          score: Math.round(avg(scores.map(s => s.breakdown.websiteTechnical?.mobile?.score || 0))),
          insight: scores[0]?.breakdown.websiteTechnical?.mobile?.insight,
          recommendation: scores[0]?.breakdown.websiteTechnical?.mobile?.recommendation,
          value: scores[0]?.breakdown.websiteTechnical?.mobile?.value
        },
        ssl: { 
          score: Math.round(avg(scores.map(s => s.breakdown.websiteTechnical?.ssl?.score || 0))),
          insight: scores[0]?.breakdown.websiteTechnical?.ssl?.insight,
          recommendation: scores[0]?.breakdown.websiteTechnical?.ssl?.recommendation,
          value: scores[0]?.breakdown.websiteTechnical?.ssl?.value
        },
        brokenLinks: { 
          score: Math.round(avg(scores.map(s => s.breakdown.websiteTechnical?.brokenLinks?.score || 0))),
          insight: scores[0]?.breakdown.websiteTechnical?.brokenLinks?.insight,
          recommendation: scores[0]?.breakdown.websiteTechnical?.brokenLinks?.recommendation,
          value: scores[0]?.breakdown.websiteTechnical?.brokenLinks?.value
        },
        llmsTxt: { 
          score: Math.round(avg(scores.map(s => s.breakdown.websiteTechnical?.llmsTxt?.score || 0))),
          insight: scores[0]?.breakdown.websiteTechnical?.llmsTxt?.insight,
          recommendation: scores[0]?.breakdown.websiteTechnical?.llmsTxt?.recommendation,
          value: scores[0]?.breakdown.websiteTechnical?.llmsTxt?.value
        },
        sitemap: { 
          score: Math.round(avg(scores.map(s => s.breakdown.websiteTechnical?.sitemap?.score || 0))),
          insight: scores[0]?.breakdown.websiteTechnical?.sitemap?.insight,
          recommendation: scores[0]?.breakdown.websiteTechnical?.sitemap?.recommendation,
          value: scores[0]?.breakdown.websiteTechnical?.sitemap?.value
        }
      },
      keywordVisibility: {
        keywords: { 
          score: Math.round(avg(scores.map(s => s.breakdown.keywordVisibility.keywords.score))),
          insight: scores[0]?.breakdown.keywordVisibility.keywords.insight,
          recommendation: scores[0]?.breakdown.keywordVisibility.keywords.recommendation,
          value: scores[0]?.breakdown.keywordVisibility.keywords.value
        },
        positions: { 
          score: Math.round(avg(scores.map(s => s.breakdown.keywordVisibility.positions.score))),
          insight: scores[0]?.breakdown.keywordVisibility.positions.insight,
          recommendation: scores[0]?.breakdown.keywordVisibility.positions.recommendation,
          value: scores[0]?.breakdown.keywordVisibility.positions.value
        },
        intentMatch: { 
          score: Math.round(avg(scores.map(s => s.breakdown.keywordVisibility.intentMatch.score))),
          insight: scores[0]?.breakdown.keywordVisibility.intentMatch.insight,
          recommendation: scores[0]?.breakdown.keywordVisibility.intentMatch.recommendation,
          value: scores[0]?.breakdown.keywordVisibility.intentMatch.value
        }
      },
      aiTrust: {
        backlinks: { 
          score: Math.round(avg(scores.map(s => s.breakdown.aiTrust.backlinks.score))),
          insight: scores[0]?.breakdown.aiTrust.backlinks.insight,
          recommendation: scores[0]?.breakdown.aiTrust.backlinks.recommendation,
          value: scores[0]?.breakdown.aiTrust.backlinks.value
        },
        referringDomains: { 
          score: Math.round(avg(scores.map(s => s.breakdown.aiTrust.referringDomains.score))),
          insight: scores[0]?.breakdown.aiTrust.referringDomains.insight,
          recommendation: scores[0]?.breakdown.aiTrust.referringDomains.recommendation,
          value: scores[0]?.breakdown.aiTrust.referringDomains.value
        },
        sentiment: { 
          score: Math.round(avg(scores.map(s => s.breakdown.aiTrust.sentiment.score))),
          insight: scores[0]?.breakdown.aiTrust.sentiment.insight,
          recommendation: scores[0]?.breakdown.aiTrust.sentiment.recommendation,
          value: scores[0]?.breakdown.aiTrust.sentiment.value
        },
        eeat: { 
          score: Math.round(avg(scores.map(s => s.breakdown.aiTrust.eeat.score))),
          insight: scores[0]?.breakdown.aiTrust.eeat.insight,
          recommendation: scores[0]?.breakdown.aiTrust.eeat.recommendation,
          value: scores[0]?.breakdown.aiTrust.eeat.value
        },
        local: { 
          score: Math.round(avg(scores.map(s => s.breakdown.aiTrust.local.score))),
          insight: scores[0]?.breakdown.aiTrust.local.insight,
          recommendation: scores[0]?.breakdown.aiTrust.local.recommendation,
          value: scores[0]?.breakdown.aiTrust.local.value
        }
      }
    }
  };
}
