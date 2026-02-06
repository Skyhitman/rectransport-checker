async function main() {
  const res = await fetch(
    `https://api.telegram.org/bot${process.env.TG_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: process.env.TG_CHAT,
        text: "✅ Telegram test from GitHub Actions"
      })
    }
  );

  console.log("Telegram status:", res.status);
}

main().catch(err => {
  console.error("ERROR:", err);
  process.exit(1);
});
