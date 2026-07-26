# ChronoRail: Parazit Protokolü

**Sürüm 1.2.0** — WebGL2 tabanlı 3D sosyal çıkarım ve ortak görev oyunu. Oyuncular zaman treninde farklı evren duraklarını geçer; her durakta dünya kuralı değişir, beş ortak görev açılır ve gizli Parazitler zaman çizgisini bozmaya çalışır.

## Hızlı çalıştırma

### Windows

1. ZIP dosyasını tamamen çıkart.
2. Node.js 20 veya daha yeni bir sürüm kurulu olsun.
3. `start-windows.bat` dosyasını aç ve siyah sunucu penceresini açık bırak.
4. Başlatıcı önce `http://127.0.0.1:8080/healthz` kontrolünü yapar, ardından oyunu `http://localhost:8080` adresinde açar.
5. Menüde **Multiplayer Sunucusu** alanını yerelde boş bırak. Eski bir adres kayıtlıysa **Otomatik** düğmesine bas.

`public/index.html` dosyasını çift tıklayarak açma; WebSocket sunucusu olmadan multiplayer çalışmaz.

### macOS / Linux

```bash
chmod +x start-linux-mac.sh
./start-linux-mac.sh
```

Alternatif:

```bash
npm start
```

## GitHub deposundan herkese açık yayın

GitHub depo olarak kullanılabilir, fakat **GitHub Pages tek başına bu multiplayer oyunu çalıştıramaz**; Pages yalnızca statik HTML/CSS/JavaScript yayınlar. ChronoRail ayrıca sürekli çalışan Node.js ve WebSocket sunucusuna ihtiyaç duyar.

En kolay yapı:

1. Bu klasörün içeriğini bir GitHub reposunun köküne yükle.
2. Render hesabında **New → Blueprint** seç.
3. GitHub reposunu bağla; kökteki `render.yaml` otomatik algılanır.
4. Blueprint'i oluştur ve deploy tamamlanınca verilen `https://...onrender.com` adresini aç.
5. Menüde sunucu alanını boş bırak. Site otomatik olarak aynı domain üzerindeki `wss://.../ws` sunucusuna bağlanır.
6. Her oyuncu aynı site adresini açıp aynı oda kodunu kullanır.

Repo güncellendiğinde Render bağlı branch'i yeniden deploy edebilir. Ücretsiz servis uykuya geçebildiği için ilk bağlantı bazen kısa süre bekletebilir; kalıcı ve hızlı yayın için ücretli/daima açık bir instance veya VPS kullanılır. Ayrıntılar [DEPLOYMENT.md](DEPLOYMENT.md) dosyasında.

## Farklı ağlar ve ülkeler arasında multiplayer

Oyun sunucusu internete yayınlandığında oda sistemi farklı internet sağlayıcıları, şehirler ve ülkeler arasında çalışır. Oyuncuların aynı herkese açık sunucuya bağlanması gerekir; `localhost` yalnızca sunucunun kendi bilgisayarını ifade eder.

Projede şunlar hazırdır:

- Aynı domain üzerinden otomatik `wss://DOMAIN/ws` bağlantısı
- Menüden özel `ws://` / `wss://` sunucu adresi seçimi
- Docker üretim imajı
- Caddy ile otomatik HTTPS/WSS sağlayan `compose.public.yml`
- `/healthz` sağlık kontrolü
- Kısa ağ kopmalarında 30 saniyelik güvenli oturum geri yükleme
- İstemci hareket yumuşatma ve sunucu tarafında aşırı hareket sınırı

VPS ve alan adı kurulumu için [DEPLOYMENT.md](DEPLOYMENT.md) dosyasına bak. Özet komut:

```bash
cp .env.example .env
# .env içindeki SITE_ADDRESS değerini gerçek alan adınla değiştir
docker compose -f compose.public.yml up -d --build
```

Oyuncular daha sonra `https://ALAN_ADIN` adresini açıp aynı oda kodunu kullanır. İstemci başka bir yerde çalışıyorsa menüdeki **Multiplayer Sunucusu** alanına `wss://ALAN_ADIN/ws` yazılır.

## Localhost bağlantı sorunu

Menüde “Bağlantı koptu” görünürse şu sırayla kontrol et:

