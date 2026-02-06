async function main() {
  const url = "https://rectransport.com/xam/feb06x10.php";

  const res = await fetch(url);
  console.log("HTTP STATUS:", res.status);

  const html = await res.text();
  console.log("HTML LENGTH:", html.length);

  if (html.length < 500) {
    throw new Error("Page too small — blocked or empty");
  }

  console.log("PAGE FETCH OK");
}

main().catch(err => {
  console.error("ERROR:", err);
  process.exit(1);
});
