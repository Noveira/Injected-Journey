# ChronoRail — Sistem Tasarım Özeti

## Maç döngüsü

Lobi → gizli rol dağıtımı → evren açılışı → dünya kuralı → ortak görevler → sabotaj/şüphe → toplantı → tüm görevler ve tüm oyuncu katkısı → sonraki evren → final.

## Görev ölçekleme

Her görev sunucuda `required` katkı sayısı taşır. Bu sayı görev tasarımındaki ortak oyuncu gereksinimi ile odadaki yaşayan oyuncu sayısının küçüğü olarak hesaplanır. Böylece solo test mümkün olurken kalabalık odalarda ortak çalışma korunur.

## Sosyal çıkarım katmanı

NPC’ler yalnızca dekor değildir. Parazit saldırısının hedefi olabilir, toplantıdaki kayıp yolcu sınıflandırmasını zorlaştırır ve oylama adaylarına sahte kimlik olarak karışır. İsim değiştirme sabotajı gerçek oyuncu ile NPC arasındaki görsel ayrımı daha da bozar.

## Sunucu otoritesi

Sunucu roller, görev ilerlemesi, evren, süre, sabotaj, ölüm, toplantı, oy ve kazanma durumunda otoritedir. Hareket istemci tarafından hesaplanıp sunucuda sınırlandırılır; bu prototipin üretim sürümünde hareket de tam sunucu otoriter simülasyona taşınmalıdır.
