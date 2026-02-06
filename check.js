const fetch = (...args) =>
  import('node-fetch').then(({default: fetch}) => fetch(...args));

const TELEGRAM_TOKEN = process.env.TG_TOKEN;
const CHAT_ID = process.env.TG_CHAT;

const times = ["10", "03", "05"];
const daysToFetch = 1;

const baseUrl = "https://r.jina.ai/https://rectransport.com/xam/";
const monthNames = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];

async function run() {
  for (let d = 0; d < daysToFetch; d++) {
    const date = new Date();
    date.setDate(date.getDate() + d);

    const month = monthNames[date.getMonth()];
    const day = String(date.getDate()).padStart(2, "0");

    for (const time of times) {
      const url = `${baseUrl}${month}${day}x${time}.php`;

      try {
        const res = await fetch(url);
        const html = await res.text();

        if (html.includes("bus-card")) {
          const msg =
`🚌 Bus Available!

📅 ${date.toDateString()}
⏰ ${time}

🔗 ${url.replace("https://r.jina.ai/","")}`;

          await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
              chat_id: CHAT_ID,
              text: msg
            })
          });
        }
      } catch (e) {
        console.error(e);
      }
    }
  }
}

run();
