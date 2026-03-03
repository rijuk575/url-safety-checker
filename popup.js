const API_KEY = "YOUR_API_KEY_HERE"; //  replace this

const urlInput = document.getElementById("url-input");
const checkBtn = document.getElementById("check-btn");
const scanTabBtn = document.getElementById("scan-tab");
const resultCard = document.getElementById("result");
const statusBadge = document.getElementById("status-badge");
const scoreEl = document.getElementById("score");
const reasonsEl = document.getElementById("reasons");
const openLink = document.getElementById("open-link");

function normalizeUrl(raw) {
  try {
    return new URL(raw).href;
  } catch {
    return null;
  }
}

function performLocalScan(url) {
  let score = 0;
  const reasons = [];
  const parsed = new URL(url);
  const hostname = parsed.hostname;

  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)) {
    score += 25;
    reasons.push("Uses IP address");
  }

  if (["xyz","ru","tk","ml","ga"].includes(hostname.split(".").pop())) {
    score += 20;
    reasons.push("Suspicious domain");
  }

  if (hostname.split(".").length > 3) {
    score += 15;
    reasons.push("Too many subdomains");
  }

  ["login","verify","update","secure","bank"].forEach(w=>{
    if(url.toLowerCase().includes(w)){
      score += 10;
      reasons.push("Suspicious keyword: " + w);
    }
  });

  if (url.length > 75) {
    score += 10;
    reasons.push("URL too long");
  }

  if (!url.startsWith("https")) {
    score += 20;
    reasons.push("No HTTPS");
  }

  return { score: Math.min(score,100), reasons };
}

async function checkWithVirusTotal(url) {
  try {
    const encoded = btoa(url).replace(/=/g, "");

    await fetch("https://www.virustotal.com/api/v3/urls", {
      method: "POST",
      headers: {
        "x-apikey": API_KEY,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: "url=" + encodeURIComponent(url)
    });

    const res = await fetch(`https://www.virustotal.com/api/v3/urls/${encoded}`, {
      headers: { "x-apikey": API_KEY }
    });

    const data = await res.json();
    return data.data.attributes.last_analysis_stats;

  } catch (e) {
    console.log("VT error", e);
    return null;
  }
}

function renderResult(data, url) {
  resultCard.classList.remove("hidden");
  scoreEl.textContent = data.score;
  openLink.href = url;

  document.getElementById("progress-bar").style.width = data.score + "%";

  reasonsEl.innerHTML = "";
  data.reasons.forEach(r=>{
    const li = document.createElement("li");
    li.textContent = r;
    reasonsEl.appendChild(li);
  });

  if (data.score >= 40) statusBadge.textContent = "High Risk";
  else if (data.score >= 20) statusBadge.textContent = "Suspicious";
  else statusBadge.textContent = "Safe";
}

async function checkUrlFlow(raw) {
  const url = normalizeUrl(raw);
  if (!url) return alert("Invalid URL");

  const local = performLocalScan(url);
  const vt = await checkWithVirusTotal(url);

  if (vt) {
    if (vt.malicious > 0) {
      local.score += 50;
      local.reasons.push("VirusTotal: Malicious");
    }
    if (vt.suspicious > 0) {
      local.score += 20;
      local.reasons.push("VirusTotal: Suspicious");
    }
  }

  local.score = Math.min(local.score,100);
  renderResult(local, url);
}

checkBtn.addEventListener("click", async ()=>{
  await checkUrlFlow(urlInput.value);
});

scanTabBtn.addEventListener("click", async ()=>{
  const [tab] = await chrome.tabs.query({active:true,currentWindow:true});
  if(tab?.url){
    urlInput.value = tab.url;
    await checkUrlFlow(tab.url);
  }
});