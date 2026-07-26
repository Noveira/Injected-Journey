# Değişiklik Günlüğü

## 1.2.1 — 2026-07-26

- Render'da statik dosya bulunamadığında görülen belirsiz `Not found` durumu için kurulum doğrulaması ve açık tanı mesajları eklendi.
- `public` dizini standart yerleşimin yanında bir seviye iç içe repo düzeninde de bulunabiliyor.
- `/healthz` artık `staticReady` ve eksik dosya listesini bildiriyor.
- Render build komutu doğrulama ve otomatik test başarısızsa deploy'u durduruyor.
- Windows başlatıcısı PowerShell tabanlı güvenli akışa geçirildi; hata halinde kapanmıyor ve log yazıyor.
- 8080 kullanımda olduğunda sonraki boş port otomatik seçiliyor.
- GitHub'a doğrudan yüklenebilen düz kök yapılı ZIP oluşturuldu.

## 1.2.0 — 2026-07-26

- Windows ve macOS/Linux başlatıcıları sunucu sağlık kontrolü başarılı olduktan sonra tarayıcıyı açacak şekilde düzeltildi; ilk açılış yarış koşulu kaldırıldı.
- Menüye kaydedilmiş hatalı sunucu adresini tek tıkla temizleyen **Otomatik** düğmesi eklendi.
- Bağlantı ekranı hedef sunucuyu, yeniden deneme süresini ve localhost/GitHub Pages/WSS kaynaklı hataları açıkça gösteriyor.
- Yerel kullanımda `public/index.html` dosyasını doğrudan açma hatası için yönlendirici tanılama eklendi.
- GitHub deposundan tek servis halinde yayın için `render.yaml` Blueprint dosyası eklendi.
- GitHub + Render dağıtım adımları ve localhost sorun giderme rehberi yenilendi.

## 1.1.0 — 2026-07-26

- Küre ve silindir mesh winding hatası giderildi; model iç yüzey görünümü düzeltildi.
- Humanoid karakter modeli ve gelişmiş hareket animasyonları eklendi.
- Tren içi gezilebilir yapıya dönüştürüldü.
- Tren ve evren modellerine çarpışma eklendi.
- Görev konsolu çevresinde güvenli prosedürel boşluklar oluşturuldu.
- Basınç Dengesi mevcut/hedef değerleri ve canlı başarı göstergesi eklendi.
- Pointer kontrollü görevlerde takılı kalan girişler düzeltildi.
- Tamamlanmış görevlere kişisel Son Kontrol katkısı eklendi.
- Bağlantı kopması ve oyuncu kaybında görev gereksinimleri yeniden ölçekleniyor.
- Özel multiplayer sunucu adresi, WSS, oturum geri yükleme ve sağlık endpoint'i eklendi.
- Docker + Caddy internet dağıtım paketi eklendi.
- Mesh winding, reconnect ve görev yeniden ölçekleme testleri eklendi.
