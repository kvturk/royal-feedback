
const fs = require('fs');

const SERP_API_KEY = process.env.SERP_API_KEY;
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

// Şube listesi (Senin verdiğin data_id'ler ile)
const SUBELER = [
    { ad: "Gümbet Şubesi", data_id: "0x14be6c4b08285de1:0x3ba811719107302" },
    { ad: "Konacık Şubesi", data_id: "0x14be6dc9c9c3a38b:0x30a13f47b5fa2716" },
    { ad: "Kumbahçe Şubesi", data_id: "0x14be6c11f2911b3f:0x2383407d44305a02" },
    { ad: "Gümbet 2 Şubesi", data_id: "0x14be6d7e569dbaf3:0x43e8e17552f364d2" },
    { ad: "Royal Fırın Pasta (Bitez)", data_id: "0x14be6c4b32762d69:0xb861d8fc43493945" }
];

async function checkReviews() {
    console.log("🚀 Yorum kontrolü başlıyor...");

    // 1. Mevcut hafızayı (yorumlar.json) oku
    let memory = [];
    try {
        const data = fs.readFileSync('yorumlar.json', 'utf8');
        memory = JSON.parse(data);
    } catch (err) {
        console.log("ℹ️ Henüz hafıza dosyası yok veya boş.");
    }

    let allSavedIds = memory.map(r => r.review_id);
    let newReviewsCount = 0;

    for (const sube of SUBELER) {
        console.log(`🔍 ${sube.ad} taranıyor...`);
        const url = `https://serpapi.com/search.json?engine=google_maps_reviews&data_id=${sube.data_id}&sort_by=newestFirst&api_key=${SERP_API_KEY}`;

        try {
            const response = await fetch(url);
            const data = await response.json();
            const reviews = data.reviews || [];

            for (const review of reviews) {
                // Eğer bu yorumun ID'si hafızamızda YOKSA yenidir
                if (!allSavedIds.includes(review.review_id)) {
                    newReviewsCount++;
                    
                    // Hafızaya ekle (Frontend'de kullanmak için şube adını da ekliyoruz)
                    memory.push({
                        sube_adi: sube.ad,
                        ...review,
                        save_date: new Date().toISOString()
                    });

                    // Telegram Mesajı Hazırla
                    const stars = "⭐".repeat(review.rating);
                    let message = `🏢 *${sube.ad.toUpperCase()}*\n` +
                                  `🌟 *Yeni Yorum Geldi!*\n\n` +
                                  `👤 *${review.user.name}*\n` +
                                  `${stars} (${review.rating}/5)\n\n` +
                                  `💬 "${review.snippet || 'Sadece puan bırakılmış.'}"\n\n` +
                                  `🔗 [Haritada Gör](${review.link})`;

                    // Telegram'a gönder
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
            }
        } catch (error) {
            console.error(`❌ ${sube.ad} hatası:`, error.message);
        }
    }

    // 3. Güncellenmiş hafızayı dosyaya geri yaz
    if (newReviewsCount > 0) {
        // En yeni yorumlar en üstte görünsün diye sıralayalım
        memory.sort((a, b) => new Date(b.save_date) - new Date(a.save_date));
        fs.writeFileSync('yorumlar.json', JSON.stringify(memory, null, 2));
        console.log(`✅ Toplam ${newReviewsCount} yeni yorum kaydedildi ve gönderildi.`);
    } else {
        console.log("ℹ️ Yeni yorum bulunamadı.");
    }
}

checkReviews();
