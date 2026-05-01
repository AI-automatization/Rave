# RAVE APP — ПОЛНЫЙ ТЕХНИЧЕСКИЙ АНАЛИЗ
## Reverse Engineering: v1.17.12 (macOS Universal)

> **Автор анализа:** Claude (Sonnet 4.6)
> **Дата:** 2026-05-01
> **Метод:** Извлечение ASAR архива → анализ обфусцированного JS/TS кода
> **Файл:** `Rave-1.17.12-universal (1).dmg` → `app-arm64.asar` (99 МБ)

---

## 1. СТЕК И АРХИТЕКТУРА ПРИЛОЖЕНИЯ

### Технологии
| Слой | Технология |
|------|-----------|
| Runtime | **Electron** (Chromium + Node.js) |
| UI Framework | **React** (renderer process) |
| Bundler | **Webpack** (minified + obfuscated) |
| Sync Protocol | **WebSocket** (кастомный сервер "Priapus") |
| Video Extraction | **ytdl-core** (только YouTube) |
| Video Playback | Chromium WebView / нативный player |
| Error Tracking | **Sentry** (sentry-dbid в каждом бандле) |
| Time Sync | **NTP** (pool.ntp.org + региональные) |
| P2P Network | **switchboard-js** (Rust/NAPI) |

### Структура ASAR архива
```
app-arm64.asar
├── dist/
│   ├── main.prod.js          (5.7 MB) — Electron main process
│   ├── vendor.prod.js        (21 MB)  — все npm зависимости
│   ├── renderer.prod.js      (2.4 MB) — React UI
│   ├── preload.js            (15 KB)  — IPC bridge (обфусцирован)
│   ├── switchboard.child.js           — P2P bandwidth process
│   ├── infatica.child.js              — Infatica SDK process
│   ├── honeygain.child.js             — HoneyGain SDK process
│   ├── pawns.child.js                 — Pawns SDK process
│   └── workers/
│       ├── BlackBarDetection.worker.js
│       ├── deepLearning.worker.js
│       └── AudioWorklet*.js
├── resources/
│   └── dlls/
│       ├── libInfatica.dylib  — нативная библиотека P2P
│       └── raveMain.node      — нативный Node addon
└── node_modules/
    └── switchboard-js/        — Rust скомпилированный NAPI модуль
```

---

## 2. СПИСОК ПОДДЕРЖИВАЕМЫХ ВИДЕО ПРОВАЙДЕРОВ

Каждый провайдер реализован как отдельный модуль с интерфейсом:
```typescript
interface VideoProvider {
  providerName: string
  connected: boolean       // требует авторизации
  priority: number
  publicRelease: boolean
  idParser: (url: string) => string | false
  standardizedSourceUrl: (url: string) => string
  sameSource?: (a: string, b: string) => boolean
}
```

### Полная таблица провайдеров

| Провайдер | connected | URL Regex / Паттерн | Метод воспроизведения |
|-----------|-----------|--------------------|-----------------------|
| **YouTube** | `false` | `/(youtube\.com\|youtu\.be\/)(?<id>[^"&?\/\s]{11})/i` | ytdl-core → DASH MPD |
| **YouTube Playlists** | `false` | `/\?[\w\-_&=]*list=([\w\-_]+)/` | ytdl-core |
| **Netflix** | `true` | `/.+netflix\.com\/watch\/(\d+)/` | WebView + cookie scrape |
| **Amazon Prime** | `true` | `/primevideo\.com\/watch\?gti=(.*?)/` | WebView + header inject |
| **Disney+** | `true` | `/disneyplus\.com\/.+\/(play\|video)\/([\d\w\-]*)/` | WebView + cookie |
| **HBO Max** | `false` | `/play\.hbomax\.com\/video\/watch\/(.*)/` | WebView |
| **Twitch** | `false` | `/twitch\.tv\/(?:videos\/(\d+)\|([^/?#]+))/` | WebView + cookie inject |
| **Vimeo** | `false` | WebView generic | WebView |
| **Pluto TV** | `false` | `/pluto\.tv\/.*on-demand\/movies\/([a-zA-Z0-9]+)/` | WebView |
| **Tubi** | `true` | `/tubitv\.com\/(?:video\|movies\|tv-shows)\/([0-9]+)/` | WebView |
| **Crunchyroll** | `false` | `/crunchyroll\.com\/.*\/watch\/([A-Z0-9]+)/i` | WebView |
| **VK** | `true` | OAuth login flow | WebView |
| **X (Twitter)** | `false` | `/(x\|twitter)\.com\/.*\/status\/(\d+)/` | WebView |
| **Google Drive** | `true` | `/drive\.google\.com\/open\?id=([\w\d-]*)/` | WebView |
| **Rave DJ** | `false` | `/rave\.dj\/([\w\d_-]{14})$/` | Custom |
| **Web (universal)** | `false` | Любой URL | WebView |

