// Her test dosyası çalışmadan önce env'yi zorla
process.env.NODE_ENV = "test";
process.env.DB_NAME  = "taskapp_test";
process.env.JWT_SECRET = "test_secret_key";
