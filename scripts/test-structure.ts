import * as cheerio from 'cheerio';

const URLS = [
    'https://r3lifewellness.com/en/blog/thermage-eye-treatment-non-surgical-solution-for-youthful-eyes',
    'https://r3lifewellness.com/en/nkcell',
    'https://r3lifewellness.com/en/stem-cells'
];

async function testStructure() {
    console.log('🧪 Testing Pillar 1: Table/List Utilization\n');

    for (const url of URLS) {
        console.log(`Analyzing: ${url}`);
        try {
            const response = await fetch(url);
            const html = await response.text();
            const $ = cheerio.load(html);

            // Count Tables
            const tableCount = $('table').length;

            // Count Lists (ul, ol)
            const listCount = $('ul, ol').length;

            // Count List Items (li) to ensure they aren't empty lists
            const listItemCount = $('li').length;

            // Scoring Logic (from measurement_config.md)
            // +3 if Tables >= 2
            // +3 if Lists >= 5
            let score = 0;
            if (tableCount >= 2) score += 3;
            if (listCount >= 5) score += 3;

            console.log(`   📊 Tables Found: ${tableCount}`);
            console.log(`   📝 Lists Found: ${listCount} (Total items: ${listItemCount})`);
            console.log(`   🏆 Score: ${score}/6\n`);

        } catch (error) {
            console.error(`   ❌ Failed to fetch: ${error}\n`);
        }
    }
}

testStructure();
