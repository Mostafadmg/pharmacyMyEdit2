const files = ["EDM_LOGO.png", "Group_469353.png", "Background_1.png"];
for (const f of files) {
  for (const base of [
    "https://cdn.shopify.com/s/files/1/0935/0479/files/",
    "https://cdn.shopify.com/s/files/1/0935/0479/9065/files/",
  ]) {
    const url = base + f;
    const r = await fetch(url, { method: "HEAD" });
    console.log(r.status, url);
  }
}
