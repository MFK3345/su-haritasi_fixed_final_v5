// ========================================
// SU HARİTASI ÇİZİM SİSTEMİ
// ========================================

// ========================================
// ÜLKE VERİSİ YÜKLEYİCİ
// ========================================

async function loadCountryData(countryCode) {
  try {
    const path = `./countries/${countryCode.toLowerCase()}.json`;
    const response = await fetch(path);
    if (!response.ok) throw new Error(`❌ ${countryCode} verisi yüklenemedi (${path})`);

    const countryData = await response.json();
    console.log(`✅ ${countryCode} verisi yüklendi:`, countryData.name);

    // JSON yüklendikten sonra çizimi başlat
    drawCountryWaterMap("country-watermap-canvas", countryData, "grid"); applyCountryDataToPanel(countryData);
} catch (err) {
    console.error("Veri yükleme hatası:", err);
  }
}


// Akıllı yükleyici: ISO2 ve isim fallback'leri ile dosya bulur
async function loadCountryDataSmart(iso2, nameGuess) {
  const norm = (s) => (s || "").toLowerCase().replace(/\s+/g, "-").replace(/[^a-zğüşiıöç\-]/g, "");
  const candidates = [];
  const aliases = {
    "us": "usa",
    "gb": "uk",
    "tr": "turkey",
    "de": "germany",
    "es": "es",
    "fr": "france"
  };
  if (iso2) {
    candidates.push(`./countries/${iso2.toLowerCase()}.json`);
    if (aliases[iso2.toLowerCase()]) candidates.push(`./countries/${aliases[iso2.toLowerCase()]}.json`);
  }
  if (nameGuess) {
    candidates.push(`./countries/${norm(nameGuess)}.json`);
  }
  // Son olarak 'türkiye' gibi TR yerel adlarını da deneyelim
  const trMap = { "türkiye":"turkey", "united states":"usa", "united kingdom":"uk" };
  const low = (nameGuess||"").toLowerCase();
  if (trMap[low]) candidates.push(`./countries/${trMap[low]}.json`);

  let lastErr = null;
  for (const path of candidates) {
    try {
      const resp = await fetch(path);
      if (resp.ok) {
        const countryData = await resp.json();
        console.log(`✅ Yüklendi: ${path}`);
        drawCountryWaterMap("country-watermap-canvas", countryData, "grid"); applyCountryDataToPanel(countryData);
return countryData;
      }
      lastErr = `HTTP ${resp.status}`;
    } catch(e) {
      lastErr = e.message;
    }
  }
  console.warn("❌ Ülke JSON bulunamadı. Denenen yollar:", candidates);
  const cnv = document.getElementById("country-watermap-canvas");
  if (cnv && typeof window.drawCountryWaterMap === "function") {
    window.drawCountryWaterMap("country-watermap-canvas", { name: nameGuess || (iso2||"").toUpperCase(), waterData: { bolgeler: [] } }, "grid");
  }
  return null;
}

// Global erişim
window.loadCountryData = loadCountryData;
window.loadCountryDataSmart = loadCountryDataSmart;


// ========================================
// PANEL GÜNCELLEME (JSON ÖNCELİKLİ)
// ========================================
function applyCountryDataToPanel(countryData) {
  const el = (id) => document.getElementById(id);
  window.__lastCountryJson = countryData; // Son JSON'u sakla

  if (!countryData) return;
  el("country-name") && (el("country-name").textContent = countryData.name || countryData.nameEn || "Ülke");

  const pop = countryData.population;
  const gdp = countryData.gdp;
  const score = countryData.waterScore;

  el("pop")   && (el("pop").textContent   = (typeof pop === "number"  ? pop.toLocaleString("tr-TR") : "—"));
  el("gdp")   && (el("gdp").textContent   = (typeof gdp === "number"  ? gdp.toLocaleString("tr-TR") + " $" : "—"));
  el("score") && (el("score").textContent = (typeof score === "number" ? score : "—"));
  el("water-text") && (el("water-text").textContent = countryData.info?.genel || "Ülke hakkında bilgi eklenmemiş.");
  
  // Bayrak
  const flag = el("flag");
  const iso2 = (countryData.code || "").toLowerCase();
  if (flag) {
    if (iso2) {
      flag.src = `https://flagcdn.com/w40/${iso2}.png`;
      flag.style.display = "inline-block";
    } else {
      flag.style.display = "none";
    }
  }
}
window.applyCountryDataToPanel = applyCountryDataToPanel;

