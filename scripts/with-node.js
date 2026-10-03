const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const windowsNode = path.join(root, "node_modules", "node", "bin", "node.exe");
const unixNode = path.join(root, "node_modules", "node", "bin", "node");
const nodeBin = fs.existsSync(windowsNode) ? windowsNode : unixNode;
const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next");

if (!fs.existsSync(nodeBin)) {
  console.error("Local Node 22 is missing. Run npm install first.");
  process.exit(1);
}

const child = spawn(nodeBin, [nextBin, ...process.argv.slice(2)], {
  stdio: "inherit",
  cwd: root,
  env: process.env,
});

child.on("exit", (code) => process.exit(code == null ? 1 : code));