---

## 3. КАК RAVE ИЗВЛЕКАЕТ ВИДЕО

### 3.1 YouTube — единственный с реальным извлечением

Rave использует `ytdl-core` для получения метаданных и stream URL.

**IPC Channel:** `getYTCoreVideoInfo` (в preload зашифрован как `"S"`)

```javascript
// main.prod.js — module 5188042
ipcMain.handle("getYTCoreVideoInfo", async (event, { id }) => {
  return await retry(async (attempt) => {
    return new Promise((resolve, reject) => {
      ytdl.getInfo(id).then(info => {
        if (!info.player_response.streamingData) {
          throw new Error("YT CORE NO DASH MANIFEST FOUND")
        }

        // Генерируем DASH MPD из adaptive formats
        const mpd = generate_dash_file_from_formats(
          info.player_response.streamingData.adaptiveFormats,
          info.videoDetails.lengthSeconds
        )

        // Собираем related videos
        const recommendations = info.related_videos
          .filter(v => !v.isLive)
          .map(v => ({
            author: v.author.name,
            durationPT: toPTFormat(v.length_seconds),
            highResImgSrc: v.thumbnails[v.thumbnails.length - 1].url,
            title: v.title,
            url: `https://www.youtube.com/watch?v=${v.id}`,
            videoProvider: "youtube"
          }))

        resolve({
          mpd,                            // DASH manifest для player
          author: info.videoDetails.author.name,
          channelThumbnail: info.videoDetails.author.thumbnails.slice(-1)[0].url,
          durationPT: toPTFormat(info.videoDetails.lengthSeconds),
          id,
          isLive: info.videoDetails.isLiveContent,
          maxRes: thumbnails.slice(-1)[0].url,
          recommendationArray: recommendations,
          title: info.videoDetails.title,
          url: info.videoDetails.video_url,
        })
      }).catch(reject)
    })
  }, {
    retries: 2,
    factor: 2,
    minTimeout: 2500,
    maxTimeout: 10000
  })
})
```

**HLS/DASH обработка:**
```javascript
// Если видео HLS или DASH MPD
if (format.isHLS || format.isDashMPD) {
  stream = m3u8stream(format.url, {
    chunkReadahead: +info.live_chunk_readahead,
    begin: options.begin || (format.isLive ? Date.now() : undefined),
    liveBuffer: options.liveBuffer,
    parser: format.isDashMPD ? "dash-mpd" : "m3u8",
    id: format.itag
  })
}
```

**Decipher (расшифровка подписи):**
```javascript
// Для защищённых форматов — extract JS functions из player
decipherFormats(formats, html5player, options) {
  const tokens = await getTokens(html5player, options)
  formats.forEach(format => {
    let cipher = format.signatureCipher || format.cipher
    if (cipher) {
      Object.assign(format, querystring.parse(cipher))
      delete format.signatureCipher
      delete format.cipher
    }
    const sig = tokens && format.s ? decipher(tokens, format.s) : null
    setDownloadURL(format, sig)
  })
}
```

---

### 3.2 Netflix — Cookie Scraping

**Шаг 1: Получить cookies**
```javascript
// module 67772
ipcMain.addListener("netflix_get_cookies", async (event) => {
  try {
    const cookies = await session.defaultSession.cookies.get({
      domain: ".netflix.com"
    })
    event.sender.send("netflix_get_cookies_response", { cookies })
  } catch (e) {
    event.sender.send("netflix_get_cookies_response", { error: e })
  }
})
```

**Шаг 2: Загрузить страницу в скрытом окне и извлечь localStorage**
```javascript
ipcMain.handle("scrape-renderer-storage", async (event, target) => {
  let result
  const win = new BrowserWindow({
    show: false,
    webPreferences: { nodeIntegration: false }
  })

  // Ждём DOMContentLoaded
  await new Promise(resolve => {
    win.webContents.addListener("dom-ready", resolve)
    win.loadURL(target.url)
  })

  // Выполняем JS в контексте страницы
  result = target.executeScript
    ? await win.webContents.executeJavaScript(target.executeScript)
    : await win.webContents.executeJavaScript(`
        function getLocalStorage() {
          return Promise.resolve({
            localStorage: window.localStorage
              ? JSON.parse(JSON.stringify(window.localStorage))
              : undefined,
            sessionStorage: window.sessionStorage
              ? JSON.parse(JSON.stringify(window.sessionStorage))
              : undefined,
            cookie: document.cookie
              ? parseCookieString(document.cookie)
              : undefined,
            server_path: window.server_path
          })
        }
        getLocalStorage()
      `)

  win.close()
  return result
})
```

**Шаг 3:** Renderer передаёт полученные cookies в WebView → WebView грузит `netflix.com/watch/<id>` с авторизацией → нативный видео плеер браузера воспроизводит.

---

### 3.3 Amazon Prime — Header Injection

```javascript
// X-Rave-Credentials header inject
const interceptor = {
  urlList: [
    "https://*.primevideo.com/*",
    "https://*.amazon.com/*",
    "https://*.amazon.co.jp/*",
    "https://*.amazon.de/*",
    "https://*.amazon.co.uk/*"
  ],
  urlRegexList: [/\.primevideo\.com\//, /\.amazon(?:\.\w{2,3}){1,2}\//],
  func: async (request) => {
    if (request.url.includes("detail/")) {
      const credentials = request.requestHeaders["X-Rave-Credentials"]
        ?? request.requestHeaders["x-rave-credentials"]
      if (credentials === "omit") {
        // ... специальная обработка
      }
    }
    return { cancel: false, requestHeaders: request.requestHeaders }
  }
}
```

---

### 3.4 Twitch — Cookie + Dark Mode Injection

```javascript
const twitchInterceptor = {
  urlList: ["https://*.www.twitch.tv/*"],
  urlRegexList: [/\.www\.twitch\.tv\//],
  func: async (request) => {
    const domain = ".twitch.tv"
    const cookies = await session.defaultSession.cookies.get({ domain })

    // Force dark mode
    const darkModeCookie = { name: "tachyon-prefers-color-scheme", value: "dark" }
    const existing = cookies.find(c => c.name === "tachyon-prefers-color-scheme")
    if (existing) existing.value = "dark"
    else cookies.push(darkModeCookie)

    request.requestHeaders.Cookie = cookies
      .map(c => `${c.name}=${c.value}`)
      .join("; ")

    return { cancel: false, requestHeaders: request.requestHeaders }
  }
}
```

---

### 3.5 VK — OAuth Flow

```javascript
class VKAuth {
  constructor() {
    this.options = {
      client_id: process.env.VK_CLIENT_ID,
      scope: "email photos offline",
      redirect_uri: "https://oauth.vk.com/blank.html",
      response_type: "token",
      display: "popup",
      revoke: "1"
    }
  }

  handleUrl(url) {
    return new Promise(async (resolve, reject) => {
      const error = /\?error=(.+)$/.exec(url)
      if (error) return reject(new Error(`handleUrl failed: ${error}`))

      const tokenMatch = /access_token=([^&]*)/.exec(url)
      this.access_token = tokenMatch?.[1]

      const userIdMatch = /user_id=([^&]*)/.exec(url)
      this.user_id = userIdMatch?.[1]

      if (this.user_id) {
        await this.getUserInfo()
        resolve({ access_token: this.access_token, user_id: this.user_id })
      }
    })
  }
}
```

---

## 4. СИНХРОНИЗАЦИЯ ВИДЕО — ДЕТАЛЬНЫЙ РАЗБОР

### Уровень 1: NTP Clock Correction

**Проблема:** У каждого пользователя системные часы могут отличаться на сотни миллисекунд. Если пользователь A отправляет `seek(42.5s)` в момент `Date.now() = 1000`, а у пользователя B `Date.now() = 1500` в тот же реальный момент — синхронизация будет неточной.

**Решение Rave:** NTP опрос для вычисления `clockOffset`.

```javascript
// main.prod.js — module 6814
class NTPSync {
  constructor(getMainWindow) {
    this.ntpAggregate = []          // последние 60 измерений
    this.cachedNtpDelta = 0.001     // секунды (не мс!)
    this.timeoutDuration = 4000     // опрос каждые 4 сек

    // NTP серверы — глобальное покрытие
    this.servers = [
      "0.pool.ntp.org", "1.pool.ntp.org",
      "2.pool.ntp.org", "3.pool.ntp.org",
      "0.uk.pool.ntp.org", "1.uk.pool.ntp.org",
      "0.US.pool.ntp.org", "1.US.pool.ntp.org",
      "asia.pool.ntp.org", "europe.pool.ntp.org",
      "north-america.pool.ntp.org", "south-america.pool.ntp.org",
      "africa.pool.ntp.org", "oceania.pool.ntp.org",
      "ntp1.vniiftri.ru", "ntp2.vniiftri.ru",
      "0.ru.pool.ntp.org", "1.ru.pool.ntp.org",
      "time.apple.com", "time.cloudflare.com", "time.google.com"
    ]
  }

  async getJSOffset() {
    // UDP запрос к NTP серверу
    const { offset } = await NTPClient.getInstance({
      servers: this.servers,
      sampleCount: 8,         // 8 замеров
      replyTimeout: 3000      // таймаут 3 сек
    }).getTime()

    return offset !== 0 ? offset * 0.001 : 0   // ms → seconds
  }

  cache(value) {
    this.ntpAggregate.push(value)
    if (this.ntpAggregate.length > 60) this.ntpAggregate.shift()

    // Скользящее среднее по 60 значениям — фильтрует выбросы
    this.cachedNtpDelta = Math.round(
      this.ntpAggregate.reduce((sum, v) => sum + v) / this.ntpAggregate.length
      * 10000
    ) / 10000
  }

  resetCache() {
    this.ntpAggregate = []
    this.cachedNtpDelta = 0.001
    this.getMainWindow()?.webContents.send("ntp-delta", this.cachedNtpDelta)
    return this.cachedNtpDelta
  }

  async poll(iteration = 1) {
    try {
      this.cache(await this.getJSOffset())
    } catch (e) {
      // Fallback к последнему известному значению
    }
    this.getMainWindow()?.webContents.send("ntp-delta", this.cachedNtpDelta)
    this.syncTimeout = setTimeout(this.poll, this.timeoutDuration)
  }

  startPollingTime() {
    clearTimeout(this.syncTimeout)
    this.syncTimeout = setTimeout(this.poll, this.timeoutDuration)
  }

  stopPollingTime() {
    clearTimeout(this.syncTimeout)
  }
}
```

**Поток данных:**
```
NTPSync (main process)
    │
    │── poll() каждые 4 сек ──> NTP сервер (UDP:123)
    │<── clock offset (секунды) ──────────────────
    │
    │── "ntp-delta" IPC ──> Renderer
                            ↓
                     window.ntpDelta = delta
                     trustedTime = Date.now() + ntpDelta * 1000
```

---

### Уровень 2: Priapus WebSocket Server

**Priapus** — это проприетарный WebSocket сервер Rave для комнат просмотра.

```javascript
// Interceptor добавляет auth к каждому WSS запросу
ipcMain.on("SET_PRIAPUS_INTERCEPTOR", (event, { priapusUrl, priapusToken }) => {
  const priapusHostname = new URL(priapusUrl).hostname

  const interceptor = {
    urlList: ["wss://*/*"],
    urlRegexList: [/wss:\/\//],
    func: async (request) => {
      const host = new URL(request.url).hostname
      if (host === priapusHostname) {
        request.requestHeaders.Authorization = `Bearer ${priapusToken}`
        request.requestHeaders["API-Version"] = "4"
        return { cancel: false, requestHeaders: request.requestHeaders }
      }
      return { cancel: false }
    }
  }

  WebRequestInterceptor.addInterceptor(interceptor)
})
```

**Параметры соединения:**
- URL: `wss://cdn01.godmademefunky.com` или `wss://cdn02.godmademefunky.com`
- Auth: `Authorization: Bearer <token>`
- API версия: `4`
- Каждая комната = отдельный WebSocket channel

---

### Уровень 3: IPC Events (Renderer ↔ Main ↔ WebSocket)

Из декодированного preload.js — карта событий:
```javascript
// module 61340 — обфусцированная карта IPC channels
const IPC_MAP = {
  "gh": "activate",
  "VJ": "holiday",
  "bb": "home_mounted",
  "TN": "main_error_crash",
  "mX": "handlemi",           // входящие WebSocket сообщения
  "P5": "notification_action_response",
  "du": "open_video",         // открыть видео в комнате
  "a9": "sync",               // событие синхронизации
  "mF": "reset_sync"          // сброс синхронизации
}
```

**Другие ключевые IPC каналы:**
```javascript
// Отправка → main process (send channels)
"SET_PRIAPUS_INTERCEPTOR"     // установить WSS auth
"youtube-timestamp-hash-ipc"  // timestamp hash для YouTube
"ntp-delta"                   // NTP offset из main → renderer
"jumpToTimeStamp"             // перемотка к метке
"reset-mesh-reducer"          // сброс state комнаты
"mesh-reset-complete"         // комната сброшена

// Запросы (invoke = async IPC)
"getYTCoreVideoInfo"          // YouTube метаданные + MPD
"netflix_get_cookies"         // Netflix cookie scrape
"scrape-domain-cookies"       // generic cookie для домена
"scrape-renderer-storage"     // localStorage + cookie страницы
"social-login"                // OAuth (Google/FB/VK/Apple)
"estimate-download-bps"       // измерение скорости
"estimate-upload-bps"         // измерение скорости upload
"SESSION_PROXY_METHOD"        // proxy control (setProxy)
```

---

### Уровень 4: Полная схема синхронизации

```
┌─────────────────────────────────────────────────────────────────────┐
│                        RAVE SYNC ARCHITECTURE                        │
└─────────────────────────────────────────────────────────────────────┘

  User A (Owner)              Priapus WSS Server         User B (Member)
  ┌──────────────┐            ┌─────────────┐            ┌──────────────┐
  │  Renderer    │            │             │            │  Renderer    │
  │  ─────────── │            │             │            │  ─────────── │
  │  ntpDelta=X  │            │             │            │  ntpDelta=Y  │
  │  trustedNow()│            │             │            │  trustedNow()│
  └──────┬───────┘            │             │            └──────┬───────┘
         │ user plays video   │             │                   │
         │ send("sync", {     │             │                   │
         │   action: "play",  │             │                   │
         │   position: 42.5,  │             │                   │
         │   sentAt: trustedNow(), ─────────>                   │
         │   roomId: "xxx"    │  broadcast  │ handlemi event ───>
         │ })                 │  ─────────> │                   │
         │                    │             │   {               │
         │                    │             │     action: "play",│
         │                    │             │     position: 42.5,│
         │                    │             │     sentAt: T      │
         │                    │             │   }               │
         │                    │             │                   │
         │                    │             │  drift = trustedNow() - sentAt
         │                    │             │  seekTo(position + drift)
         │                    │             │  video.play()     │
         │                    │             │                   │
```

**Формула компенсации задержки:**
```
// У получателя:
const drift = (Date.now() + ntpDelta) - message.sentAt
const correctedPosition = message.position + drift
video.currentTime = correctedPosition
```

---

### Уровень 5: Mesh Room Navigation

```javascript
// Навигация к комнате через Mesh ID
ipcMain.on("go-to-mesh", (event, meshId) => {
  const mainWindow = getMainWindow()
  const currentMesh = mainWindow?.webContents.getURL()?.slice(-36)

  if (currentMesh !== meshId) {
    // Сбросить state комнаты перед переходом
    meshWindow?.webContents.send("reset-mesh-reducer")

    ipcMain.once("mesh-reset-complete", () => {
      mainWindow?.loadURL(`file://${__dirname}/../app.html#/mesh/${meshId}`)
    })
  }
})
```

---

## 5. P2P СЛОЙ — SWITCHBOARD (НЕ СИНХРОНИЗАЦИЯ)

> **Важно:** Switchboard — это НЕ синхронизация видео. Это монетизация через bandwidth sharing.

### Что делает Switchboard:
Rave продаёт пропускную способность интернета пользователей через 4 SDK:
- **Infatica** (`libInfatica.dylib`) — P2P прокси
- **HoneyGain** — bandwidth marketplace
- **Pawns SDK** — P2P network
- **Repocket** — residential proxy

### Архитектура:
```javascript
// switchboard.child.js — отдельный дочерний процесс
class SwitchboardManager {
  async setSwitchboardBandwidth({ downloadBps, uploadBps, userId, deviceId }) {
    const apiUrl = isBlueEnv
      ? "https://cdn01.godmademefunky.com"
      : "https://cdn02.godmademefunky.com"

    // 1. Инициализировать client
    this.switchboardClient = new Client(
      apiUrl, wssUrl, userId, deviceId,
      authCallback,
      Platform.Desktop
    )

    // 2. Запустить relay (share bandwidth)
    this.currentRelay = await this.switchboardClient.startRelay(
      uploadMbps, downloadMbps, networkType  // Ethernet or WiFi
    )

    // 3. Запустить proxy
    this.currentProxy = await this.switchboardClient.startProxy(proxyOptions)
  }

