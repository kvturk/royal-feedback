const SERP_API_KEY = process.env.SERP_API_KEY;
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

// TÜM ŞUBELERİN DİJİTAL KİMLİKLERİ (data_id)
const SUBELER = [
    { 
        ad: "Gümbet Şubesi", 
        data_id: "0x14be6c4b08285de1:0x3ba811719107302" 
    },
    { 
        ad: "Konacık Şubesi", 
        data_id: "0x14be6dc9c9c3a38b:0x30a13f47b5fa2716" 
    },
    { 
        ad: "Kumbahçe Şubesi", 
        data_id: "0x14be6c11f2911b3f:0x2383407d44305a02" 
    },
    { 
        ad: "Gümbet 2 Şubesi", 
        data_id: "0x14be6d7e569dbaf3:0x43e8e17552f364d2" 
    },
    { 
        ad: "Royal Fırın Pasta (Bitez)", 
        data_id: "0x14be6c4b32762d69:0xb861d8fc43493945" 
    }
];

async function checkReviews() {
    console.log("🚀 Tüm şubeler için yorum kontrol sistemi başlatıldı...");

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

            // TEST MODU: Her şube için son 1 yorumu çeker. 
            // Gerçek kullanıma geçerken burayı son 24 saat filtresiyle değiştireceğiz.
            const testReview = reviews[0]; 

            if (testReview) {
                const stars = "⭐".repeat(testReview.rating);
                let message = `🏢 *ŞUBE: ${sube.ad.toUpperCase()}*\n` +
                              `🌟 *Son Google Yorumu*\n\n` +
                              `👤 *${testReview.user.name}*\n` +
                              `${stars} (${testReview.rating}/5)\n\n`;

                // Eğer yorum metni varsa ekle, yoksa (sadece puan verilmişse) belirt
                if (testReview.snippet) {
                    message += `💬 "${testReview.snippet}"\n\n`;
                } else {
                    message += `💬 (Sadece puan verilmiş, metin yok)\n\n`;
                }

                message += `📅 Tarih: ${testReview.date}\n` +
                           `🔗 [Haritada Gör](${testReview.link})`;

                const tgResponse = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: CHAT_ID,
                        text: message,
                        parse_mode: 'Markdown'
                    })
                });

                if (tgResponse.ok) {
                    console.log(`✅ ${sube.ad} yorumu Telegram'a başarıyla gönderildi!`);
                } else {
                    console.error(`❌ Telegram Hatası (${sube.ad}): ${tgResponse.status}`);
                }
            } else {
                console.log(`ℹ️ ${sube.ad} için hiç yorum bulunamadı.`);
            }
        } catch (error) {
            console.error(`❌ ${sube.ad} taranırken hata:`, error.message);
        }
    }
    console.log("🏁 Tarama tamamlandı.");
}

checkReviews();
