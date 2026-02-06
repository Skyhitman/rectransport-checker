import fetch from "node-fetch";

// ================== CONFIG ==================
const TG_TOKEN = process.env.TG_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

const times = ["10", "3", "5"];
const baseUrl = "https://rectransport.com/xam/";
const monthNames = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];
// ============================================

async function sendTelegram(text) {
  await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      text,
      parse_mode: "HTML"
    })
  });
}

function buildUrls() {
  const date = new Date();
  const month = monthNames[date.getMonth()];
  const day = String(date.getDate()).padStart(2, "0");

  return times.map(time => ({
    date: date.toDateString(),
    time,
    url: `${baseUrl}${month}${day}x${time}.php`
  }));
}

async function checkBus() {
  const urls = buildUrls();

  for (const item of urls) {
    const res = await fetch(item.url);
    const html = await res.text();

    console.log("HTTP STATUS:", res.status);
    console.log("HTML LENGTH:", html.length);

    // ❌ 404 or empty
    if (!html || html.includes("404")) continue;

    const cards = html.split('<div class="bus-card">').slice(1);
    let matched = null;

    for (const card of cards) {
      const cleanText = card
        .replace(/<[^>]*>/g, "")
        .replace(/\s+/g, " ")
        .trim();

      const lower = cleanText.toLowerCase();

      // 🎯 PRIORITY 1: 19A / 19D
      const routeMatch = cleanText.match(/route\s*no\s*:\s*(19a|19d)\b/i);
      if (routeMatch) {
        matched = {
          busNumber: routeMatch[1].toUpperCase(),
          route: cleanText,
          foundBy: "bus-number (19A / 19D)"
        };
        break;
      }

      // 🎯 PRIORITY 2: Route names
      if (
        lower.includes("mudichur") ||
        lower.includes("perungalathur") ||
        lower.includes("padmavathy")
      ) {
        matched = {
          busNumber: "—",
          route: cleanText,
          foundBy: "route-name"
        };
      }
    }

    // ✅ SEND TELEGRAM ONLY IF FOUND
    if (matched) {
      const message = `🚌 Bus Found

📅 Date: ${item.date}
⏰ Time: ${item.time}
${matched.busNumber !== "—" ? `🚌 Bus No: ${matched.busNumber}\n` : ""}
🛣 Route:
${matched.route}

🔍 Found by: ${matched.foundBy}`;

      await sendTelegram(message);
      console.log("TELEGRAM SENT");
    }
  }
}

checkBus().catch(console.error);
