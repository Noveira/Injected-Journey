import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, 'public');
const PORT = Number(process.env.PORT || 8080);
const HOST = process.env.HOST || '0.0.0.0';
const VERSION = '1.2.0';
const RECONNECT_GRACE_MS = Math.max(5000, Number(process.env.RECONNECT_GRACE_MS || 30000));
const ALLOWED_ORIGINS = new Set(String(process.env.ALLOWED_ORIGINS || '').split(',').map((v) => v.trim()).filter(Boolean));

const UNIVERSES = [
  { name: 'Sonsuz Saat Diyarı', tasks: [
    ['clock-sync', 'Saat Mekanizmasını Senkronize Et', 'sync', 2],
    ['boiler', 'Kazanı Çalıştır', 'sequence', 3],
    ['giant-clock', 'Dev Saati Kur', 'gears', 1],
    ['rail-frequency', 'Ray Frekansını Ayarla', 'align', 1],
    ['pressure', 'Basınç Dengesi', 'balance', 10]
  ]},
  { name: 'Okyanus Evreni', tasks: [
    ['drain-water', 'Suyu Boşalt', 'hold', 1],
    ['glass', 'Çatlayan Camı Tamir Et', 'connect', 1],
    ['sonar', 'Sonar Sistemini Çalıştır', 'align', 1],
    ['isolate', 'Elektriği Sudan İzole Et', 'sequence', 2],
    ['oxygen', 'Oksijen Tanklarını Değiştir', 'sync', 2]
  ]},
  { name: 'Lav Dünyası', tasks: [
    ['coolant', 'Soğutucu Sıvı Taşı', 'hold', 1],
    ['molten-pipe', 'Erimiş Boruyu Değiştir', 'connect', 2],
    ['lava-pump', 'Lav Pompasını Çalıştır', 'sequence', 2],
    ['magma-filter', 'Magma Filtresini Temizle', 'gears', 1],
    ['heat-shield', 'Isı Kalkanını Aktif Et', 'balance', 3]
  ]},
  { name: 'Yaşayan Orman', tasks: [
    ['roots', 'Kökleri Kes', 'sequence', 1],
    ['mushrooms', 'Zehirli Mantarları Temizle', 'connect', 1],
    ['vines', 'Sarmaşıkları Yak', 'hold', 1],
    ['tree-heart', 'Dev Ağacın Kalbini Mühürle', 'sync', 3],
    ['toxins', 'Bitki Toksinlerini Filtrele', 'balance', 2]
  ]},
  { name: 'Donmuş Dünya', tasks: [
    ['heaters', 'Isıtıcıları Çalıştır', 'sequence', 2],
    ['doors', 'Donmuş Kapıları Erit', 'hold', 1],
    ['engine-ice', 'Motor Buzunu Kır', 'connect', 1],
    ['warm-fuel', 'Yakıtı Isıt', 'balance', 2],
    ['rail-ice', 'Ray Buzlarını Temizle', 'gears', 1]
  ]},
  { name: 'Kozmik Boşluk', tasks: [
    ['gravity', 'Yerçekimini Yeniden Başlat', 'sync', 3],
    ['satellite', 'Uydu Antenini Hizala', 'align', 1],
    ['meteor', 'Meteor Kalkanını Aç', 'sequence', 2],
    ['quantum', 'Kuantum Bataryası Tak', 'connect', 1],
    ['dimension-engine', 'Boyut Motorunu Çalıştır', 'balance', 3]
  ]},
  { name: 'Siber Şehir', tasks: [
    ['server', 'Sunucuyu Yeniden Başlat', 'sequence', 1],
    ['firewall', 'Güvenlik Duvarını Kır', 'gears', 1],
    ['robots', 'Robotları Yeniden Programla', 'connect', 2],
    ['data', 'Veri Paketlerini Gönder', 'align', 1],
    ['ai-reset', 'Yapay Zekâyı Sıfırla', 'sync', 3]
  ]},
  { name: 'Gölge Boyutu', tasks: [
    ['light-towers', 'Işık Kulelerini Yak', 'sequence', 3],
    ['shadow-crystals', 'Gölge Kristallerini Kır', 'connect', 1],
    ['projectors', 'Projektörleri Çalıştır', 'align', 2],
    ['curse-book', 'Lanet Kitabını Mühürle', 'gears', 1],
    ['dark-core', 'Karanlık Çekirdeğini Kapat', 'balance', 3]
  ]},
  { name: 'Antik Tapınak', tasks: [
    ['stone-doors', 'Taş Kapıları Aç', 'sync', 2],
    ['crystals', 'Kristalleri Yerine Koy', 'connect', 1],
    ['relics', 'Kutsal Emanetleri Taşı', 'hold', 1],
    ['temple-mechanism', 'Tapınak Mekanizmasını Döndür', 'gears', 2],
    ['runes', 'Rune Bulmacasını Çöz', 'sequence', 1]
  ]},
  { name: 'Evren Çöküşü', tasks: [
    ['time-core', 'Zaman Çekirdeğini Onar', 'connect', 3],
    ['dimension-gate', 'Boyut Kapısını Kapat', 'sync', 3],
    ['energy-cores', 'Tüm Enerji Çekirdeklerini Doldur', 'balance', 4],
    ['last-route', 'Son Rotayı Ayarla', 'align', 2],
    ['last-universe', 'Treni Son Evrene Ulaştır', 'sequence', 5]
  ]}
];