// ========================================
// AKILLI YÜKLEYİCİ (ISO2 + İsim fallback)
// ========================================
async function loadCountryDataSmart(iso2, nameGuess) {
  const norm = (s) => (s || "").toLowerCase().replace(/\s+/g, "-").replace(/[^a-zğüşiıöç\-]/g, "");
  const candidates = [];
  const aliases = { "us": "usa", "gb": "uk", "tr": "turkey", "de": "germany", "es":"spain", "fr":"france", "it":"italy" };
  if (iso2) {
    candidates.push(`./countries/${iso2.toLowerCase()}.json`);
    if (aliases[iso2.toLowerCase()]) candidates.push(`./countries/${aliases[iso2.toLowerCase()]}.json`);
  }
  if (nameGuess) {
    candidates.push(`./countries/${norm(nameGuess)}.json`);
  }
  const trMap = { "türkiye":"turkey", "united states":"usa", "united kingdom":"uk", "almanya":"germany", "ispanya":"spain", "fransa":"france", "italya":"italy" };
  const low = (nameGuess||"").toLowerCase();
  if (trMap[low]) candidates.push(`./countries/${trMap[low]}.json`);

  let lastErr = null;
  for (const path of candidates) {
    try {
      const resp = await fetch(path);
      if (resp.ok) {
        const countryData = await resp.json();
        console.log(`✅ Yüklendi: ${path}`);
        drawCountryWaterMap("country-watermap-canvas", countryData, "grid"); applyCountryDataToPanel(countryData);
applyCountryDataToPanel(countryData);
        return countryData;
      }
      lastErr = `HTTP ${resp.status}`;
    } catch(e) {
      lastErr = e.message;
    }
  }
  console.warn("❌ Ülke JSON bulunamadı. Denenen yollar:", candidates, "Hata:", lastErr);
  const cnv = document.getElementById("country-watermap-canvas");
  if (cnv && typeof window.drawCountryWaterMap === "function") {
    window.drawCountryWaterMap("country-watermap-canvas", { name: nameGuess || (iso2||"").toUpperCase(), waterData: { bolgeler: [] } }, "grid");
  }
  return null;
}
window.loadCountryDataSmart = loadCountryDataSmart;

// ========================================
// WATERMAPDRAWER SINIFI (orijinal kodun)
// ========================================

class WaterMapDrawer {
  constructor(canvasId, width = 600, height = 400) {
    this.canvas = document.getElementById(canvasId);
    
    if (!this.canvas) {
      console.error(`❌ Canvas bulunamadı: ${canvasId}`);
      return;
    }
    
    this.ctx = this.canvas.getContext('2d');
    this.width = width;
    this.height = height;
    this.canvas.width = width;
    this.canvas.height = height;
    
    console.log(`✅ WaterMapDrawer hazır: ${width}x${height}`);
  }

  drawWaterMap(countryData) {
    if (!this.ctx) return;
    
    const { bolgeler } = countryData.waterData;
    
    if (!bolgeler || bolgeler.length === 0) {
      this.drawNoData(countryData.name);
      return;
    }
    
    this.ctx.fillStyle = '#f8fafc';
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    this.drawTitle(countryData.name);
    this.drawRegionsGrid(bolgeler);
    this.drawLegend();
    
    console.log(`✅ ${countryData.name} su haritası çizildi`);
  }

