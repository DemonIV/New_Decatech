# DECATECH — Proje Yönetim Uygulaması

Modern, gerçek zamanlı proje yönetim uygulaması. Kanban, takvim, raporlama ve ekip yönetimi özellikleri içerir.

## Özellikler

- 📋 **Kanban** — Sürükle bırak görev yönetimi, deadline ve departman filtresi
- 📅 **Takvim** — Görev ve deadline'ları takvimde görüntüleme
- 📊 **Raporlama** — Proje ilerleme ve analitik
- 👥 **Ekip Yönetimi** — Kullanıcı ve proje bazlı yetkilendirme
- 🔔 **Bildirimler** — Görev bildirimleri
- 🌙 **Tema** — Açık/koyu tema desteği
- 💬 **Sohbet** — Takım içi anlık mesajlaşma

## Teknolojiler

**Frontend:** HTML, CSS, JavaScript  
**Backend:** Node.js, Express  
**Veritabanı:** PostgreSQL

## Kurulum

### Gereksinimler
- Node.js
- PostgreSQL

### Adımlar

**1. Repoyu klonla:**
```bash
git clone https://github.com/kullanicin/decatech.git
cd decatech
```

**2. Backend bağımlılıklarını yükle:**
```bash
cd backend
npm install
```

**3. Veritabanını oluştur:**
```bash
createdb taskapp
```

**4. Schema'yı yükle:**
```bash
psql -U postgres -d taskapp -f schema.sql
```

**5. Sunucuyu başlat:**
```bash
nodemon index.js
```

**6. Frontend'i başlat:**
- `frontend` klasöründe Live Server ile `index.html` aç
- Varsayılan: `http://127.0.0.1:5500`

## Varsayılan Giriş

Admin hesabı oluşturmak için direkt DB'ye ekle:
```sql
INSERT INTO users (username, password, role) VALUES ('admin', 'admin123', 'admin');
```

## Proje Yapısı
```
decatech/
├── backend/
│   ├── index.js        # Express sunucu
│   ├── schema.sql      # Veritabanı şeması
│   └── package.json
├── frontend/
│   ├── shared.js       # Ortak fonksiyonlar
│   ├── shared.css      # Ortak stiller
│   ├── index.html      # Genel bakış
│   ├── kanban.html     # Kanban
│   ├── takvim.html     # Takvim
│   ├── raporlama.html  # Raporlama
│   ├── bildirimler.html
│   ├── yonetim.html    # Admin paneli
│   ├── profil.html
│   ├── ayarlar.html
│   └── login.html
└── README.md
```