const WORLD_RULES = ['low_gravity', 'no_run', 'no_talk', 'echo', 'appearance_swap'];
const NPC_NAMES = [
  'Mira','Atlas','Lina','Bora','Nova','Arda','Lara','Mert','Ada','Eren',
  'Kora','Deniz','Rhea','Can','Nora','Emir','Iris','Sarp','Maya','Kerem',
  'Ayla','Baran','Vega','Selin','Ozan','Luna','Alp','Duru','Orion','Nehir'
];

const rooms = new Map();
let nextPlayerId = 1;

function randomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  do {
    code = Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  } while (rooms.has(code));
  return code;
}

function cleanName(value) {
  const name = String(value || 'Yolcu').replace(/[<>]/g, '').trim().slice(0, 18);
  return name || 'Yolcu';
}

function cleanCosmetics(value = {}) {
  const hex = (v, fallback) => /^#[0-9a-f]{6}$/i.test(String(v || '')) ? String(v) : fallback;
  return {
    suit: hex(value.suit, '#2fe0ff'),
    accent: hex(value.accent, '#ffbd3e'),
    skin: hex(value.skin, '#d89b72'),
    hair: hex(value.hair, '#261a17'),
    hairStyle: ['short','mohawk','bun','none'].includes(value.hairStyle) ? value.hairStyle : 'short',
    visor: hex(value.visor, '#9ff7ff')
  };
}

class WSConnection {
  constructor(socket) {
    this.socket = socket;
    this.buffer = Buffer.alloc(0);
    this.closed = false;
    this.playerId = null;
    this.roomCode = null;
    socket.setKeepAlive(true, 30000);
    socket.on('data', (chunk) => this.onData(chunk));
    socket.on('close', () => this.onClose());
    socket.on('error', () => this.onClose());
  }

  send(payload) {
    if (this.closed || this.socket.destroyed) return;
    const text = JSON.stringify(payload);
    const data = Buffer.from(text);
    let header;
    if (data.length < 126) {
      header = Buffer.from([0x81, data.length]);
    } else if (data.length < 65536) {
      header = Buffer.alloc(4);
      header[0] = 0x81;
      header[1] = 126;
      header.writeUInt16BE(data.length, 2);
    } else {
      header = Buffer.alloc(10);
      header[0] = 0x81;
      header[1] = 127;
      header.writeBigUInt64BE(BigInt(data.length), 2);
    }
    this.socket.write(Buffer.concat([header, data]));
  }

  onData(chunk) {
    this.buffer = Buffer.concat([this.buffer, chunk]);
    while (this.buffer.length >= 2) {
      const first = this.buffer[0];
      const second = this.buffer[1];
      const opcode = first & 0x0f;
      const masked = Boolean(second & 0x80);
      let length = second & 0x7f;
      let offset = 2;
      if (length === 126) {
        if (this.buffer.length < 4) return;
        length = this.buffer.readUInt16BE(2);
        offset = 4;
      } else if (length === 127) {
        if (this.buffer.length < 10) return;
        const n = this.buffer.readBigUInt64BE(2);
        if (n > BigInt(1024 * 1024)) return this.close();
        length = Number(n);
        offset = 10;
      }
      if (!masked || length > 64 * 1024) return this.close();
      const maskBytes = 4;
      if (this.buffer.length < offset + maskBytes + length) return;
      let payload = this.buffer.subarray(offset + maskBytes, offset + maskBytes + length);
      if (masked) {
        const mask = this.buffer.subarray(offset, offset + 4);
        const decoded = Buffer.alloc(length);
        for (let i = 0; i < length; i++) decoded[i] = payload[i] ^ mask[i % 4];
        payload = decoded;
      }
      this.buffer = this.buffer.subarray(offset + maskBytes + length);
      if (opcode === 0x8) return this.close();
      if (opcode === 0x9) {
        this.socket.write(Buffer.concat([Buffer.from([0x8a, payload.length]), payload]));
        continue;
      }
      if (opcode !== 0x1) continue;
      try {
        const message = JSON.parse(payload.toString('utf8'));
        handleMessage(this, message);
      } catch {
        this.send({ type: 'error', message: 'Geçersiz mesaj.' });
      }
    }
  }

  close() {
    if (this.closed) return;
    this.closed = true;
    try { this.socket.end(Buffer.from([0x88, 0x00])); } catch {}
    this.onClose();
  }

  onClose() {
    if (this.closed && !this.roomCode) return;
    this.closed = true;
    disconnectPlayer(this);
  }
}

