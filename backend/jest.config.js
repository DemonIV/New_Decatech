module.exports = {
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.test.js"],
  globalSetup: "./tests/globalSetup.js",
  globalTeardown: "./tests/globalTeardown.js",
  setupFiles: ["./tests/setup.js"],
  testTimeout: 15000,
  verbose: true,
};