  drawTitle(countryName) {
    this.ctx.fillStyle = '#0f172a';
    this.ctx.font = 'bold 22px Arial, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`${countryName}`, this.width / 2, 35);
    
    this.ctx.font = '14px Arial, sans-serif';
    this.ctx.fillStyle = '#64748b';
    this.ctx.fillText('Bölgesel Su Dağılımı', this.width / 2, 55);
  }

  drawRegionsGrid(bolgeler) {
    const cols = Math.min(3, bolgeler.length);
    const rows = Math.ceil(bolgeler.length / cols);
    
    const startY = 80;
    const gridHeight = this.height - startY - 50;
    
    const boxWidth = (this.width - 60) / cols;
    const boxHeight = gridHeight / rows;
    
    bolgeler.forEach((bolge, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      
      const x = 30 + col * boxWidth;
      const y = startY + row * boxHeight;
      
      this.drawRegionBox(x, y, boxWidth - 15, boxHeight - 15, bolge);
    });
  }

  drawRegionBox(x, y, width, height, bolge) {
    const { isim, yagis, nehirler, barajlar, risk } = bolge;
    
    const colors = {
      'dusuk': { bg: '#d1fae5', border: '#10b981', text: '#065f46' },
      'orta': { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
      'yuksek': { bg: '#fee2e2', border: '#ef4444', text: '#991b1b' }
    };
    
    const color = colors[risk] || colors['orta'];
    
    this.ctx.fillStyle = color.bg;
    this.ctx.fillRect(x, y, width, height);
    
    this.ctx.strokeStyle = color.border;
    this.ctx.lineWidth = 2.5;
    this.ctx.strokeRect(x, y, width, height);
    
    this.ctx.fillStyle = color.text;
    this.ctx.font = 'bold 13px Arial, sans-serif';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(isim, x + 10, y + 22);
    
    this.ctx.font = '11px Arial, sans-serif';
    this.ctx.fillStyle = '#1e293b';
    
    this.ctx.fillText(`💧 ${yagis} mm/yıl`, x + 10, y + 42);
    
    if (nehirler && nehirler.length > 0) {
      this.ctx.fillText(`🌊 ${nehirler.length} nehir`, x + 10, y + 60);
    }
    
    if (barajlar && barajlar.length > 0) {
      this.ctx.fillText(`🏗️ ${barajlar.length} baraj`, x + 10, y + 78);
    }
  }

  drawLegend() {
    const y = this.height - 25;
    
    this.ctx.font = 'bold 11px Arial, sans-serif';
    this.ctx.fillStyle = '#475569';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('Risk Seviyesi:', 30, y);
    
    this.ctx.fillStyle = '#10b981';
    this.ctx.fillRect(125, y - 12, 18, 14);
    this.ctx.fillStyle = '#475569';
    this.ctx.font = '10px Arial, sans-serif';
    this.ctx.fillText('Düşük', 148, y);
    
    this.ctx.fillStyle = '#f59e0b';
    this.ctx.fillRect(200, y - 12, 18, 14);
    this.ctx.fillStyle = '#475569';
    this.ctx.fillText('Orta', 223, y);
    
    this.ctx.fillStyle = '#ef4444';
    this.ctx.fillRect(270, y - 12, 18, 14);
    this.ctx.fillStyle = '#475569';
    this.ctx.fillText('Yüksek', 293, y);
  }

  drawNoData(countryName) {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0, '#f1f5f9');
    gradient.addColorStop(1, '#e2e8f0');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    this.ctx.fillStyle = '#64748b';
    this.ctx.font = 'bold 18px Arial, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`${countryName}`, this.width / 2, this.height / 2 - 20);
    
    this.ctx.font = '14px Arial, sans-serif';
    this.ctx.fillText('Su haritası verisi henüz eklenmedi', this.width / 2, this.height / 2 + 10);
    
    console.log(`⚠️ ${countryName} için veri yok`);
  }