function createPlayer(conn, name, cosmetics) {
  return {
    id: `p${nextPlayerId++}`,
    conn,
    token: crypto.randomBytes(24).toString('base64url'),
    connected: true,
    disconnectedAt: 0,
    lastMoveAt: Date.now(),
    name: cleanName(name),
    cosmetics: cleanCosmetics(cosmetics),
    x: 0,
    y: 0,
    z: 9,
    yaw: 0,
    anim: 'idle',
    alive: true,
    role: 'crew',
    contributed: new Set(),
    killReadyAt: 0,
    sabotageReadyAt: 0,
    meetingReadyAt: 0,
    vote: null,
    classification: null
  };
}

function publicPlayer(player, room) {
  const renamed = room.game?.sabotage?.type === 'rename' && room.game.sabotage.until > Date.now();
  return {
    id: player.id,
    name: renamed ? room.game.sabotage.names[player.id] || player.name : player.name,
    cosmetics: player.cosmetics,
    x: player.x,
    y: player.y,
    z: player.z,
    yaw: player.yaw,
    anim: player.anim,
    alive: player.alive,
    host: player.id === room.hostId,
    contributed: player.contributed.has(room.game?.universeIndex),
    connected: player.connected
  };
}

function createRoom(conn, payload) {
  if (conn.roomCode) removePlayer(conn);
  const code = randomCode();
  const player = createPlayer(conn, payload.name, payload.cosmetics);
  conn.playerId = player.id;
  conn.roomCode = code;
  const room = {
    code,
    hostId: player.id,
    players: new Map([[player.id, player]]),
    game: null,
    createdAt: Date.now()
  };
  rooms.set(code, room);
  conn.send({ type: 'joined', id: player.id, code, host: true, token: player.token });
  broadcastRoom(room);
}

function joinRoom(conn, payload) {
  if (conn.roomCode) removePlayer(conn);
  const code = String(payload.code || '').toUpperCase().trim();
  const room = rooms.get(code);
  if (!room) return conn.send({ type: 'error', message: 'Oda bulunamadı.' });
  if (room.players.size >= 10) return conn.send({ type: 'error', message: 'Oda dolu.' });
  if (room.game?.started && !room.game.ended) return conn.send({ type: 'error', message: 'Maç başlamış durumda.' });
  const player = createPlayer(conn, payload.name, payload.cosmetics);
  conn.playerId = player.id;
  conn.roomCode = code;
  room.players.set(player.id, player);
  conn.send({ type: 'joined', id: player.id, code, host: false, token: player.token });
  broadcast(room, { type: 'event', level: 'info', message: `${player.name} trene bindi.` });
  broadcastRoom(room);
}

function chooseHost(room) {
  const connected = [...room.players.values()].find((p) => p.connected);
  room.hostId = connected?.id || room.players.keys().next().value || null;
}

function removePlayer(connOrPlayer) {
  const code = connOrPlayer.roomCode || connOrPlayer.room?.code;
  const playerId = connOrPlayer.playerId || connOrPlayer.id;
  if (!code || !playerId) return;
  const room = rooms.get(code);
  if (!room) return;
  const player = room.players.get(playerId);
  room.players.delete(playerId);
  if (connOrPlayer.roomCode) connOrPlayer.roomCode = null;
  if (player?.conn) { player.conn.roomCode = null; player.conn.playerId = null; }
  if (player) broadcast(room, { type: 'event', level: 'warn', message: `${player.name} trenden ayrıldı.` });
  if (!room.players.size) { rooms.delete(code); return; }
  if (room.hostId === playerId) chooseHost(room);
  broadcastRoom(room);
  rebalanceTaskRequirements(room, 'Bir yolcu trenden ayrıldı.');
  maybeTransition(room);
  checkWin(room);
}

function disconnectPlayer(conn) {
  const code = conn.roomCode;
  if (!code) return;
  const room = rooms.get(code);
  const player = room?.players.get(conn.playerId);
  conn.roomCode = null;
  if (!room || !player || player.conn !== conn) return;
  player.connected = false;
  player.disconnectedAt = Date.now();
  player.conn = null;
  if (room.hostId === player.id && [...room.players.values()].some((p) => p.connected)) chooseHost(room);
  broadcast(room, { type: 'event', level: 'warn', message: `${player.name} bağlantısını kaybetti; ${Math.ceil(RECONNECT_GRACE_MS / 1000)} saniye içinde dönebilir.` });
  broadcastRoom(room);
  rebalanceTaskRequirements(room, 'Bir yolcunun bağlantısı kesildi.');
  maybeTransition(room);
}

function resumeRoom(conn, payload) {
  if (conn.roomCode) removePlayer(conn);
  const code = String(payload.code || '').toUpperCase().trim();
  const token = String(payload.token || '');
  const room = rooms.get(code);
  const player = room && [...room.players.values()].find((p) => p.token === token);
  if (!room || !player || (player.disconnectedAt && Date.now() - player.disconnectedAt > RECONNECT_GRACE_MS)) {
    return conn.send({ type: 'error', code: 'resume_failed', message: 'Önceki multiplayer oturumu geri yüklenemedi. Oda koduyla yeniden katıl.' });
  }
  if (player.connected && player.conn && player.conn !== conn) { const previous = player.conn; previous.roomCode = null; previous.playerId = null; previous.close(); }
  player.conn = conn;
  player.connected = true;
  player.disconnectedAt = 0;
  conn.playerId = player.id;
  conn.roomCode = room.code;
  if (!room.hostId || !room.players.get(room.hostId)?.connected) room.hostId = player.id;
  conn.send({ type: 'joined', id: player.id, code: room.code, host: room.hostId === player.id, token: player.token, resumed: true });
  if (room.game?.started && !room.game.ended) {
    conn.send({
      type: 'resumeGame', role: player.role, universeIndex: room.game.universeIndex, universe: UNIVERSES[room.game.universeIndex].name,
      rule: room.game.rule, endsAt: room.game.endsAt, tasks: serializeTasks(room.game.tasks), deadNpcs: [...room.game.deadNpcs],
      sabotage: room.game.sabotage ? { type: room.game.sabotage.type, until: room.game.sabotage.until } : null,
      self: publicPlayer(player, room)
    });
  }
  broadcast(room, { type: 'event', level: 'success', message: `${player.name} zaman trenine yeniden bağlandı.` });
  broadcastRoom(room);
}

function broadcast(room, payload) {
  for (const player of room.players.values()) if (player.connected && player.conn) player.conn.send(payload);
}

function broadcastRoom(room) {
  broadcast(room, {
    type: 'room',
    code: room.code,
    hostId: room.hostId,
    players: [...room.players.values()].map((p) => publicPlayer(p, room)),
    started: Boolean(room.game?.started && !room.game?.ended)
  });
}

function rebalanceTaskRequirements(room, reason = 'Aktif oyuncu sayısı değişti.') {
  const game = room.game;
  if (!game?.started || game.ended) return false;
  const activeCount = Math.max(1, [...room.players.values()].filter((p) => p.alive && p.connected).length);
  const definitions = new Map(UNIVERSES[game.universeIndex].tasks.map(([id, _name, _kind, base]) => [id, base]));
  let changed = false;
  for (const task of game.tasks) {
    const required = Math.max(1, Math.min(definitions.get(task.id) || task.required, activeCount));
    if (task.required !== required) { task.required = required; changed = true; }
    if (!task.complete && task.contributors.size >= task.required) { task.complete = true; changed = true; }
  }
  if (changed) {
    broadcast(room, {
      type: 'taskUpdate', universeIndex: game.universeIndex, tasks: serializeTasks(game.tasks),
      contributed: [...room.players.values()].filter((p) => p.contributed.has(game.universeIndex)).map((p) => p.id),
      message: `${reason} Ortak görev gereksinimleri yeniden ölçeklendi.`
    });
  }
  return changed;
}

function createUniverseState(room, index) {
  const humanCount = Math.max(1, [...room.players.values()].filter((p) => p.alive && p.connected).length);
  const source = UNIVERSES[index];
  const tasks = source.tasks.map(([id, name, kind, base], order) => ({
    id,
    name,
    kind,
    order,
    required: Math.max(1, Math.min(base, humanCount)),
    contributors: new Set(),
    contributorTimes: new Map(),
    complete: false
  }));
  for (const p of room.players.values()) p.contributed.delete(index);
  return tasks;
}

function startGame(conn) {
  const room = rooms.get(conn.roomCode);
  if (!room || room.hostId !== conn.playerId) return;
  if (room.game?.started && !room.game.ended) return;
  for (const player of [...room.players.values()]) if (!player.connected) room.players.delete(player.id);
  if (!room.players.has(room.hostId)) chooseHost(room);
  const players = [...room.players.values()].filter((p) => p.connected);
  if (!players.length) return;
  players.forEach((p, index) => {
    p.alive = true;
    p.connected = true;
    p.role = 'crew';
    p.x = (index % 5 - 2) * 1.35;
    p.y = 0;
    p.z = 7.7 + Math.floor(index / 5) * 1.05;
    p.contributed.clear();
    p.vote = null;
    p.classification = null;
    p.lastMoveAt = Date.now();
  });
  const shuffled = [...players].sort(() => Math.random() - 0.5);
  const parasiteCount = players.length >= 8 ? 2 : 1;
  shuffled.slice(0, Math.min(parasiteCount, Math.max(1, players.length - 1 || 1))).forEach((p) => p.role = 'parasite');
  if (players.length === 1) players[0].role = 'crew';
  const now = Date.now();
  room.game = {
    started: true,
    ended: false,
    winner: null,
    universeIndex: 0,
    rule: WORLD_RULES[Math.floor(Math.random() * WORLD_RULES.length)],
    tasks: [],
    startedAt: now,
    endsAt: now + 10 * 60 * 1000,
    transitionAt: 0,
    sabotage: null,
    meeting: null,
    corpses: [],
    deadNpcs: new Set(),
    nextMeetingAllowedAt: now + 15000
  };
  room.game.tasks = createUniverseState(room, 0);
  for (const p of players) {
    p.conn.send({
      type: 'gameStart',
      role: p.role,
      universeIndex: 0,
      universe: UNIVERSES[0].name,
      rule: room.game.rule,
      endsAt: room.game.endsAt,
      tasks: serializeTasks(room.game.tasks),
      npcNames: NPC_NAMES,
      self: publicPlayer(p, room)
    });
  }
  broadcast(room, { type: 'event', level: 'success', message: 'Zaman treni hareket etti. İlk durak açıldı.' });
  broadcastRoom(room);
}

