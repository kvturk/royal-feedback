const SERP_API_KEY = process.env.SERP_API_KEY;
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

// TÜM ŞUBELERİN DİJİTAL KİMLİKLERİ (data_id)
const SUBELER = [
    { ad: "Gümbet Şubesi", data_id: "0x14be6c4b08285de1:0x3ba811719107302" },
    { ad: "Konacık Şubesi", data_id: "0x14be6dc9c9c3a38b:0x30a13f47b5fa2716" },
    { ad: "Kumbahçe Şubesi", data_id: "0x14be6c11f2911b3f:0x2383407d44305a02" },
    { ad: "Gümbet 2 Şubesi", data_id: "0x14be6d7e569dbaf3:0x43e8e17552f364d2" },
    { ad: "Royal Fırın Pasta (Bitez)", data_id: "0x14be6c4b32762d69:0xb861d8fc43493945" }
];

async function checkReviews() {
    console.log("🚀 Günlük yorum kontrol sistemi başlatıldı...");

    for (const sube of SUBELER) {
        console.log(`🔍 Taranıyor: ${sube.ad}...`);
        
        const url = `https://serpapi.com/search.json?engine=google_maps_reviews&data_id=${sube.data_id}&sort_by=newestFirst&api_key=${SERP_API_KEY}`;

        try {
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.error) {
                console.error(`❌ SerpApi Hatası (${sube.ad}):`, data.error);
                continue;
            }

            const reviews = data.reviews || [];

            // KALICI MOD: Sadece son 24 saatte yazılan (saat/dakika/saniye içeren) yorumları filtrele
            const newReviews = reviews.filter(r => 
                r.date.includes('hour') || 
                r.date.includes('minute') || 
                r.date.includes('saat') || 
                r.date.includes('dakika') || 
                r.date.includes('saniye') ||
                r.date.includes('new')
            );

            if (newReviews.length > 0) {
                for (const review of newReviews) {
                    const stars = "⭐".repeat(review.rating);
                    let message = `🏢 *ŞUBE: ${sube.ad.toUpperCase()}*\n` +
                                  `🌟 *Yeni Google Yorumu!*\n\n` +
                                  `👤 *${review.user.name}*\n` +
                                  `${stars} (${review.rating}/5)\n\n`;

                    if (review.snippet) {
                        message += `💬 "${review.snippet}"\n\n`;
                    } else {
                        message += `💬 (Sadece puan verilmiş)\n\n`;
                    }

                    message += `🔗 [Haritada Gör](${review.link})`;

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
                console.log(`✅ ${sube.ad} için yeni yorumlar Telegram'a gönderildi!`);
            } else {
                console.log(`ℹ️ ${sube.ad} için bugün yeni yorum yok.`);
            }
        } catch (error) {
            console.error(`❌ ${sube.ad} taranırken hata:`, error.message);
        }
    }
    console.log("🏁 Günlük tarama tamamlandı.");
}

checkReviews();