  drawCircleStyle(countryData) {
    if (!this.ctx) return;
    
    const { bolgeler } = countryData.waterData;
    
    if (!bolgeler || bolgeler.length === 0) {
      this.drawNoData(countryData.name);
      return;
    }
    
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0, '#dbeafe');
    gradient.addColorStop(1, '#bfdbfe');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    this.ctx.fillStyle = '#1e40af';
    this.ctx.font = 'bold 20px Arial, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(countryData.name, this.width / 2, 40);
    
    this.ctx.font = '13px Arial, sans-serif';
    this.ctx.fillStyle = '#3b82f6';
    this.ctx.fillText('Bölgesel Yağış Dağılımı (mm/yıl)', this.width / 2, 60);
    
    const centerX = this.width / 2;
    const centerY = this.height / 2 + 20;
    const radius = Math.min(this.width, this.height) / 3.5;
    
    bolgeler.forEach((bolge, index) => {
      const angle = (index / bolgeler.length) * 2 * Math.PI - Math.PI / 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      const colors = {
        'dusuk': '#10b981',
        'orta': '#f59e0b',
        'yuksek': '#ef4444'
      };
      
      const color = colors[bolge.risk] || '#94a3b8';
      
      this.ctx.beginPath();
      this.ctx.arc(x, y, 35, 0, 2 * Math.PI);
      this.ctx.fillStyle = color;
      this.ctx.fill();
      this.ctx.strokeStyle = '#ffffff';
      this.ctx.lineWidth = 3;
      this.ctx.stroke();
      
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = 'bold 13px Arial, sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(`${bolge.yagis}`, x, y + 5);
      
      const labelX = centerX + Math.cos(angle) * (radius + 55);
      const labelY = centerY + Math.sin(angle) * (radius + 55);
      this.ctx.fillStyle = '#1e293b';
      this.ctx.font = '11px Arial, sans-serif';
      this.ctx.fillText(bolge.isim, labelX, labelY);
    });
    
    console.log(`✅ ${countryData.name} dairesel harita çizildi`);
  }
}

// ========================================
// GLOBAL FONKSİYON
// ========================================

window.drawCountryWaterMap = function(canvasId, countryData, style = 'grid') {
  const drawer = new WaterMapDrawer(canvasId, 600, 400);
  
  if (!drawer.ctx) {
    console.error('❌ Canvas oluşturulamadı');
    return null;
  }
  
  if (style === 'circle') {
    drawer.drawCircleStyle(countryData);
  } else {
    drawer.drawWaterMap(countryData);
  }
  
  return drawer;
};

// ========================================
// KULLANIM ÖRNEĞİ
// ========================================
// loadCountryData('TR'); // Türkiye verisini yükler
// loadCountryData('ES'); // İspanya verisini yükler

console.log('✅ WaterMapDrawer sistemi yüklendi');


// ========================================
// PANEL GÜNCELLEME + GRAFİKLER (JSON ÖNCELİKLİ)
// ========================================
function applyCountryDataToPanel(countryData){
  const el = (id) => document.getElementById(id);
  if(!countryData) return;
  window.__lastCountryJson = countryData;

  el("country-name") && (el("country-name").textContent = countryData.name || countryData.nameEn || "Ülke");
  el("pop") && (el("pop").textContent = (countryData.population ?? 0).toLocaleString("tr-TR"));
  el("gdp") && (el("gdp").textContent = (countryData.gdp ?? 0).toLocaleString("tr-TR") + " $");
  el("score") && (el("score").textContent = (countryData.waterScore ?? "—"));
  el("water-text") && (el("water-text").textContent = countryData.info?.genel || "");

  const flag = el("flag");
  if(flag && countryData.code){
    flag.src = `https://flagcdn.com/w40/${String(countryData.code).toLowerCase()}.png`;
    flag.style.display = "inline-block";
  }

  // Grafikler
  if(countryData.waterData?.rezerv10Yil && typeof window.drawReserveChart === "function"){
    window.drawReserveChart(countryData.waterData.rezerv10Yil);
  }
  if(countryData.waterData?.kullanim && typeof window.drawUsageChart === "function"){
    window.drawUsageChart(countryData.waterData.kullanim);
  }
}
window.applyCountryDataToPanel = applyCountryDataToPanel;

