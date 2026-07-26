# İnternet Üzerinden Multiplayer Yayını

ChronoRail tek bir Node.js sürecinden hem web sayfasını hem de `/ws` WebSocket sunucusunu yayınlar. Farklı ağlardaki oyuncuların tamamı aynı herkese açık sunucu adresine bağlanmalıdır. `localhost` yalnızca oyunu çalıştıran bilgisayarı ifade eder.

## Seçenek A — GitHub + Render (en kolay)

GitHub burada kaynak kod deposudur. GitHub Pages yalnızca statik dosya yayınladığı için Node.js/WebSocket sunucusunu çalıştırmaz. Bu nedenle repo Render üzerinde **Web Service** olarak deploy edilir.

### Kurulum

1. GitHub'da boş bir repo oluştur.
2. ZIP içindeki dosyaları alt klasör oluşturmadan repo köküne yükle. `package.json`, `server.mjs` ve `render.yaml` kökte görünmelidir.
3. Render'a GitHub hesabınla giriş yap.
4. **New → Blueprint** seç ve repoyu bağla.
5. Render kökteki `render.yaml` dosyasını okuyup şu ayarlarla servisi oluşturur:
   - Runtime: Node
   - Build: `npm install`
   - Start: `npm start`
   - Health check: `/healthz`
   - Host: `0.0.0.0`
6. Deploy tamamlandığında Render'ın verdiği `https://SERVIS.onrender.com` adresini aç.
7. Menüde **Multiplayer Sunucusu** alanını boş bırak. İstemci otomatik olarak `wss://SERVIS.onrender.com/ws` kullanır.
8. Arkadaşların aynı siteyi açıp aynı oda kodunu girmelidir.

### GitHub Pages kullanmak istersen

İstemciyi Pages'te ayrıca yayınlamak mümkündür fakat backend yine Render/VPS üzerinde çalışmalıdır. Bu durumda Pages sitesindeki **Multiplayer Sunucusu** alanına `wss://SERVIS.onrender.com/ws` yazılır. Ayrı origin kullanıyorsan Render ortamında `ALLOWED_ORIGINS=https://KULLANICI.github.io` ayarlanabilir. En az hata çıkaran çözüm, istemci ve sunucuyu aynı Render Web Service üzerinden yayınlamaktır.

### Ücretsiz servis notu

Ücretsiz web servisleri kullanılmadığında uykuya geçebilir. İlk HTTP veya WebSocket isteğinde tekrar açılırken kısa bir bekleme yaşanabilir. Aktif odalar sunucu belleğinde tutulduğu için servis yeniden başlatılırsa mevcut maçlar kapanır. Sürekli açık üretim sunucusu için ücretli instance veya VPS tercih edilir.

## Render “Not found” düzeltmesi

Ekranda yalnızca düz metin olarak `Not found` görünmesi, çalışan Node sürecinin ana sayfa dosyasını bulamadığı anlamına gelir. Önce GitHub repo kökünü kontrol et:

```text
package.json
server.mjs
render.yaml
public/
  index.html
  styles.css
  src/
```

Render servis ayarları:

- Service Type: **Web Service**
- Runtime: **Node**
- Root Directory: dosyalar repo kökündeyse boş; bir alt klasördeyse o klasör adı
- Build Command: `npm install && npm run verify && npm test`
- Start Command: `npm start`
- Health Check Path: `/healthz`

Ayarları kaydettikten sonra **Manual Deploy → Clear build cache & deploy latest commit** seç. Deploy logunda önce `ChronoRail kurulum doğrulaması başarılı.`, çalışma başladığında da `ChronoRail 1.2.1 hazır` görünmelidir. Ardından `/healthz` cevabında `"staticReady":true` bulunur.

## Seçenek B — VPS + Docker + otomatik HTTPS

Gerekenler:

- Herkese açık IPv4/IPv6 adresi olan Linux VPS
- Sunucu IP'sine yönlendirilmiş alan adı
- Docker ve Docker Compose
- TCP 80 ve 443 açık güvenlik duvarı

```bash
cp .env.example .env
# SITE_ADDRESS değerini alan adınla değiştir
docker compose -f compose.public.yml up -d --build
```

Caddy, DNS doğruysa TLS sertifikasını alır ve WebSocket bağlantısını WSS üzerinden geçirir. Oyuncular `https://ALAN_ADIN` adresini açar; sunucu alanı boş kalır.

## Sağlık ve bağlantı kontrolleri

Tarayıcıda:

```text
https://ALAN_ADIN/healthz
```

Başarılı cevapta `ok: true`, sürüm, aktif oda sayısı ve çalışma süresi görülür. WebSocket yolu her zaman:

```text
wss://ALAN_ADIN/ws
```

Yerelde:

```text
http://localhost:8080/healthz
ws://localhost:8080/ws
```

## Güvenlik ve ölçek notları

- Açık internette `wss://` kullan. HTTPS bir sayfadan güvensiz `ws://` bağlantısı tarayıcı tarafından engellenebilir.
- `ALLOWED_ORIGINS` virgülle ayrılmış izinli web origin'leriyle sınırlandırılabilir. Aynı domain dağıtımında boş bırakılabilir.
- Kısa ağ kopmalarında oturum varsayılan 30 saniye korunur; `RECONNECT_GRACE_MS` ile değiştirilebilir.
- Oda verileri bellektedir. Çoklu instance veya bölgesel sunucu için Redis benzeri ortak durum katmanı, merkezi oda dizini ve sticky-session/oda yönlendirmesi gerekir.
