// ═══════════════════════════════════════════════════════════════
// WeWatch — Database & Architecture Diagram Generator
// ═══════════════════════════════════════════════════════════════
// Как запустить:
//   Figma → Plugins → Development → New Plugin → "Run once"
//   Вставь этот код и нажми Run
// ═══════════════════════════════════════════════════════════════

async function main() {
  const page = figma.currentPage;
  page.name = "WeWatch — DB & Architecture";

  await figma.loadFontAsync({ family: "Inter", style: "Regular" });
  await figma.loadFontAsync({ family: "Inter", style: "Bold" });
  await figma.loadFontAsync({ family: "Inter", style: "Medium" });
  await figma.loadFontAsync({ family: "Inter", style: "Semi Bold" });

  // ─── ЦВЕТОВАЯ ПАЛИТРА ─────────────────────────────────────────
  const C = {
    bg:          { r: 0.07, g: 0.07, b: 0.11, a: 1 },
    surface:     { r: 0.11, g: 0.11, b: 0.17, a: 1 },
    surfaceHigh: { r: 0.15, g: 0.15, b: 0.22, a: 1 },
    border:      { r: 0.22, g: 0.22, b: 0.32, a: 1 },
    white:       { r: 1,    g: 1,    b: 1,    a: 1 },
    muted:       { r: 0.55, g: 0.55, b: 0.65, a: 1 },
    typeColor:   { r: 0.40, g: 0.80, b: 0.60, a: 1 },
    pkColor:     { r: 0.98, g: 0.79, b: 0.20, a: 1 },
    fkColor:     { r: 0.98, g: 0.55, b: 0.30, a: 1 },
    // Services
    auth:        { r: 0.38, g: 0.52, b: 0.95, a: 1 },
    user:        { r: 0.25, g: 0.75, b: 0.50, a: 1 },
    content:     { r: 0.95, g: 0.52, b: 0.22, a: 1 },
    watchParty:  { r: 0.72, g: 0.30, b: 0.95, a: 1 },
    battle:      { r: 0.95, g: 0.28, b: 0.38, a: 1 },
    notification:{ r: 0.98, g: 0.78, b: 0.12, a: 1 },
    admin:       { r: 0.50, g: 0.50, b: 0.60, a: 1 },
    infra:       { r: 0.20, g: 0.70, b: 0.90, a: 1 },
    mobile:      { r: 0.30, g: 0.85, b: 0.65, a: 1 },
  };

  // ─── ХЕЛПЕРЫ ──────────────────────────────────────────────────
  function rgb(c) { return [{ type: "SOLID", color: { r: c.r, g: c.g, b: c.b }, opacity: c.a }]; }
  function rgba(c, a) { return [{ type: "SOLID", color: { r: c.r, g: c.g, b: c.b }, opacity: a }]; }
  function noFill() { return []; }
  function stroke(c, w = 1) {
    return { strokes: rgb(c), strokeWeight: w, strokeAlign: "INSIDE" };
  }

  async function makeText(txt, size, color, bold = false, x = 0, y = 0) {
    const t = figma.createText();
    t.characters = txt;
    t.fontSize = size;
    t.fills = rgb(color);
    t.fontName = { family: "Inter", style: bold ? "Bold" : "Regular" };
    t.x = x; t.y = y;
    return t;
  }

  function makeRect(w, h, color, x = 0, y = 0, radius = 0) {
    const r = figma.createRectangle();
    r.resize(w, h); r.x = x; r.y = y;
    r.fills = rgb(color);
    r.cornerRadius = radius;
    return r;
  }

  function makeFrame(name, w, h, x = 0, y = 0, bg = null) {
    const f = figma.createFrame();
    f.name = name; f.resize(w, h); f.x = x; f.y = y;
    f.fills = bg ? rgb(bg) : noFill();
    f.clipsContent = false;
    return f;
  }

  // ─── ТАБЛИЦА КОЛЛЕКЦИИ ────────────────────────────────────────
  async function makeTable(name, service, color, fields, x, y) {
    const COL_W = 260;
    const HEADER_H = 40;
    const ROW_H = 28;
    const totalH = HEADER_H + fields.length * ROW_H + 8;

    const frame = makeFrame(name, COL_W, totalH, x, y, C.surface);
    frame.cornerRadius = 8;
    Object.assign(frame, stroke(color, 1.5));

    // Header
    const header = makeRect(COL_W, HEADER_H, color, 0, 0, 8);
    header.cornerRadius = 0;
    // Fix top radius
    const headerFull = figma.createRectangle();
    headerFull.resize(COL_W, HEADER_H - 4);
    headerFull.x = 0; headerFull.y = 4;
    headerFull.fills = rgb(color);
    frame.appendChild(header);
    frame.appendChild(headerFull);

    // Collection name
    const nameT = await makeText(name, 13, C.white, true, 12, 12);
    frame.appendChild(nameT);

    // Service badge
    const svcT = await makeText(service, 10, C.white, false, 0, 14);
    svcT.opacity = 0.75;
    svcT.x = COL_W - svcT.width - 10;
    frame.appendChild(svcT);

    // Fields
    for (let i = 0; i < fields.length; i++) {
      const [fname, ftype, flag] = fields[i];
      const rowY = HEADER_H + i * ROW_H + 4;

      // Row bg (alternating)
      if (i % 2 === 0) {
        const rowBg = makeRect(COL_W, ROW_H, C.surfaceHigh, 0, rowY);
        frame.appendChild(rowBg);
      }

      // Flag (PK/FK)
      if (flag) {
        const flagColor = flag === "PK" ? C.pkColor : C.fkColor;
        const flagT = await makeText(flag, 9, flagColor, true, 10, rowY + 8);
        frame.appendChild(flagT);
      }

      // Field name
      const fnameT = await makeText(fname, 11, C.white, false, flag ? 36 : 12, rowY + 8);
      frame.appendChild(fnameT);

      // Type
      const ftypeT = await makeText(ftype, 10, C.typeColor, false, 0, rowY + 9);
      ftypeT.x = COL_W - ftypeT.width - 10;
      frame.appendChild(ftypeT);

      // Divider
      if (i < fields.length - 1) {
        const div = makeRect(COL_W - 24, 1, C.border, 12, rowY + ROW_H - 1);
        frame.appendChild(div);
      }
    }

    page.appendChild(frame);
    return frame;
  }

  // ─── КОННЕКТОР ────────────────────────────────────────────────
  function makeLine(x1, y1, x2, y2, color) {
    const line = figma.createLine();
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    line.x = x1; line.y = y1;
    line.resize(len, 0);
    line.rotation = -Math.atan2(dy, dx) * 180 / Math.PI;
    line.strokes = rgb(color);
    line.strokeWeight = 1.5;
    line.opacity = 0.5;
    page.appendChild(line);
    return line;
  }

  // ─── SERVICE BOX ──────────────────────────────────────────────
  async function makeServiceBox(name, port, desc, color, x, y, w = 180, h = 80) {
    const frame = makeFrame(name, w, h, x, y, C.surface);
    frame.cornerRadius = 12;
    frame.strokes = rgb(color);
    frame.strokeWeight = 2;
    frame.strokeAlign = "INSIDE";

    // Color bar top
    const bar = makeRect(w, 4, color, 0, 0);
    bar.topLeftRadius = 12; bar.topRightRadius = 12;
    frame.appendChild(bar);

    const nameT = await makeText(name, 13, C.white, true, 12, 14);
    frame.appendChild(nameT);

    if (port) {
      const portT = await makeText(`port ${port}`, 10, color, false, 12, 32);
      frame.appendChild(portT);
    }

    const descT = await makeText(desc, 10, C.muted, false, 12, port ? 48 : 32);
    descT.resize(w - 24, 24);
    descT.textAutoResize = "HEIGHT";
    frame.appendChild(descT);

    page.appendChild(frame);
    return frame;
  }

  // ─── SECTION TITLE ────────────────────────────────────────────
  async function makeSectionTitle(title, subtitle, x, y) {
    const titleT = await makeText(title, 28, C.white, true, x, y);
    page.appendChild(titleT);
    const subT = await makeText(subtitle, 13, C.muted, false, x, y + 36);
    page.appendChild(subT);
  }

  // ═══════════════════════════════════════════════════════════════
  // SECTION 1 — DATABASE ERD
  // ═══════════════════════════════════════════════════════════════
  await makeSectionTitle(
    "WeWatch — Database Architecture",
    "MongoDB Collections · Relationships · Field Types",
    100, 60
  );

  // Legend
  const legendItems = [
    ["PK", C.pkColor, "Primary Key"],
    ["FK", C.fkColor, "Foreign Key (ref)"],
    ["●", C.typeColor, "Field Type"],
  ];
  for (let i = 0; i < legendItems.length; i++) {
    const [label, color, desc] = legendItems[i];
    const lx = 100 + i * 200;
    const lt = await makeText(`${label}  ${desc}`, 11, color, false, lx, 120);
    page.appendChild(lt);
  }

  // ─── Collections ──────────────────────────────────────────────
  // ROW 1: Auth + User
  await makeTable("users", ":3002 User", C.user, [
    ["_id",            "ObjectId",  "PK"],
    ["email",          "String",    null],
    ["passwordHash",   "String",    null],
    ["username",       "String",    null],
    ["avatar",         "String?",   null],
    ["bio",            "String?",   null],
    ["isEmailVerified","Boolean",   null],
    ["isBlocked",      "Boolean",   null],
    ["role",           "enum",      null],
    ["lastLoginAt",    "Date?",     null],
    ["fcmTokens",      "String[]",  null],
    ["createdAt",      "Date",      null],
  ], 100, 160);

  await makeTable("refresh_tokens", ":3001 Auth", C.auth, [
    ["_id",      "ObjectId", "PK"],
    ["userId",   "ObjectId", "FK"],
    ["token",    "String",   null],
    ["expiresAt","Date",     null],
    ["createdAt","Date",     null],
  ], 400, 160);

  await makeTable("otp_codes", ":3001 Auth", C.auth, [
    ["_id",      "ObjectId", "PK"],
    ["userId",   "ObjectId", "FK"],
    ["code",     "String",   null],
    ["type",     "enum",     null],
    ["expiresAt","Date",     null],
  ], 700, 160);

  // ROW 2: Content
  await makeTable("movies", ":3003 Content", C.content, [
    ["_id",           "ObjectId", "PK"],
    ["title",         "String",   null],
    ["description",   "String",   null],
    ["genres",        "String[]", null],
    ["year",          "Number",   null],
    ["duration",      "Number",   null],
    ["poster",        "String",   null],
    ["trailer",       "String?",  null],
    ["averageRating", "Number",   null],
    ["viewCount",     "Number",   null],
    ["isPublished",   "Boolean",  null],
    ["createdAt",     "Date",     null],
  ], 1000, 160);

  await makeTable("watch_progress", ":3003 Content", C.content, [
    ["_id",      "ObjectId", "PK"],
    ["userId",   "ObjectId", "FK"],
    ["movieId",  "ObjectId", "FK"],
    ["progress", "Number",   null],
    ["duration", "Number",   null],
    ["updatedAt","Date",     null],
  ], 1300, 160);

  await makeTable("domains", ":3003 Content", C.content, [
    ["_id",          "ObjectId", "PK"],
    ["domain",       "String",   null],
    ["visitCount",   "Number",   null],
    ["isBlocked",    "Boolean",  null],
    ["isAutoFlagged","Boolean",  null],
    ["lastVisitAt",  "Date",     null],
  ], 1600, 160);

  // ROW 3: WatchParty
  await makeTable("watch_party_rooms", ":3004 WatchParty", C.watchParty, [
    ["_id",        "ObjectId", "PK"],
    ["ownerId",    "ObjectId", "FK"],
    ["movieId",    "ObjectId", "FK"],
    ["sourceUrl",  "String",   null],
    ["inviteCode", "String",   null],
    ["status",     "enum",     null],
    ["members",    "Object[]", null],
    ["syncState",  "Object",   null],
    ["createdAt",  "Date",     null],
  ], 100, 560);

  await makeTable("room_messages", ":3004 WatchParty", C.watchParty, [
    ["_id",       "ObjectId", "PK"],
    ["roomId",    "ObjectId", "FK"],
    ["userId",    "ObjectId", "FK"],
    ["type",      "enum",     null],
    ["content",   "String",   null],
    ["createdAt", "Date",     null],
  ], 400, 560);

  // ROW 3 continued: Battle
  await makeTable("battles", ":3005 Battle", C.battle, [
    ["_id",          "ObjectId", "PK"],
    ["challengerId", "ObjectId", "FK"],
    ["opponentId",   "ObjectId", "FK"],
    ["movie1Id",     "ObjectId", "FK"],
    ["movie2Id",     "ObjectId", "FK"],
    ["status",       "enum",     null],
    ["votes",        "Object[]", null],
    ["winnerId",     "ObjectId?","FK"],
    ["createdAt",    "Date",     null],
  ], 700, 560);

  await makeTable("achievements", ":3005 Battle", C.battle, [
    ["_id",      "ObjectId", "PK"],
    ["userId",   "ObjectId", "FK"],
    ["type",     "String",   null],
    ["points",   "Number",   null],
    ["earnedAt", "Date",     null],
  ], 1000, 560);

  // ROW 3 continued: Notification + Admin
  await makeTable("notifications", ":3007 Notification", C.notification, [
    ["_id",       "ObjectId", "PK"],
    ["userId",    "ObjectId", "FK"],
    ["type",      "enum",     null],
    ["data",      "Object",   null],
    ["isRead",    "Boolean",  null],
    ["createdAt", "Date",     null],
  ], 1300, 560);

  await makeTable("support_conversations", ":3008 Admin", C.admin, [
    ["_id",       "ObjectId", "PK"],
    ["userId",    "ObjectId", "FK"],
    ["status",    "enum",     null],
    ["messages",  "Object[]", null],
    ["createdAt", "Date",     null],
    ["updatedAt", "Date",     null],
  ], 1600, 560);

  // ─── Relationship lines (FK arrows) ───────────────────────────
  // users → refresh_tokens
  makeLine(360, 240, 400, 220, C.auth);
  // users → otp_codes
  makeLine(360, 240, 700, 220, C.auth);
  // users → watch_progress
  makeLine(260, 380, 1300 + 60, 210, C.content);
  // movies → watch_progress
  makeLine(1260, 240, 1300 + 140, 210, C.content);
  // users → watch_party_rooms (owner)
  makeLine(200, 480, 200, 560, C.watchParty);
  // users → battles
  makeLine(200, 480, 800, 560, C.battle);
  // users → notifications
  makeLine(200, 480, 1360, 560, C.notification);
  // users → support_conversations
  makeLine(200, 480, 1660, 560, C.admin);
  // users → achievements
  makeLine(200, 480, 1060, 560, C.battle);

  // ═══════════════════════════════════════════════════════════════
  // SECTION 2 — SYSTEM ARCHITECTURE
  // ═══════════════════════════════════════════════════════════════
  const ARCH_Y = 1000;

  await makeSectionTitle(
    "WeWatch — System Architecture",
    "Microservices · Infrastructure · Client Apps",
    100, ARCH_Y
  );

  // ─── Client Apps ──────────────────────────────────────────────
  await makeServiceBox("Mobile App", null, "React Native + Expo\nEmirhans zone", C.mobile, 100, ARCH_Y + 80, 180, 85);
  await makeServiceBox("Admin UI", null, "React + Vite + Tailwind\nport 5173", C.admin, 300, ARCH_Y + 80, 180, 85);

  // ─── nginx ────────────────────────────────────────────────────
  const nginxX = 560;
  const nginxY = ARCH_Y + 107;
  const nginxBox = makeFrame("nginx", 120, 50, nginxX, nginxY, C.surfaceHigh);
  nginxBox.cornerRadius = 8;
  nginxBox.strokes = rgb(C.infra);
  nginxBox.strokeWeight = 1.5;
  nginxBox.strokeAlign = "INSIDE";
  page.appendChild(nginxBox);
  const nginxT = await makeText("nginx", 13, C.infra, true, nginxX + 28, nginxY + 16);
  page.appendChild(nginxT);

  // Clients → nginx
  makeLine(280, ARCH_Y + 122, 560, ARCH_Y + 132, C.infra);
  makeLine(480, ARCH_Y + 122, 560, ARCH_Y + 132, C.infra);

  // ─── Backend Services (2 rows) ────────────────────────────────
  const SVC_ROW1_Y = ARCH_Y + 80;
  const SVC_ROW2_Y = ARCH_Y + 200;
  const SVC_START_X = 740;
  const SVC_GAP = 210;

  const services = [
    { name: "Auth",         port: "3001", desc: "JWT RS256\nBcrypt + OTP",   color: C.auth,         row: 0, col: 0 },
    { name: "User",         port: "3002", desc: "Profiles\nFriends + Stats", color: C.user,         row: 0, col: 1 },
    { name: "Content",      port: "3003", desc: "Movies\nElasticsearch",     color: C.content,      row: 0, col: 2 },
    { name: "Watch Party",  port: "3004", desc: "Socket.io\nReal-time sync", color: C.watchParty,   row: 1, col: 0 },
    { name: "Battle",       port: "3005", desc: "Gamification\n1v1 + Ranks", color: C.battle,       row: 1, col: 1 },
    { name: "Notification", port: "3007", desc: "FCM Push\nBull Queues",     color: C.notification, row: 1, col: 2 },
    { name: "Admin",        port: "3008", desc: "Admin API\nModeration",     color: C.admin,        row: 1, col: 3 },
  ];

  for (const svc of services) {
    const sx = SVC_START_X + svc.col * SVC_GAP;
    const sy = svc.row === 0 ? SVC_ROW1_Y : SVC_ROW2_Y;
    await makeServiceBox(svc.name, svc.port, svc.desc, svc.color, sx, sy, 190, 80);
    // nginx → service
    makeLine(nginxX + 120, nginxY + 25, sx, sy + 40, svc.color);
  }

  // ─── Infrastructure ───────────────────────────────────────────
  const INFRA_Y = ARCH_Y + 340;

  const infraItems = [
    { name: "MongoDB Atlas",    desc: ":27017\nMain database",   color: C.user    },
    { name: "Redis 7",          desc: ":6380\nCache + Queues",   color: C.battle  },
    { name: "Elasticsearch",    desc: ":9200\nContent search",   color: C.content },
    { name: "Firebase FCM",     desc: "Push notifications",      color: C.notification },
    { name: "Railway",          desc: "Deployment\nAll services", color: C.infra   },
  ];

  for (let i = 0; i < infraItems.length; i++) {
    const item = infraItems[i];
    const ix = 100 + i * 220;
    await makeServiceBox(item.name, null, item.desc, item.color, ix, INFRA_Y, 190, 70);
  }

  // Title for infra
  const infraTitle = await makeText("Infrastructure", 14, C.muted, true, 100, INFRA_Y - 28);
  page.appendChild(infraTitle);

  // All services → MongoDB
  for (let i = 0; i < 3; i++) {
    makeLine(SVC_START_X + 95 + i * SVC_GAP, SVC_ROW1_Y + 80, 195, INFRA_Y, C.user);
  }
  for (let i = 0; i < 4; i++) {
    makeLine(SVC_START_X + 95 + i * SVC_GAP, SVC_ROW2_Y + 80, 195, INFRA_Y, C.user);
  }

  // Watch Party → Redis
  makeLine(SVC_START_X + 95, SVC_ROW2_Y + 80, 415, INFRA_Y, C.battle);
  // Battle → Redis
  makeLine(SVC_START_X + 95 + SVC_GAP, SVC_ROW2_Y + 80, 415, INFRA_Y, C.battle);
  // Notification → Bull/Redis
  makeLine(SVC_START_X + 95 + 2 * SVC_GAP, SVC_ROW2_Y + 80, 415, INFRA_Y, C.battle);

  // Content → Elasticsearch
  makeLine(SVC_START_X + 95 + 2 * SVC_GAP, SVC_ROW1_Y + 80, 635, INFRA_Y, C.content);

  // Notification → FCM
  makeLine(SVC_START_X + 95 + 2 * SVC_GAP, SVC_ROW2_Y + 80, 855, INFRA_Y, C.notification);

  // ─── Socket.io annotation ────────────────────────────────────
  const socketNote = await makeText("⚡ Socket.io — video:play | video:pause | video:seek\n    room:join | room:leave | video:sync | video:buffer", 11, C.watchParty, false, SVC_START_X, SVC_ROW2_Y + 90);
  page.appendChild(socketNote);

  // ─── Legend / Zone info ───────────────────────────────────────
  const legendY = INFRA_Y + 120;
  const zoneItems = [
    { label: "Saidazim zone", desc: "services/* + admin-ui/", color: C.auth },
    { label: "Emirhan zone",  desc: "apps/mobile/ only",      color: C.mobile },
    { label: "Shared (lock)", desc: "shared/types|utils|constants", color: C.notification },
  ];
  const legendTitle = await makeText("Zone Matrix", 16, C.white, true, 100, legendY);
  page.appendChild(legendTitle);
  for (let i = 0; i < zoneItems.length; i++) {
    const z = zoneItems[i];
    const dot = makeRect(12, 12, z.color, 100, legendY + 28 + i * 24, 6);
    page.appendChild(dot);
    const zt = await makeText(`${z.label}  ·  ${z.desc}`, 12, C.muted, false, 122, legendY + 27 + i * 24);
    page.appendChild(zt);
  }

  // ─── Set viewport ─────────────────────────────────────────────
  figma.viewport.scrollAndZoomIntoView(page.children);
  figma.closePlugin("✅ WeWatch diagram created successfully!");
}

main().catch(e => figma.closePlugin("❌ Error: " + e.message));