1. `start-windows.bat` penceresinin açık olduğundan ve `ChronoRail 1.2.0 hazır: http://localhost:8080` yazdığından emin ol.
2. Tarayıcıda `http://localhost:8080/healthz` aç. `{"ok":true,...}` görünmüyorsa sunucu çalışmıyordur.
3. Oyunda **Multiplayer Sunucusu → Otomatik** düğmesine bas. Yerelde özel `wss://` adresi yazma.
4. Sayfayı `file:///.../public/index.html` olarak değil, yalnızca `http://localhost:8080` üzerinden aç.
5. Port kullanımda hatası varsa diğer Node sürecini kapat veya `PORT=8090 node server.mjs` ile farklı port kullanıp `http://localhost:8090` adresini aç.
6. Windows Güvenlik Duvarı yalnızca başka cihazların LAN üzerinden bağlanması için izin isteyebilir; aynı bilgisayardaki localhost bağlantısı için tarayıcı ve Node.js'in engellenmediğini kontrol et.

## Kontroller

| Tuş | İşlev |
|---|---|
| W / A / S / D | Hareket |
| Fare | Üçüncü şahıs kamera |
| Shift | Koşu; “Koşmak Yasak” kuralında devre dışı |
| Space | Zıplama; düşük yerçekiminde daha yüksek |
| E | Yakındaki görev konsolunu kullan |
| Q | Acil toplantı / zaman izi raporu |
| Enter | Sohbet; “Kimse Konuşamaz” kuralında engellenir |
| F | Parazit saldırısı |
| 1 | Görev protokollerini ters çevir |
| 2 | Geçiş kapılarını kilitle |
| 3 | Karartma |
| 4 | İsimleri değiştir |
| Esc | Fare kilidini bırak |

## Model, animasyon ve fizik iyileştirmeleri

### Karakter

- Küre ve silindir meshlerindeki ters üçgen yönü düzeltildi. Bu hata modelin dış yüzlerini görünmez yapıp içini gösteriyordu.
- Normal matrisi, orantısız ölçeklerde doğru aydınlatma verecek şekilde düzeltildi.
- Eski blok karakter yerine baş, yüz, göz, kaş, saç, boyun, gövde, omuz, iki parçalı kol, el, iki parçalı bacak, bot ve zaman modülünden oluşan daha okunabilir humanoid model eklendi.
- Eklem parçaları birbirinin içine kontrollü biçimde bindirilerek omuz, dirsek, diz ve boyunda boşluk oluşması engellendi.
- Yürüme, koşma, boşta nefes/bobin, zıplama ve ölüm pozları geliştirildi.
- Kısa saç, mohawk, topuz ve saçsız seçenekleri yeni modele uyarlandı.

### Çarpışma

- Tren artık tek parça dolu kutu değildir; açık girişli, içinde yürünebilen bir vagon ve ayrı lokomotif gövdesi olarak kurulmuştur.
- Tren yan duvarları, kapı çerçeveleri, lokomotif, koltuklar ve diğer büyük parçalar fiziksel çarpışmaya sahiptir.
- Ağaçlar, kayalar, buz kütleleri, şehir binaları, tapınak sütunları, gölge kristalleri ve büyük çevre modelleri için çarpışma eklendi.
- Hareket eksen bazlı çözülür; oyuncu duvar boyunca kayabilir fakat modelin içinden geçemez.
- Görev konsolları fiziksel nesnedir ancak etkileşim mesafesi çarpışma yarıçapına göre ayarlanmıştır.
- Prosedürel çevre nesneleri doğma alanından, trenden ve görev konsollarından uzak tutulur; görevlerin model içinde kalması engellenir.

## Görev düzeltmeleri

Bütün 50 görev yedi çalışan mini oyun türüne bağlıdır: sıra, faz/frekans, eşzamanlı kilit, basılı tutma, eşleştirme, enerji dengesi ve dişli.

### Basınç Dengesi nasıl yapılır?

Her kanal satırında iki bilgi görünür:

- **Mevcut:** Kaydırıcının o anki değeri; kaydırdıkça anlık değişir.
- **Hedef:** Ulaşman gereken sayı.

Mevcut değer hedefin ±4 aralığına girince satır yeşil olur. Üç satır da yeşilken **Dengeyi Kilitle** düğmesine basılır. Ters görev sabotajında kaydırıcı yönü tersine döner.

### Ortak görev kilitlenmesi düzeltmesi

