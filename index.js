const f = await bot.api.getFile(fileId);
  const url = https://api.telegram.org/file/bot${TOKEN}/${f.file_path};
  const res = await fetch(url);
  if (!res.ok) throw new Error("download failed");
  const ws = createWriteStream(dest);
  await new Promise((ok, bad) => {
    if (res.body.pipe) {
      res.body.pipe(ws).on("finish", ok).on("error", bad);
    } else {
      (async () => {
        for await (const c of res.body) ws.write(c);
        ws.end();
      })().catch(bad);
      ws.on("finish", ok).on("error", bad);
    }
  });
}

function renderVideo(photos, audio, out, size) {
  return new Promise((resolve, reject) => {
    const per = 2;
    const inputs = [];
    photos.forEach((p) => { inputs.push("-loop", "1", "-t", String(per), "-i", p); });
    inputs.push("-i", audio);
    const filter = photos.map((_, i) =>
      [${i}:v]scale=${size}:force_original_aspect_ratio=increase,crop=${size},setsar=1,fps=30[v${i}]
    ).join(";") + ";" + photos.map((_, i) => [v${i}]).join("") + concat=n=${photos.length}:v=1:a=0[v];
    const args = [
      ...inputs, "-filter_complex", filter,
      "-map", "[v]", "-map", ${photos.length}:a:0,
      "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", "-shortest", "-y", out,
    ];
    const ff = spawn(ffmpegPath, args);
    ff.stderr.on("data", (d) => process.stderr.write(d));
    ff.on("close", (c) => c === 0 ? resolve() : reject(new Error("ffmpeg " + c)));
  });
}

const app = express();
app.get("/", (_, r) => r.send("ok"));

if (PUBLIC_URL) {
  app.use(express.json());
  app.use(/webhook, webhookCallback(bot, "express"));
  const port = process.env.PORT || 3000;
  app.listen(port, async () => {
    await bot.api.setWebhook(${PUBLIC_URL}/webhook, { drop_pending_updates: true });
    console.log("Bot up via webhook on port", port);
  });
} else {
  bot.start({ drop_pending_updates: true });
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log("Bot up via polling on port", port));
  }
