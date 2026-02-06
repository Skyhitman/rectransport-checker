const TELEGRAM_TOKEN = process.env.TG_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

const times = ["10", "3", "5"];
const daysToFetch = 1;
const baseUrl = "https://www.rectransport.com/xam/";
const monthNames = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];

async function run() {
  const today = new Date().toDateString();
  
  for (let d = 0; d < daysToFetch; d++) {
    const date = new Date();
    date.setDate(date.getDate() + d);
    
    const month = monthNames[date.getMonth()];
    const day = String(date.getDate()).padStart(2, "0");
    
    for (const time of times) {
      const url = baseUrl + month + day + "x" + time + ".php";
      console.log("Checking: " + url);
      
      try {
        const res = await fetch(url);
        const html = await res.text();
        console.log("STATUS: " + res.status + " LEN: " + html.length);
        
        let finalTime = time;
        const timeMatch = html.match(/\b\d{1,2}\.\d{2}\s*(am|pm)\b/i);
        if (timeMatch) {
          finalTime = timeMatch[0];
        }
        
        if (html.includes("404")) {
          console.log("404 - Bus not available");
          continue;
        }
        
        const cards = html.split('<div class="bus-card">').slice(1);
        let matched = null;
        
        for (const card of cards) {
          const cleanText = card.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
          const lower = cleanText.toLowerCase();
          
          const routeMatch = cleanText.match(/route\s*no\s*:\s*(19a|19d)\b/i);
          if (routeMatch) {
            matched = {
              busNumber: routeMatch[1].toUpperCase(),
              route: cleanText,
              foundBy: "bus-number (19A / 19D)"
            };
            break;
          }
          
          if (lower.includes("mudichur") || lower.includes("perungalathur") || lower.includes("padmavathy")) {
            matched = {
              busNumber: "—",
              route: cleanText,
              foundBy: "route-name"
            };
          }
        }
        
        if (matched) {
          let message = "Bus Found!\n\n";
          message += "Date: " + today + "\n";
          message += "Time: " + finalTime + "\n";
          
          if (/^[0-9]+[A-Z]?$/.test(matched.busNumber)) {
            message += "Bus No: " + matched.busNumber + "\n";
          }
          
          message += "\nRoute:\n" + matched.route + "\n\n";
          message += "Found by: " + matched.foundBy;
          
          await sendTelegram(message);
          console.log("TELEGRAM SENT - Bus found!");
        } else {
          console.log("No matching bus found");
        }
        
      } catch (err) {
        console.error("ERROR: " + err.message);
      }
    }
  }
}

async function sendTelegram(message) {
  try {
    const url = "https://api.telegram.org/bot" + TELEGRAM_TOKEN + "/sendMessage";
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message
      })
    });
    
    if (!response.ok) {
      const data = await response.json();
      console.error("Telegram error: " + JSON.stringify(data));
    }
  } catch (err) {
    console.error("Failed to send: " + err.message);
  }
}

run().catch(function(err) {
  console.error("FATAL: " + err.message);
  process.exit(1);
});
