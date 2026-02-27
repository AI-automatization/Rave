// MongoDB initialization script
// docker-compose.dev.yml da avtomatik ishga tushadi
// Root user (cinesync) allaqachon MONGO_INITDB_ROOT_USERNAME da yaratilgan

// Dev uchun barcha kerakli DB larni yaratamiz
const databases = [
  'cinesync_auth',
  'cinesync_user',
  'cinesync_content',
  'cinesync_watch_party',
  'cinesync_battle',
  'cinesync_notification',
  'cinesync_admin',
];

databases.forEach(dbName => {
  db.getSiblingDB(dbName).createCollection('_init');
  print(`✅ Database initialized: ${dbName}`);
});

print('🎬 CineSync MongoDB initialized successfully');