// ========================================
// REZERV GRAFİĞİ (reserveChart)
// ========================================

// ========================================
// DÜZELTİLMİŞ SON 10 YIL GRAFİĞİ
// ========================================

// ========================================
// KÜÇÜK GÖRÜNÜM SON 10 YIL GRAFİĞİ (v4)
// ========================================
window.drawReserveChart = function(res) {
  const canvas = document.getElementById("reserveChart");
  if (!canvas || !res) return;

  if (window._reserveChart) {
    try { window._reserveChart.destroy(); } catch (e) {}
  }

  const years = [...res.years];
  const values = [...res.values];
  if (years[0] > years[years.length - 1]) {
    years.reverse();
    values.reverse();
  }

  window._reserveChart = new Chart(canvas.getContext("2d"), {
    type: "line",
    data: {
      labels: years,
      datasets: [{
        label: "Tatlı Su Rezervi (km³)",
        data: values,
        borderColor: "#2563eb",
        backgroundColor: "rgba(37,99,235,0.2)",
        fill: true,
        tension: 0.3,
        pointBackgroundColor: "#1d4ed8",
        pointRadius: 3,
        pointHoverRadius: 4,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: { top: 5, bottom: 5, left: 5, right: 5 } },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: { label: (ctx) => `${ctx.parsed.y} km³` }
        }
      },
      scales: {
        x: {
          title: { display: true, text: "Yıl", color: "#475569", font: { size: 10 } },
          ticks: { color: "#475569", font: { size: 9 } }
        },
        y: {
          beginAtZero: false,
          title: { display: true, text: "Rezerv (km³)", color: "#475569", font: { size: 10 } },
          ticks: { color: "#475569", font: { size: 9 } },
          grid: { color: "rgba(148,163,184,0.2)" }
        }
      }
    }
  });
};



// ========================================
// KULLANIM GRAFİĞİ (usageChart)
// ========================================
window.drawUsageChart = function(k){
  const canvas = document.getElementById("usageChart");
  if(!canvas || !k) return;
  if(window._usageChart) try{ window._usageChart.destroy(); }catch(e){}
  window._usageChart = new Chart(canvas.getContext("2d"), {
    type: "doughnut",
    data: {
      labels: ["Tarımsal", "Sanayi", "İçme"],
      datasets: [{
        data: [k.tarim, k.sanayi, k.icme],
        backgroundColor: ["#22c55e","#60a5fa","#facc15"]
      }]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });
};
// ========================================
// KÜÇÜK GÖRÜNÜM KULLANIM ALANLARI GRAFİĞİ (v4.1)
// ========================================
window.drawUsageChart = function(kullanim) {
  const canvas = document.getElementById("usageChart");
  if (!canvas || !kullanim) return;

  if (window._usageChart) {
    try { window._usageChart.destroy(); } catch (e) {}
  }

  const labels = ["Tarım", "Sanayi", "İçme"];
  const values = [kullanim.tarim, kullanim.sanayi, kullanim.icme];
  const colors = ["#22c55e", "#3b82f6", "#f97316"];

  window._usageChart = new Chart(canvas.getContext("2d"), {
    type: "doughnut",
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: colors,
        borderColor: "#f1f5f9",
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: { top: 5, bottom: 5 } },
      plugins: {
        legend: {
          position: "bottom",
          labels: { color: "#475569", font: { size: 11 }, padding: 8 }
        },
        tooltip: {
          callbacks: { label: (ctx) => `${ctx.label}: ${ctx.parsed} %` }
        }
      },
      cutout: "70%"
    }
  });
};
