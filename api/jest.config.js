// Plain JS on purpose: a jest.config.ts would need ts-node installed just to read the config.
/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  transform: {
    "^.+\\.ts$": ["ts-jest", { tsconfig: "tsconfig.jest.json" }],
  },
  setupFiles: ["<rootDir>/tests/setupEnv.ts"],
};
