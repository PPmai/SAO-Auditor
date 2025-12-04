import * as cheerio from 'cheerio';

const URLS = [
    'https://r3lifewellness.com/en/blog/thermage-eye-treatment-non-surgical-solution-for-youthful-eyes',
    'https://r3lifewellness.com/en/nkcell',
    'https://r3lifewellness.com/en/stem-cells'
];

async function testSchema() {
    console.log('🧪 Testing Pillar 1: Schema Coverage\n');

    for (const url of URLS) {
        console.log(`Analyzing: ${url}`);
        try {
            const response = await fetch(url);
            const html = await response.text();
            const $ = cheerio.load(html);

            const schemaTags = $('script[type="application/ld+json"]');
            let hasSchema = false;
            let hasRichSchema = false;
            let schemaTypes: string[] = [];

            schemaTags.each((_, el) => {
                try {
                    const data = JSON.parse($(el).html() || '{}');
                    hasSchema = true;

                    // Helper to recursively find types
                    const findTypes = (obj: any) => {
                        if (!obj) return;
                        if (obj['@type']) {
                            const type = obj['@type'];
                            schemaTypes.push(type);

                            // Check for Rich Schema types
                            if (['FAQPage', 'HowTo', 'Product', 'Article', 'BlogPosting', 'MedicalWebPage'].includes(type)) {
                                hasRichSchema = true;
                            }
                        }
                        // Check nested objects
                        Object.values(obj).forEach(val => {
                            if (typeof val === 'object') findTypes(val);
                        });
                    };

                    if (Array.isArray(data)) {
                        data.forEach(item => findTypes(item));
                    } else {
                        findTypes(data);
                    }
                } catch (e) {
                    console.error('Error parsing JSON-LD:', e);
                }
            });

            // Calculate Score
            let score = 0;
            if (hasSchema) score += 4;
            if (hasRichSchema) score += 4;

            console.log(`   ✅ Schema Detected: ${hasSchema}`);
            console.log(`   Types Found: ${[...new Set(schemaTypes)].join(', ') || 'None'}`);
            console.log(`   🌟 Rich Schema: ${hasRichSchema}`);
            console.log(`   🏆 Score: ${score}/8\n`);

        } catch (error) {
            console.error(`   ❌ Failed to fetch: ${error}\n`);
        }
    }
}

testSchema();
