import { describe, expect, it } from "vitest";
import { spawnWithPromise } from "./spawn.js";

describe("spawnWithPromise", () => {
  it("resolves when the process exits successfully", async () => {
    await expect(
      spawnWithPromise(process.execPath, ["-e", "process.exit(0)"], { stdio: "ignore" }),
    ).resolves.toBeUndefined();
  });

  it("rejects when the process exits unsuccessfully", async () => {
    await expect(
      spawnWithPromise(process.execPath, ["-e", "process.exit(2)"], { stdio: "ignore" }),
    ).rejects.toMatchObject({ code: 2, signal: null });
  });

  it("rejects when the process cannot be started", async () => {
    await expect(
      spawnWithPromise("podcast-dl-command-that-does-not-exist", [], { stdio: "ignore" }),
    ).rejects.toMatchObject({ code: "ENOENT" });
  });
});
