const request = require("supertest");

const getToken = async (app, username = "test_admin", password = "admin123") => {
  const res = await request(app)
    .post("/users/login")
    .send({ username, password });
  return res.body.token;
};

module.exports = getToken;
