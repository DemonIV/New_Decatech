# DECATECH - Proje Yönetim Uygulaması

DECATECH; proje, görev, kanban, takvim, raporlama ve ekip yönetimi modüllerini içeren web tabanlı bir proje yönetim uygulamasıdır.
Ana ekranda mevcut görev verilerinden üretilen proje sağlık skoru, risk özeti ve yaklaşan işler paneli bulunur.

## Teknolojiler

- Frontend: HTML, CSS, JavaScript
- Backend: Node.js, Express
- Veritabanı: PostgreSQL

## Kurulum

### Gereksinimler

- Node.js
- PostgreSQL

### 1. Backend bağımlılıklarını yükle

```bash
cd backend
npm install
```

### 2. Ortam değişkenlerini hazırla

```bash
cd backend
cp .env.example .env
```

`.env` dosyasındaki `DB_PASSWORD` değerini kendi PostgreSQL şifrene göre güncelle.

### 3. Veritabanını oluştur

```bash
createdb taskapp
```

### 4. Şemayı yükle

Komutu proje kök dizininde çalıştır:

```bash
psql -U postgres -d taskapp -f schema.sql
```

### 5. Admin kullanıcısı oluştur

```sql
INSERT INTO users (username, password, role)
VALUES ('admin', 'admin123', 'admin');
```

### 6. Backend'i başlat

Geliştirme modu:

```bash
cd backend
npm run dev
```

Normal çalıştırma:

```bash
cd backend
npm start
```

Backend varsayılan olarak `http://localhost:3000` adresinde çalışır. Sağlık kontrolü:

```bash
http://localhost:3000/health
```

### 7. Frontend'i başlat

`frontend` klasörünü Live Server ile aç ve `login.html` sayfasından giriş yap.

Varsayılan geliştirme adresi:

```bash
http://127.0.0.1:5500/frontend/login.html
```

## Proje Yapısı

```text
decatech/
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── middleware/
│   │   └── dbCheck.js
│   ├── routes/
│   │   ├── deadlineRoutes.js
│   │   ├── projectRoutes.js
│   │   ├── taskRoutes.js
│   │   └── userRoutes.js
│   ├── .env.example
│   ├── index.js
│   └── package.json
├── frontend/
│   ├── shared.js
│   ├── shared.css
│   ├── login.html
│   ├── index.html
│   ├── kanban.html
│   ├── takvim.html
│   ├── raporlama.html
│   ├── bildirimler.html
│   ├── yonetim.html
│   ├── profil.html
│   └── ayarlar.html
├── schema.sql
└── README.txt
```

## Notlar

- `backend/node_modules` git takibinde tutulmaz. Bağımlılıklar `npm install` ile kurulur.
- `.env` dosyası repoya eklenmez. Örnek değerler `backend/.env.example` içinde tutulur.
- Login endpoint'i `POST /users/login` adresindedir ve başarılı girişte `{ success, user }` formatında yanıt döner.
- Frontend sayfaları ortak API adresi, oturum kontrolü, admin menüsü ve kullanıcı bilgisi için `frontend/shared.js` içindeki yardımcı fonksiyonları kullanır.



