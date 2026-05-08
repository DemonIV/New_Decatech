# DecaTech — Proje Yönetim Uygulaması

Kanban, görev takibi, takvim, raporlama ve ekip yönetimi modüllerini içeren web tabanlı proje yönetim uygulaması.

**Stack:** Node.js + Express · PostgreSQL · Vanilla JS/HTML/CSS

---

## Gereksinimler

- [Node.js](https://nodejs.org) v18+
- [PostgreSQL](https://www.postgresql.org/download) v14+
- VS Code + [Live Server eklentisi](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) (frontend için)

---

## Kurulum

### 1. Repoyu klonla

```bash
git clone https://github.com/KULLANICI_ADIN/DecaTech.git
cd DecaTech
```

### 2. Backend bağımlılıklarını yükle

```bash
cd backend
npm install
```

### 3. .env dosyasını oluştur

```bash
# Mac / Linux
cp .env.example .env

# Windows (CMD)
copy .env.example .env

# Windows (PowerShell)
Copy-Item .env.example .env
```

`.env` dosyasını bir editörle aç ve `DB_PASSWORD` değerini kendi PostgreSQL şifrenle değiştir:

```
PORT=3000
DB_USER=postgres
DB_HOST=localhost
DB_NAME=taskapp
DB_PASSWORD=SENIN_POSTGRES_SIFREN
DB_PORT=5432
JWT_SECRET=istedigin_herhangi_bir_metin
```

### 4. Veritabanını oluştur

Yeni bir terminal aç:

```bash
psql -U postgres -h localhost
```

psql içinde:

```sql
CREATE DATABASE taskapp;
\q
```

> **Windows'ta** psql bulunamazsa: `C:\Program Files\PostgreSQL\16\bin\psql.exe` tam yoluyla çalıştır veya bu klasörü PATH'e ekle.

### 5. Tabloları yükle

**DecaTech ana klasöründeyken** çalıştır:

```bash
psql -U postgres -h localhost -d taskapp -f schema.sql
psql -U postgres -h localhost -d taskapp -f migrations/003_constraints_indexes.sql
psql -U postgres -h localhost -d taskapp -f migrations/004_refresh_tokens.sql
```

### 6. Admin kullanıcısı oluştur

`backend/` klasöründeyken aşağıdaki komutu çalıştır. Bu komut `admin123` şifresini hash'leyip veritabanına ekler:

```bash
node -e "
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({ user: process.env.DB_USER, host: process.env.DB_HOST, database: process.env.DB_NAME, password: process.env.DB_PASSWORD, port: process.env.DB_PORT });
bcrypt.hash('admin123', 10).then(async hash => {
  await pool.query('INSERT INTO users (username, password, role) VALUES (\$1, \$2, \$3)', ['admin', hash, 'admin']);
  console.log('Admin kullanıcısı oluşturuldu: admin / admin123');
  await pool.end();
}).catch(e => { console.error(e.message); pool.end(); });
"
```

> **Windows PowerShell kullanıyorsan** bu komut çalışmayabilir. Bunun yerine `backend/` klasörüne `resetpw.js` adında dosya oluştur:
>
> ```js
> const bcrypt = require('bcryptjs');
> const { Pool } = require('pg');
> require('dotenv').config();
> const pool = new Pool({ user: process.env.DB_USER, host: process.env.DB_HOST, database: process.env.DB_NAME, password: process.env.DB_PASSWORD, port: process.env.DB_PORT });
> bcrypt.hash('admin123', 10).then(async hash => {
>   await pool.query("INSERT INTO users (username, password, role) VALUES ($1, $2, $3)", [hash, 'admin', 'admin']);
>   console.log('Admin olusturuldu: admin / admin123');
>   await pool.end();
> });
> ```
>
> Sonra `node resetpw.js` ile çalıştır, ardından dosyayı sil.

### 7. Backend'i başlat

```bash
cd backend
node index.js
```

Terminalde şunu görürsen başarılı:

```
Veritabanı bağlantısı kuruldu
Server başladı — port: 3000, ortam: development
```

Tarayıcıdan kontrol et: [http://localhost:3000/health](http://localhost:3000/health)

```json
{ "success": true, "service": "decatech-api", "database": "connected" }
```

### 8. Frontend'i aç

VS Code'da `frontend/login.html` dosyasına sağ tıkla → **Open with Live Server**

Giriş sayfası açılır: `http://127.0.0.1:5500/frontend/login.html`

**Kullanıcı adı:** `admin`  
**Şifre:** `admin123`

---

## Testleri Çalıştırma (Opsiyonel)

Testler ayrı bir `taskapp_test` veritabanı kullanır.

```bash
psql -U postgres -h localhost -c "CREATE DATABASE taskapp_test;"
psql -U postgres -h localhost -d taskapp_test -f schema.sql
psql -U postgres -h localhost -d taskapp_test -f migrations/003_constraints_indexes.sql
psql -U postgres -h localhost -d taskapp_test -f migrations/004_refresh_tokens.sql
```

```bash
cd backend
npm test
```

57 testin tamamının geçmesi beklenir.

---

## Proje Yapısı

```
DecaTech/
├── backend/
│   ├── config/db.js          # PostgreSQL bağlantı pool'u
│   ├── middleware/            # auth, validate, dbCheck
│   ├── routes/                # users, projects, tasks, deadlines, sse
│   ├── utils/                 # logger, sse broadcast
│   ├── tests/                 # jest + supertest test suite
│   ├── .env.example
│   ├── app.js
│   ├── index.js
│   └── package.json
├── frontend/
│   ├── shared.js              # Global fetch interceptor, token yönetimi
│   ├── login.html
│   ├── index.html             # Ana sayfa (proje sağlığı, raporlar)
│   ├── kanban.html
│   ├── takvim.html
│   ├── yonetim.html           # Admin paneli
│   └── ...
├── migrations/
│   ├── 003_constraints_indexes.sql
│   └── 004_refresh_tokens.sql
└── schema.sql
```

---

## Sık Karşılaşılan Sorunlar

**`database "taskapp" does not exist`**  
→ 4. adımdaki `CREATE DATABASE taskapp` komutunu çalıştır.

**`SASL: client password must be a string`**  
→ `.env` dosyası `backend/` klasörünün içinde değil. `backend/.env` olması gerekiyor.

**`CORS: null izin verilmedi`**  
→ Frontend'i `file://` ile açıyorsun. VS Code Live Server kullan (`http://127.0.0.1:5500`).

**`DB not connected` hatası**  
→ Backend terminalinde hata mesajı ara. PostgreSQL servisinin çalıştığından emin ol.  
Windows: `net start postgresql-x64-16` (sürüm numarası farklı olabilir)

**Şifre hash sorunu (PowerShell)**  
→ Adım 6'daki `resetpw.js` yöntemini kullan.