  setUrl(url) {
    return this.currentProxy.setUrl(url)  // P2P proxy routing
  }

  getProxyPort() {
    return this.currentProxy.port()  // порт локального прокси
  }
}
```

### Environments:
```javascript
const BLUE_ENV_CDN = "https://cdn01.godmademefunky.com"  // blue
const RED_ENV_CDN  = "https://cdn02.godmademefunky.com"  // red (default)
```

---

## 6. ДОПОЛНИТЕЛЬНЫЕ МЕХАНИЗМЫ

### 6.1 YouTube Timestamp Hash
```javascript
// Для deep link к конкретному времени видео
IPC_CHANNELS["youtube-timestamp-hash-ipc"]
// Renderer → main → генерирует hash → URL с #t=42s
```

### 6.2 Google Drive Video Playback
```javascript
// Специальный header inject для Google Drive
ipcMain.on("set_google_drive_headers", (event, headers) => {
  // Устанавливает Authorization header для drive.google.com
})
```

### 6.3 HBO Max / MAX Headers
```javascript
ipcMain.on("set_hbo_main", (event, headers) => {
  // Специальные заголовки для Max стриминга
})
```

### 6.4 Translate Interceptor
```javascript
// Google Translate работает внутри Rave (субтитры?)
const translateInterceptor = {
  urlList: ["https://translate.google.com/*"],
  func: async (request) => {
    request.requestHeaders["Sec-Fetch-Site"] = "none"
    delete request.requestHeaders["Sec-Fetch-Site"]
    const cookies = await getCookies("translate.google.com")
    request.requestHeaders.Cookie = cookies.join("; ")
    return { cancel: false, requestHeaders: request.requestHeaders }
  }
}
```

### 6.5 Black Bar Detection (AI Worker)
```javascript
// workers/BlackBarDetection.worker.js
// workers/deepLearning.worker.js
// Определяет чёрные полосы letterbox для crop
// Использует WebWorker + возможно TensorFlow.js
```

### 6.6 Audio Processing Workers
```javascript
// workers/AudioInputProcessor.js
// workers/AudioOutputProcessor.js
// workers/AudioVolumeProcessor.js
// AudioWorklet для обработки микрофона (голосовой чат в комнате)
```

---

## 7. SECURITY & AUTH МОДЕЛИ

### JWT Auth (Priapus)
```
Authorization: Bearer <priapusToken>
API-Version: 4
```

### Session Management
```javascript
// Изоляция сессий через Electron partition
const session = electron.session.fromPartition("persist:rave")
// vs
const session = electron.session.defaultSession
```

### Cookie Domains (scoped per provider)
```
.netflix.com     → netflix_get_cookies
.twitch.tv       → twitch cookie inject
translate.google.com → translate cookies
.amazon.com / .primevideo.com → X-Rave-Credentials
```

---

## 8. ЧТО РЕАЛИЗОВАТЬ В НАШЕМ ПРОЕКТЕ (weWatch)

### 8.1 Уже есть / аналог готов
| Функция Rave | Наш статус |
|-------------|-----------|
| YouTube extraction (ytdl-core) | ✅ Реализован в `services/content` |
| WebSocket комнаты | ✅ Socket.io в `services/watch-party:3004` |
| Play/Pause/Seek sync | ✅ Базовые события реализованы |
| JWT Auth для WebSocket | ✅ Middleware в `shared/middleware` |
| Push уведомления (FCM) | ✅ `services/notification:3007` |

### 8.2 Чего не хватает — КРИТИЧНО

#### NTP Clock Correction
Rave polling NTP каждые 4 сек и передаёт `ntp-delta` в renderer.
Без этого sync будет неточным на 100-500ms у пользователей с разными часами.

**Что добавить в `services/watch-party`:**
```typescript
// Добавить в Socket.io sync payload
interface SyncPayload {
  action: 'play' | 'pause' | 'seek' | 'buffer'
  position: number        // секунды
  sentAt: number          // Date.now() — server timestamp
  roomId: string
}