function serializeTasks(tasks) {
  return tasks.map((t) => ({
    id: t.id,
    name: t.name,
    kind: t.kind,
    order: t.order,
    required: t.required,
    progress: t.contributors.size,
    complete: t.complete
  }));
}

function completeTask(conn, payload) {
  const room = rooms.get(conn.roomCode);
  const game = room?.game;
  const player = room?.players.get(conn.playerId);
  if (!game?.started || game.ended || game.meeting || !player?.alive || !player.connected) return;
  const task = game.tasks.find((t) => t.id === payload.taskId);
  if (!task) return;
  const alreadyContributed = player.contributed.has(game.universeIndex);
  if (task.complete && alreadyContributed) return;
  const now = Date.now();
  let message;
  if (task.complete) {
    player.contributed.add(game.universeIndex);
    message = `${player.name}, tamamlanmış ${task.name} sistemine son kontrol katkısı verdi.`;
  } else {
    if (task.kind === 'sync') {
      for (const [id, at] of task.contributorTimes) if (now - at > 8000) task.contributorTimes.delete(id);
      task.contributorTimes.set(player.id, now);
      task.contributors = new Set(task.contributorTimes.keys());
    } else {
      task.contributors.add(player.id);
    }
    player.contributed.add(game.universeIndex);
    if (task.contributors.size >= task.required) task.complete = true;
    message = task.complete ? `${task.name} tamamlandı.` : `${task.name}: ${task.contributors.size}/${task.required} farklı oyuncu katkı verdi.`;
  }
  broadcast(room, {
    type: 'taskUpdate', universeIndex: game.universeIndex, tasks: serializeTasks(game.tasks),
    contributed: [...room.players.values()].filter((p) => p.contributed.has(game.universeIndex)).map((p) => p.id), message
  });
  maybeTransition(room);
}

function maybeTransition(room) {
  const game = room.game;
  if (!game || game.transitionAt || game.ended) return;
  const alivePlayers = [...room.players.values()].filter((p) => p.alive && p.connected);
  const tasksDone = game.tasks.every((t) => t.complete);
  const everyoneContributed = alivePlayers.every((p) => p.contributed.has(game.universeIndex));
  if (!tasksDone || !everyoneContributed) return;
  game.transitionAt = Date.now() + 3500;
  broadcast(room, {
    type: 'event',
    level: 'success',
    message: game.universeIndex === 9 ? 'Zaman çekirdeği sabitlendi!' : 'Herkes görevini tamamladı. Evren kapısı açılıyor…'
  });
}

function advanceUniverse(room) {
  const game = room.game;
  if (!game || game.ended) return;
  if (game.universeIndex >= UNIVERSES.length - 1) {
    endGame(room, 'crew', 'Tren son evrene ulaştı. Zaman çizgisi kurtarıldı.');
    return;
  }
  game.universeIndex += 1;
  game.rule = game.universeIndex === 9 ? 'all' : WORLD_RULES[Math.floor(Math.random() * WORLD_RULES.length)];
  game.tasks = createUniverseState(room, game.universeIndex);
  game.transitionAt = 0;
  game.sabotage = null;
  game.meeting = null;
  [...room.players.values()].filter((p) => p.alive && p.connected).forEach((p, index) => {
    p.x = (index % 5 - 2) * 1.35;
    p.y = 0;
    p.z = 7.7 + Math.floor(index / 5) * 1.05;
    p.lastMoveAt = Date.now();
  });
  broadcast(room, {
    type: 'universe',
    universeIndex: game.universeIndex,
    universe: UNIVERSES[game.universeIndex].name,
    rule: game.rule,
    tasks: serializeTasks(game.tasks),
    endsAt: game.endsAt
  });
}


function wrongRoute(conn) {
  const room = rooms.get(conn.roomCode);
  const game = room?.game;
  const player = room?.players.get(conn.playerId);
  if (!game?.started || game.ended || game.meeting || !player?.alive || game.universeIndex !== 0) return;
  const choices = [1,2,3,4,5,6,7,8];
  game.universeIndex = choices[Math.floor(Math.random() * choices.length)];
  game.rule = WORLD_RULES[Math.floor(Math.random() * WORLD_RULES.length)];
  game.tasks = createUniverseState(room, game.universeIndex);
  game.transitionAt = 0;
  game.sabotage = null;
  [...room.players.values()].filter((p) => p.alive && p.connected).forEach((p,index) => { p.x=(index%5-2)*1.35;p.y=0;p.z=7.7+Math.floor(index/5)*1.05;p.lastMoveAt=Date.now(); });
  broadcast(room, {
    type: 'universe', universeIndex: game.universeIndex, universe: UNIVERSES[game.universeIndex].name,
    rule: game.rule, tasks: serializeTasks(game.tasks), endsAt: game.endsAt, wrongRoute: true
  });
  broadcast(room, { type:'event', level:'danger', message:'Ray frekansı yanlış ayarlandı! Tren beklenmeyen bir evrene saptı.' });
}

