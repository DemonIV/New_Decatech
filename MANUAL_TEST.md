# Manuel Test Akışı

Bu liste demo veya teslim öncesi temel akışların kırılmadığını kontrol etmek için kullanılır.

## Backend

1. `cd backend`
2. `npm install`
3. `.env.example` dosyasını `.env` olarak kopyala ve DB bilgilerini doldur.
4. `npm start` veya `npm run dev` ile API'yi başlat.
5. Tarayıcıdan `http://localhost:3000/health` adresini kontrol et.

## Login

1. Live Server ile `frontend/login.html` sayfasını aç.
2. Admin hesabıyla giriş yap: `eren / eren123`.
3. Başarılı girişten sonra `index.html` sayfasına yönlenildiğini kontrol et.
4. Hatalı şifreyle giriş yapıldığında hata mesajı gösterildiğini kontrol et.

## İki Sekmeli Demo Akışı

1. Birinci Chrome sekmesinde PM olarak giriş yap: `eren / eren123`.
2. İkinci Chrome sekmesinde frontend çalışanı olarak giriş yap: `safa / safa123` veya `safa@decatech.local / safa123`.
3. PM sekmesinde yönetim panelinin ve görev ekleme aksiyonlarının göründüğünü kontrol et.
4. Çalışan sekmesinde yönetim paneli, proje silme ve görev ekleme aksiyonlarının görünmediğini kontrol et.
5. PM sekmesinde assignee alanına `SA` yazarak yeni görev oluştur.
6. Çalışan sekmesinde görevin birkaç saniye içinde göründüğünü ve bildirim sayısının güncellendiğini kontrol et.
7. Çalışan sekmesinde görevi tamamlandı olarak işaretle.
8. PM sekmesinde görevin tamamlandı kolonuna geçtiğini kontrol et.
9. İki sekmede de sağdaki takım sohbetinden mesaj gönderip diğer sekmede göründüğünü kontrol et.
10. Sohbet panelinin açılıp kapandığını kontrol et.

## Proje ve Görev

1. Ana sayfada proje listesinin yüklendiğini kontrol et.
2. Yeni proje oluştur.
3. Oluşturulan projeyi seç.
4. Yeni görev oluştur.
5. Görevi kanban kolonları arasında taşı.
6. Görevi güncelle ve sil.
7. Ana sayfadaki `Proje Sağlığı`, `Risk Özeti` ve `Yaklaşan İşler` panellerinin görev verilerine göre güncellendiğini kontrol et.

## Yönetim Paneli

1. Admin kullanıcıyla `yonetim.html` sayfasına gir.
2. Kullanıcı listesinin geldiğini kontrol et.
3. Yeni kullanıcı oluştur.
4. Kullanıcıya proje ata.
5. Deadline oluştur, güncelle ve sil.

## Raporlama ve Takvim

1. `raporlama.html` sayfasında proje ve görev bilgilerinin yüklendiğini kontrol et.
2. Raporlama sayfasında `Risk ve Sağlık Özeti` kartının göründüğünü kontrol et.
3. `takvim.html` sayfasında deadline ve görevlerin göründüğünü kontrol et.
