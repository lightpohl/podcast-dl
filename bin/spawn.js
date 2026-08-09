import { spawn } from "child_process";

export const spawnWithPromise = (command, args, options) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, options);

    child.on("error", reject);
    child.on("close", (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }

      const reason = signal ? `signal ${signal}` : `code ${code}`;
      const error = new Error(`${command} exited with ${reason}`);
      error.code = code;
      error.signal = signal;
      reject(error);
    });
  });
