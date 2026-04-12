const SERP_API_KEY = process.env.SERP_API_KEY;
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

const SUBELER = [
    { ad: "Konacık Şubesi", query: "Royal Pastanesi Konacık Şube" }
    // Test için tek şube yeterli, istersen diğerlerini de ekleyebilirsin
];

async function testRun() {
    console.log("🚀 Test başlatıldı, bağlantılar kontrol ediliyor...");

    for (const sube of SUBELER) {
        const url = `https://serpapi.com/search.json?engine=google_maps_reviews&q=${encodeURIComponent(sube.query)}&sort_by=newestFirst&api_key=${SERP_API_KEY}`;

        try {
            const response = await fetch(url);
            const data = await response.json();
            
            // Filtreleme yapmadan en son gelen ilk 3 yorumu alıyoruz
            const lastReviews = (data.reviews || []).slice(0, 3); 

            if (lastReviews.length === 0) {
                console.log(`${sube.ad} için yorum bulunamadı.`);
                continue;
            }

            for (const review of lastReviews) {
                const stars = "⭐".repeat(review.rating);
                const message = `🧪 *TEST MESAJI - ${sube.ad.toUpperCase()}*\n\n` +
                              `👤 *${review.user.name}*\n` +
                              `${stars} (${review.rating}/5)\n\n` +
                              `💬 "${review.snippet || 'Mesaj yok.'}"\n\n` +
                              `📅 Tarih: ${review.date}`;

                await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: CHAT_ID,
                        text: message,
                        parse_mode: 'Markdown'
                    })
                });
            }
            console.log(`✅ ${sube.ad} için son yorumlar Telegram'a gönderildi.`);
        } catch (error) {
            console.error("Hata:", error.message);
        }
    }
}

testRun();