function updateMovement(conn, payload) {
  const room = rooms.get(conn.roomCode);
  const player = room?.players.get(conn.playerId);
  if (!room?.game?.started || !player || !player.alive || !player.connected || room.game.meeting) return;
  const clamp = (n, min, max) => Math.max(min, Math.min(max, Number(n) || 0));
  const now = Date.now(), dt = Math.max(.05, Math.min(.5, (now - player.lastMoveAt) / 1000));
  const next = { x: clamp(payload.x, -29, 29), y: clamp(payload.y, -2, 12), z: clamp(payload.z, -29, 29) };
  const horizontal = Math.hypot(next.x - player.x, next.z - player.z), maxStep = 9.5 * dt + .7;
  if (horizontal > maxStep) { const ratio = maxStep / horizontal; next.x = player.x + (next.x - player.x) * ratio; next.z = player.z + (next.z - player.z) * ratio; }
  player.x = next.x; player.y = next.y; player.z = next.z; player.lastMoveAt = now;
  player.yaw = Number(payload.yaw) || 0;
  player.anim = ['idle','walk','run','jump','dead'].includes(payload.anim) ? payload.anim : 'idle';
}

function sabotage(conn, payload) {
  const room = rooms.get(conn.roomCode);
  const game = room?.game;
  const player = room?.players.get(conn.playerId);
  const now = Date.now();
  if (!game?.started || game.ended || game.meeting || player?.role !== 'parasite' || !player.alive) return;
  if (now < player.sabotageReadyAt || (game.sabotage && game.sabotage.until > now)) return;
  const allowed = ['reverse','doors','blackout','rename'];
  const type = allowed.includes(payload.sabotage) ? payload.sabotage : null;
  if (!type) return;
  const durations = { reverse: 25000, doors: 20000, blackout: 22000, rename: 30000 };
  const names = {};
  if (type === 'rename') {
    const shuffled = [...NPC_NAMES].sort(() => Math.random() - 0.5);
    [...room.players.values()].forEach((p, i) => names[p.id] = shuffled[i % shuffled.length]);
  }
  game.sabotage = { type, until: now + durations[type], names };
  player.sabotageReadyAt = now + 42000;
  broadcast(room, {
    type: 'sabotage',
    sabotage: type,
    until: game.sabotage.until,
    message: {
      reverse: 'Görev protokolleri tersine çevrildi!',
      doors: 'Vagon kapıları kilitlendi!',
      blackout: 'Haritanın bir kısmı karardı!',
      rename: 'Yolcu kimlikleri bozuldu!'
    }[type]
  });
}

function attack(conn, payload) {
  const room = rooms.get(conn.roomCode);
  const game = room?.game;
  const player = room?.players.get(conn.playerId);
  const now = Date.now();
  if (!game?.started || game.ended || game.meeting || player?.role !== 'parasite' || !player.alive || now < player.killReadyAt) return;
  if (payload.targetType === 'player') {
    const target = room.players.get(String(payload.targetId));
    if (!target || !target.connected || !target.alive || target.id === player.id || target.role === 'parasite') return;
    const distance = Math.hypot(target.x - player.x, target.y - player.y, target.z - player.z);
    if (distance > 2.8) return;
    target.alive = false;
    target.anim = 'dead';
    game.corpses.push({ id: `corpse-${Date.now()}`, kind: 'player', targetId: target.id, name: target.name, x: target.x, y: target.y, z: target.z, reported: false });
    player.killReadyAt = now + 32000;
    target.conn?.send({ type: 'eliminated', reason: 'Bir Parazit tarafından zaman çizgisinden silindin.' });
    broadcast(room, { type: 'event', level: 'danger', message: 'Bir yolcunun zaman izi kayboldu.' });
    rebalanceTaskRequirements(room, 'Aktif mürettebat sayısı değişti.');
    maybeTransition(room);
  } else if (payload.targetType === 'npc') {
    const npcId = Math.max(0, Math.min(29, Number(payload.targetId)));
    if (game.deadNpcs.has(npcId)) return;
    game.deadNpcs.add(npcId);
    const pos = payload.position || {};
    game.corpses.push({ id: `corpse-${Date.now()}`, kind: 'npc', targetId: `npc:${npcId}`, name: NPC_NAMES[npcId], x: Number(pos.x)||0, y: Number(pos.y)||0, z: Number(pos.z)||0, reported: false });
    player.killReadyAt = now + 24000;
    broadcast(room, { type: 'npcDeath', npcId });
    broadcast(room, { type: 'event', level: 'danger', message: 'Bir yolcunun zaman izi kayboldu.' });
  }
  checkWin(room);
}