// При получении события — компенсировать drift
const drift = (Date.now() - payload.sentAt) / 1000  // в секундах
const correctedPosition = payload.position + drift
```

**Что добавить в `apps/mobile` (useWatchParty.ts):**
```typescript
// При получении sync события
socket.on('sync', (payload: SyncPayload) => {
  const drift = (Date.now() - payload.sentAt) / 1000
  const corrected = payload.position + drift
  videoRef.current?.setPositionAsync(corrected * 1000)  // expo-av
})
```

#### Position Drift Correction
Rave добавляет `drift = trustedNow - sentAt` к позиции.
Наш проект должен делать то же самое.

#### Audio Chat в комнате
Rave использует AudioWorklet (Web Audio API) для голоса.
Мы пока не реализовали голосовой чат — можно добавить позже через WebRTC.

### 8.3 Что НЕ нужно копировать
| Функция | Причина |
|---------|---------|
| Switchboard P2P bandwidth | Монетизация через продажу трафика — не наш case |
| Netflix/Disney/Amazon WebView | Требует авторизации на платных платформах |
| Black bar detection AI | Опциональный UI-фич, низкий приоритет |
| Google Drive player | Нишевое использование |

---

## 9. ИТОГОВАЯ АРХИТЕКТУРНАЯ СХЕМА RAVE

```
┌────────────────────────────────────────────────────────┐
│                    RAVE ELECTRON APP                    │
│                                                        │
│  ┌─────────────────┐    IPC    ┌──────────────────┐   │
│  │  Renderer (React)│ ◄──────► │  Main (Node.js)  │   │
│  │                  │          │                  │   │
│  │ • Video Player   │          │ • ytdl-core      │   │
│  │ • Chat UI        │          │ • NTP Sync       │   │
│  │ • Room State     │          │ • Cookie Scraper │   │
│  │ • ntpDelta store │          │ • Session Proxy  │   │
│  └────────┬─────────┘          └────────┬─────────┘   │
│           │                             │             │
│           │ WebSocket                   │ UDP:123     │
│           │                             │             │
└───────────┼─────────────────────────────┼─────────────┘
            │                             │
            ▼                             ▼
   ┌────────────────┐          ┌────────────────────┐
   │ Priapus Server │          │   NTP Pool Servers  │
   │  (wss://cdn.   │          │  pool.ntp.org       │
   │  godmade*.com) │          │  time.google.com    │
   │                │          │  time.cloudflare.com│
   │  • Rooms       │          └────────────────────┘
   │  • Sync Events │
   │  • Chat        │
   │  • Presence    │
   └────────────────┘
```

---

## 10. ВЫВОДЫ

1. **Rave НЕ скачивает видео** (кроме YouTube через ytdl-core). Для Netflix/Amazon/Disney — просто WebView с cookies.

2. **Синхронизация построена на трёх уровнях:**
   - NTP correction (компенсация разницы часов)
   - Timestamp в каждом payload (drift compensation)
   - Priapus WebSocket broadcast (мгновенная доставка)

3. **Ключевая формула синхронизации:**
   ```
   correctedPosition = sentPosition + (receivedAt - sentAt) / 1000
   ```

4. **Switchboard** — не про видео, это P2P монетизация трафика пользователей.

5. **Самое важное для нас** — добавить `sentAt` timestamp в sync payload и drift compensation при получении в `useWatchParty.ts`.

---

*Документ создан на основе reverse engineering Rave v1.17.12*
*Claude Sonnet 4.6 | 2026-05-01*
