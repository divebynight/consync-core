const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "artifacts");

function getWhiteboardPath() {
  return path.join(ROOT, "whiteboard.md");
}

function readWhiteboard() {
  return fs.readFileSync(getWhiteboardPath(), "utf-8");
}

function appendWhiteboard(content) {
  fs.appendFileSync(getWhiteboardPath(), "\n" + content + "\n");
  return "Appended";
}

const server = http.createServer((req, res) => {
  if (req.method === "POST" && req.url === "/tool") {
    let body = "";

    req.on("data", chunk => {
      body += chunk;
    });

    req.on("end", () => {
      try {
        const parsed = JSON.parse(body);

        if (parsed.tool === "read_whiteboard") {
          const result = readWhiteboard();
          res.writeHead(200, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ result }));
        }

        if (parsed.tool === "append_whiteboard") {
          const content = parsed.input?.content || "";
          const result = appendWhiteboard(content);
          res.writeHead(200, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ result }));
        }

        res.writeHead(400);
        res.end("Unknown tool");

      } catch (err) {
        res.writeHead(500);
        res.end("Invalid request");
      }
    });

    return;
  }

  res.writeHead(404);
  res.end("Not Found");
});

server.listen(3000, () => {
  console.log("Dev Harness Tool Server running on http://localhost:3000");
});