function callMeeting(conn) {
  const room = rooms.get(conn.roomCode);
  const game = room?.game;
  const caller = room?.players.get(conn.playerId);
  const now = Date.now();
  if (!game?.started || game.ended || game.meeting || !caller?.alive || now < game.nextMeetingAllowedAt) return;
  const corpse = [...game.corpses].reverse().find((c) => !c.reported);
  if (!corpse && now < caller.meetingReadyAt) return;
  if (corpse) corpse.reported = true;
  caller.meetingReadyAt = now + 90000;
  game.nextMeetingAllowedAt = now + 45000;
  for (const p of room.players.values()) {
    p.vote = null;
    p.classification = null;
  }
  const decoys = [...Array(8)].map((_, i) => ({ id: `npc:${(i * 3 + game.universeIndex) % 30}`, name: NPC_NAMES[(i * 3 + game.universeIndex) % 30], npc: true }));
  const candidates = [
    ...[...room.players.values()].filter((p) => p.alive && p.connected).map((p) => ({ id: p.id, name: p.name, npc: false })),
    ...decoys
  ].sort(() => Math.random() - 0.5);
  game.meeting = {
    startedAt: now,
    classifyEndsAt: now + 8000,
    endsAt: now + 26000,
    corpse: corpse || { kind: 'unknown', name: 'Bilinmeyen zaman izi' },
    candidates
  };
  broadcast(room, {
    type: 'meetingStart',
    caller: caller.name,
    casualty: corpse?.name || 'Bilinmeyen yolcu',
    classifyEndsAt: game.meeting.classifyEndsAt,
    endsAt: game.meeting.endsAt,
    candidates
  });
}

function classifyCorpse(conn, payload) {
  const room = rooms.get(conn.roomCode);
  const player = room?.players.get(conn.playerId);
  const meeting = room?.game?.meeting;
  if (!meeting || !player?.alive || player.classification) return;
  const guess = payload.guess === 'npc' ? 'npc' : 'player';
  player.classification = guess;
  const correct = meeting.corpse.kind === 'unknown' ? false : guess === meeting.corpse.kind;
  player.conn.send({ type: 'classificationResult', correct, actual: meeting.corpse.kind });
}

function vote(conn, payload) {
  const room = rooms.get(conn.roomCode);
  const player = room?.players.get(conn.playerId);
  const meeting = room?.game?.meeting;
  if (!meeting || !player?.alive || player.vote) return;
  const id = String(payload.targetId || 'skip');
  if (id !== 'skip' && !meeting.candidates.some((c) => c.id === id)) return;
  player.vote = id;
  broadcast(room, { type: 'voteProgress', voted: [...room.players.values()].filter((p) => p.alive && p.connected && p.vote).length, total: [...room.players.values()].filter((p) => p.alive && p.connected).length });
}

function resolveMeeting(room) {
  const game = room.game;
  const meeting = game?.meeting;
  if (!meeting) return;
  const counts = new Map();
  for (const p of room.players.values()) {
    if (!p.alive || !p.vote || p.vote === 'skip') continue;
    counts.set(p.vote, (counts.get(p.vote) || 0) + 1);
  }
  let best = null;
  let bestVotes = 0;
  let tie = false;
  for (const [id, count] of counts) {
    if (count > bestVotes) { best = id; bestVotes = count; tie = false; }
    else if (count === bestVotes) tie = true;
  }
  let result = 'Çoğunluk oluşmadı. Kimse tahliye edilmedi.';
  if (best && !tie) {
    if (best.startsWith('npc:')) {
      const npcId = Number(best.split(':')[1]);
      game.deadNpcs.add(npcId);
      result = `${NPC_NAMES[npcId]} tahliye edildi. O yalnızca bir NPC yolcuydu.`;
      broadcast(room, { type: 'npcDeath', npcId });
    } else {
      const target = room.players.get(best);
      if (target?.alive) {
        target.alive = false;
        target.anim = 'dead';
        result = `${target.name} zaman treninden tahliye edildi.`;
        target.conn?.send({ type: 'eliminated', reason: 'Toplantı oylamasıyla tahliye edildin.' });
      }
    }
  }
  game.meeting = null;
  broadcast(room, { type: 'meetingEnd', result });
  rebalanceTaskRequirements(room, 'Toplantı sonrası aktif oyuncu sayısı değişti.');
  maybeTransition(room);
  checkWin(room);
}

function checkWin(room) {
  const game = room.game;
  if (!game?.started || game.ended) return;
  const alive = [...room.players.values()].filter((p) => p.alive);
  const parasites = alive.filter((p) => p.role === 'parasite').length;
  const crew = alive.filter((p) => p.role === 'crew').length;
  if (parasites === 0 && [...room.players.values()].some((p) => p.role === 'parasite')) {
    endGame(room, 'crew', 'Tüm Parazitler zaman treninden çıkarıldı.');
  } else if (parasites > 0 && parasites >= crew) {
    endGame(room, 'parasite', 'Parazitler mürettebatın kontrolünü ele geçirdi.');
  }
}

function endGame(room, winner, reason) {
  if (!room.game || room.game.ended) return;
  room.game.ended = true;
  room.game.winner = winner;
  broadcast(room, {
    type: 'gameOver',
    winner,
    reason,
    roles: [...room.players.values()].map((p) => ({ id: p.id, name: p.name, role: p.role }))
  });
  broadcastRoom(room);
}