Önceden bir grup bütün görevleri bitirirse henüz katkı vermeyen son oyuncu tamamlanmış konsolları kullanamıyor ve evren geçişi sonsuza kadar kilitlenebiliyordu. Artık katkı vermemiş oyuncu tamamlanmış herhangi bir konsolda **Son Kontrol** mini oyununu yapabilir.

Ayrıca:

- Oyuncu bağlantısı kesilir veya tahliye edilirse ortak görev gereksinimleri aktif oyuncu sayısına göre yeniden ölçeklenir.
- Eşzamanlı görevlerde farklı oyuncuların katkıları sekiz saniyelik ortak pencerede doğrulanır.
- Düğme basılı tutma ve frekans kontrollerinde pointer bırakma/iptal durumları temizlenir; kontrolün takılı kalması engellenir.
- Enerji dengeleme ekranı artık mevcut değerleri canlı gösterir ve anlaşılır yönerge verir.
- Görev istasyonlarının çevresinde boş alan garanti edilir.

## Oyun sistemleri

### On evren

1. Sonsuz Saat Diyarı
2. Okyanus Evreni
3. Lav Dünyası
4. Yaşayan Orman
5. Donmuş Dünya
6. Kozmik Boşluk
7. Siber Şehir
8. Gölge Boyutu
9. Antik Tapınak
10. Evren Çöküşü

### Evren geçişi

- Duraktaki beş görev tamamlanmadan geçiş açılmaz.
- Yaşayan ve bağlı her gerçek oyuncu en az bir göreve katkı sağlamalıdır.
- Çok oyunculu görevler benzersiz oyuncu katkısı ister.
- Ray frekansı yanlış kilitlenirse tren rastgele başka bir evrene sapar.

### Dünya kuralları

- Yerçekimi %30
- Koşmak yasak
- Kimse konuşamaz
- Sesler yankılanıyor
- Görünüşler değişiyor
- Finalde bütün kurallar birlikte

### Parazit ve toplantı

- 5–7 oyuncuda bir, 8–10 oyuncuda iki Parazit
- Gerçek oyuncu veya NPC zaman izini silme
- Görev ters çevirme, kapı kilitleme, karartma ve isim değiştirme sabotajları
- 30 NPC yolcu
- Önce kaybın NPC mi gerçek oyuncu mu olduğunu sınıflandırma
- Gerçek oyuncuların arasına karışan NPC sahte oy adayları

## Teknik yapı

```text
time-paradox-train/
├── package.json
├── server.mjs
├── Dockerfile
├── compose.public.yml
├── render.yaml
├── DEPLOYMENT.md
├── deploy/
│   └── Caddyfile
├── public/
│   ├── index.html
│   ├── styles.css
│   └── src/
│       ├── engine.js
│       └── game.js
├── tests/
│   ├── geometry-test.mjs
│   └── smoke-test.mjs
├── start-windows.bat
└── start-linux-mac.sh
```

Proje harici npm paketi veya CDN kullanmaz. 3D meshler kodla üretilir; HTTP ve WebSocket sunucusu Node.js çekirdek modülleriyle çalışır.

## Test

```bash
npm test
```

Doğrulanan başlıklar:

- Küp, küre ve silindirde dışa bakan üçgen yönü
- Sağlık endpoint'i ve statik dosyalar
- HTML–JavaScript DOM eşleşmesi
- Çarpışma, canlı denge göstergesi ve reconnect istemci kancaları
- WebSocket bağlantısı, oda oluşturma ve katılma
- Oturumun bağlantı kopmasından sonra geri yüklenmesi
- Bağlantı kopunca görev gereksinimlerinin yeniden ölçeklenmesi
- Solo görev tamamlama ve evren geçişi
- Rol dağıtımı, sabotaj, saldırı ve kazanma durumu

## Doğrulanmış sınır

Bu paket internet üzerinden oynanabilen sunucu kodunu ve üretim dağıtım dosyalarını içerir; ancak herkese açık sunucu, alan adı ve TLS sertifikası kullanıcının kendi VPS/cloud hesabında çalıştırılmalıdır. Bu teslimat doğrudan bir üçüncü taraf hesaba yayınlanmadı çünkü gerekli sunucu/domain erişim bilgileri sağlanmadı.

Oda verileri bellektedir. Sunucu yeniden başlatılırsa aktif maçlar kapanır. Çok büyük ölçek ve birden fazla fiziksel bölge için kalıcı oturum katmanı, merkezi oda dizini ve bölgesel sunucu yönlendirmesi ayrıca gerekir.
