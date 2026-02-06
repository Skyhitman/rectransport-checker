const TELEGRAM_TOKEN = process.env.TG_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

const times = ["10", "3", "5"];  // ✅ Changed to match URL pattern (3 and 5, not 03 and 05)
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
      // ✅ Correct URL pattern: feb05x10.php, feb05x3.php, feb05x5.php
      const url = `${baseUrl}${month}${day}x${time}.php`;
      console.log("🔍 Checking:", url);
      
      try {
        const res = await fetch(url);
        const html = await res.text();
        console.log("📡 STATUS:", res.status, "LEN:", html.length);
        
        // ⏰ Extract time from HTML or use URL time (Priority: HTML time > URL time)
        let finalTime = time;
        const timeMatch = html.match(/\b\d{1,2}\.\d{2}\s*(am|pm)\b/i);
        if (timeMatch) finalTime = timeMatch[0];
        
        // 🚫 404 handling
        if (html.includes("404")) {
          console.log("❌ 404 - Bus not available");
          continue;
        }
        
        // 🎯 Parse bus cards
        const cards = html.split('<div class="bus-card">').slice(1);
        let matched = null;
        
        for (const card of cards) {
          const cleanText = card
            .replace(/<[^>]*>/g, "")
            .replace(/\s+/g, " ")
            .trim();
          
          const lower = cleanText.toLowerCase();
          
          // 🎯 PRIORITY 1 → ONLY 19A or 19D (STRICT)
          const routeMatch = cleanText.match(/route\s*no\s*:\s*(19a|19d)\b/i);
          if (routeMatch) {
            matched = {
              busNumber: routeMatch[1].toUpperCase(),
              route: cleanText,
              foundBy: "bus-number (19A / 19D)"
            };
            break; // ✅ Stop immediately when found
          }
          
          // 🎯 PRIORITY 2 → ROUTE NAME MATCH (NO BUS NUMBER)
          if (
            lower.includes("mudichur") ||
            lower.includes("perungalathur") ||
            lower.includes("padmavathy")
          ) {
            matched = {
              busNumber: "—", // ❌ never serial number
              route: cleanText,
              foundBy: "route-name"
            };
            // ✅ Don't break - keep looking for Priority 1
          }
        }
        
        // 📤 Send notification if bus found
        if (matched) {
          const message = `🚌 Bus Found!

📅 Date: ${today}
⏰ Time: ${finalTime}
${/^[0-9]+[A-Z]?$/.test(matched.busNumber) ? `🚌 Bus No: ${matched.busNumber}\n` : ''}🛣 Route:
${matched.route}

🔍 Found by: ${matched.foundBy}`;
          
          await sendTelegram(message);
          console.log("✅ TELEGRAM SENT - Bus found!");
        } else {
          console.log("❌ No matching bus found");
        }
        
      } catch (err) {
        console.error("⚠️ ERROR:", err.message);
      }
    }
  }
}

async function sendTelegram(message) {
  try {
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message
      })
    });
    
    if (!response.ok) {
      throw new Error(`Telegram API error: ${response.status}`);
    }
  } catch (err) {
    console.error("❌ Failed to send Telegram:", err.message);
  }
}

run().catch(err => {
  console.error("💥 FATAL:", err);
  process.exit(1);
});