function handleChat(conn, payload) {
  const room = rooms.get(conn.roomCode);
  const player = room?.players.get(conn.playerId);
  if (!room || !player) return;
  if (room.game?.rule === 'no_talk' || room.game?.rule === 'all') {
    return player.conn?.send({ type: 'event', level: 'warn', message: 'Bu evrende konuşmak yasak.' });
  }
  const message = String(payload.message || '').replace(/[<>]/g, '').trim().slice(0, 120);
  if (message) broadcast(room, { type: 'chat', from: player.name, message });
}

function handleMessage(conn, payload) {
  switch (payload.type) {
    case 'create': return createRoom(conn, payload);
    case 'join': return joinRoom(conn, payload);
    case 'resume': return resumeRoom(conn, payload);
    case 'start': return startGame(conn);
    case 'move': return updateMovement(conn, payload);
    case 'completeTask': return completeTask(conn, payload);
    case 'wrongRoute': return wrongRoute(conn);
    case 'sabotage': return sabotage(conn, payload);
    case 'attack': return attack(conn, payload);
    case 'meeting': return callMeeting(conn);
    case 'classify': return classifyCorpse(conn, payload);
    case 'vote': return vote(conn, payload);
    case 'chat': return handleChat(conn, payload);
    default: return conn.send({ type: 'error', message: 'Bilinmeyen komut.' });
  }
}

function tick() {
  const now = Date.now();
  for (const room of [...rooms.values()]) {
    for (const player of [...room.players.values()]) {
      if (!player.connected && player.disconnectedAt && now - player.disconnectedAt >= RECONNECT_GRACE_MS) {
        removePlayer({ id: player.id, room: { code: room.code } });
      }
    }
    if (!rooms.has(room.code)) continue;
    const game = room.game;
    if (!game?.started || game.ended) continue;
    if (now >= game.endsAt) {
      endGame(room, 'parasite', 'On dakika doldu; zaman çizgisi çöktü.');
      continue;
    }
    if (game.sabotage && now >= game.sabotage.until) {
      const old = game.sabotage.type;
      game.sabotage = null;
      broadcast(room, { type: 'sabotageEnd', sabotage: old });
    }
    if (game.meeting && now >= game.meeting.endsAt) resolveMeeting(room);
    if (game.transitionAt && now >= game.transitionAt) advanceUniverse(room);
    broadcast(room, {
      type: 'snapshot',
      now,
      universeIndex: game.universeIndex,
      rule: game.rule,
      endsAt: game.endsAt,
      transitionAt: game.transitionAt,
      sabotage: game.sabotage ? { type: game.sabotage.type, until: game.sabotage.until } : null,
      players: [...room.players.values()].map((p) => publicPlayer(p, room)),
      deadNpcs: [...game.deadNpcs]
    });
  }
}
setInterval(tick, 100).unref();

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function serveStatic(req, res) {
  const parsed = new URL(req.url, 'http://localhost');
  if (parsed.pathname === '/healthz' || parsed.pathname === '/api/status') {
    const body = JSON.stringify({ ok: true, version: VERSION, rooms: rooms.size, uptime: Math.round(process.uptime()) });
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }).end(body);
    return;
  }
  let requestPath = decodeURIComponent(parsed.pathname);
  if (requestPath === '/') requestPath = '/index.html';
  const filePath = path.normalize(path.join(PUBLIC_DIR, requestPath));
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403).end('Forbidden');
    return;
  }
  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Not found');
      return;
    }
    res.writeHead(200, {
      'Content-Type': mime[path.extname(filePath)] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'same-origin',
      'Cross-Origin-Resource-Policy': 'same-origin'
    });
    fs.createReadStream(filePath).pipe(res);
  });
}

export function createServer() {
  const server = http.createServer(serveStatic);
  server.on('upgrade', (req, socket) => {
    const requestUrl = new URL(req.url || '/', 'http://localhost');
    if (requestUrl.pathname !== '/ws') return socket.destroy();
    const origin = String(req.headers.origin || '');
    if (ALLOWED_ORIGINS.size && !ALLOWED_ORIGINS.has(origin)) return socket.destroy();
    const key = req.headers['sec-websocket-key'];
    if (!key) return socket.destroy();
    const accept = crypto.createHash('sha1').update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
    socket.write(
      'HTTP/1.1 101 Switching Protocols\r\n' +
      'Upgrade: websocket\r\n' +
      'Connection: Upgrade\r\n' +
      `Sec-WebSocket-Accept: ${accept}\r\n\r\n`
    );
    const conn = new WSConnection(socket);
    conn.send({ type: 'hello', version: VERSION, reconnectGraceMs: RECONNECT_GRACE_MS });
  });
  return server;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const server = createServer();
  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') console.error(`Port ${PORT} kullanımda. Başka bir port için: PORT=8090 node server.mjs`);
    else console.error(error);
    process.exitCode = 1;
  });
  server.listen(PORT, HOST, () => {
    console.log(`ChronoRail ${VERSION} hazır: http://localhost:${PORT}`);
    console.log('LAN oyuncuları bu bilgisayarın yerel IP adresini ve aynı portu kullanabilir.');
  });
}
