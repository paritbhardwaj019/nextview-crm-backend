import mongoose from "mongoose";
import fs from "fs";
import path from "path";

const modelsDirectory = __dirname;
fs.readdirSync(modelsDirectory)
  .filter((file: string) => {
    return (
      file.endsWith(".model.ts") &&
      file !== "index.ts" &&
      fs.statSync(path.join(modelsDirectory, file)).isFile()
    );
  })
  .forEach((file: string) => {
    require(path.join(modelsDirectory, file));
  });

console.log("✅ Registered Mongoose Models -", mongoose.modelNames());

export default mongoose;
