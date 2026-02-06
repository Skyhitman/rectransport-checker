const TELEGRAM_TOKEN = process.env.TG_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

const times = ["10", "3", "5"];
const daysToFetch = 1;
const baseUrl = "https://www.rectransport.com/xam/";
const monthNames = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];

async function run() {
  const today = new Date().toDateString();
  
  // Test Telegram first
  await testTelegram();
  
  for (let d = 0; d < daysToFetch; d++) {
    const date = new Date();
    date.setDate(date.getDate() + d);
    
    const month = monthNames[date.getMonth()];
    const day = String(date.getDate()).padStart(2, "0");
    
    for (const time of times) {
      const url = `${baseUrl}${month}${day}x${time}.php`;
      console.log("🔍 Checking:", url);
      
      try {
        const res = await fetch(url);
        const html = await res.text();
        console.log("📡 STATUS:", res.status, "LEN:", html.length);
        
        let finalTime = time;
        const timeMatch = html.match(/\b\d{1,2}\.\d{2}\s*(am|pm)\b/i);
        if (timeMatch) finalTime = timeMatch[0];
        
        if (html.includes("404")) {
          console.log("❌ 404 - Bus not available");
          continue;
        }
        
        const cards = html.split('<div class="bus-card">').slice(1);
        let matched = null;
        
        for (const card of cards) {
          const cleanText = card
            .replace(/<[^>]*>/g, "")
            .replace(/\s+/g, " ")
            .trim();
          
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
        
        if (matched) {
          // ✅ Simplified message format to avoid encoding issues
          let message = `🚌 Bus Found!\n\n`;
          message += `📅 Date: ${today}\n`;
          message += `⏰ Time: ${finalTime}\n`;
          
          if (/^[0-9]+[A-Z]?$/.test(matched.busNumber)) {
            message += `🚌 Bus No: ${matched.busNumber}\n`;
          }
          
          message += `\n🛣 Route:\n${matched.route}\n\n`;
          message += `🔍 Found by: ${matched.foundBy}`;
          
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

async function testTelegram() {
  console.log("\n🧪 Testing Telegram connection...");
  console.log("Token:", TELEGRAM_TOKEN ? "✅ Set" : "❌ Missing");
  console.log("Chat ID:", CHAT_ID ? `✅ ${CHAT_ID}` : "❌ Missing");
  
  try {
    const testMsg = "✅ Bot is working! Bus checker started.";
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: testMsg
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log("✅ Telegram test successful!");
    } else {
      console.error("❌ Telegram test failed:");
      console.error("Status:", response.status);
      console.error("Error:", data);
      console.error("\n⚠️ Common fixes:");
      console.error("1. Make sure you've started a chat with your bot");
      console.error("2. Verify your CHAT_ID is correct (should be a number)");
      console.error("3. Check your TG_TOKEN is valid");
    }
  } catch (err) {
    console.error("❌ Telegram connection error:", err.message);
  }
  console.log("");
}

async function sendTelegram(message) {
  try {
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message,
        parse_mode: "HTML"  // ✅ Added for better emoji support
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error("❌ Telegram API Error:");
      console.error("Status:", response.status);
      console.error("Response:", data);
      throw new Error(`Telegram API error: ${response.status} - ${data.description || 'Unknown'}`);
    }
  } catch (err) {
    console.error("❌ Failed to send Telegram:", err.message);
    throw err;
  }
}

run().catch(err => {
  console.error("💥 FATAL:", err);
  process.exit(1);
});
```

---

## **Steps to Fix:**

### **1. Verify Your Secrets in GitHub**

Go to your repo → **Settings** → **Secrets and variables** → **Actions**

Make sure you have:
- `TG_TOKEN` = Your bot token (looks like `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)
- `CHAT_ID` = Your chat ID (should be just the number: `8501660956`)

### **2. Make Sure You've Started Chat with Your Bot**

1. Open Telegram
2. Search for your bot (the name you gave it when creating with @BotFather)
3. Click **START** button
4. Send any message like "Hi"

### **3. Verify Your Chat ID**

Send a message to your bot, then visit:
```
https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates
