// ========================================
// 2D SU KAYNAKLARI HARİTASI
// ========================================

// ========================================
// GLOBAL DEĞİŞKENLER
// ========================================

let map = null;
let reserveChart = null;
let usageChart = null;
let currentLayer = null;

// ========================================
// YARDIMCI FONKSİYONLAR
// ========================================

const el = (id) => document.getElementById(id);
const fmtNum = (n) => (typeof n === "number" ? n.toLocaleString("tr-TR") : "—");

// ========================================
// HARİTA BAŞLATMA
// ========================================

function initMap() {
  map = L.map("map").setView([20, 0], 2);
  
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 7,
    attribution: "&copy; OpenStreetMap"
  }).addTo(map);
  
  console.log('✅ 2D harita başlatıldı');
}

// ========================================
// ISO KODU BULMA
// ========================================

function getISO2(props) {
  const keys = ["ISO_A2", "iso_a2", "ISO2", "ISO_2", "WB_A2"];
  
  for (const k of keys) {
    if (props && props[k] && props[k] !== "-99") {
      return String(props[k]).toLowerCase();
    }
  }
  
  // ISO_A3 varsa dönüştür
  const a3 = props?.ISO_A3 || props?.ADM0_A3 || props?.iso_a3;
  const mapA3 = {
    TUR: "tr", USA: "us", BRA: "br", CAN: "ca", EGY: "eg",
    SAU: "sa", RUS: "ru", CHN: "cn", IND: "in", DEU: "de",
    FRA: "fr", GBR: "gb", JPN: "jp", AUS: "au", ZAF: "za"
  };
  
  if (a3 && mapA3[a3.toUpperCase()]) {
    return mapA3[a3.toUpperCase()];
  }
  
  return null;
}

// İsimden ISO2 tahmini
function guessISO2FromName(name = "") {
  const t = name.toLowerCase();
  const map = {
    "turkey": "tr", "türkiye": "tr", "united states": "us", "usa": "us",
    "brazil": "br", "canada": "ca", "egypt": "eg", "saudi arabia": "sa",
    "russia": "ru", "china": "cn", "india": "in", "germany": "de",
    "france": "fr", "united kingdom": "gb", "spain": "es", "italy": "it",
    "japan": "jp", "south korea": "kr", "mexico": "mx", "australia": "au"
  };
  return map[t] || null;
}

// ========================================
// GRAFİK ÇİZİMİ (GEÇİCİ VERİ)
// ========================================

function renderTemporaryCharts(countryName) {
  const yearNow = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => yearNow - 9 + i);
  
  // Rastgele ama tutarlı veri üret
  const baseReserve = 50 + Math.random() * 400;
  const reserve = years.map(() => Math.round(baseReserve + (Math.random() - 0.5) * 50));
  
  const tarim = 40 + Math.floor(Math.random() * 40);
  const icme = 10 + Math.floor(Math.random() * 30);
  const sanayi = 100 - tarim - icme;
  
  // Rezerv grafiği
  if (reserveChart) reserveChart.destroy();
  
  const ctx1 = el("reserveChart").getContext("2d");
  reserveChart = new Chart(ctx1, {
    type: "line",
    data: {
      labels: years,
      datasets: [{
        label: "Rezerv (km³)",
        data: reserve,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.3,
        fill: true
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: true },
        title: { display: true, text: 'Son 10 Yıl Tatlı Su Rezervi' }
      },
      scales: {
        y: { title: { display: true, text: 'km³' }, beginAtZero: false }
      }
    }
  });
  
  // Kullanım grafiği
  if (usageChart) usageChart.destroy();
  
  const ctx2 = el("usageChart").getContext("2d");
  usageChart = new Chart(ctx2, {
    type: "doughnut",
    data: {
      labels: ['Tarım', 'İçme Suyu', 'Sanayi'],
      datasets: [{
        data: [tarim, icme, sanayi],
        backgroundColor: ['#10b981', '#3b82f6', '#f59e0b'],
        borderWidth: 2,
        borderColor: '#fff'
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom' },
        title: { display: true, text: 'Su Kullanım Alanları (%)' },
        tooltip: {
          callbacks: {
            label: (ctx) => ctx.label + ': %' + ctx.parsed
          }
        }
      }
    }
  });
}

// ========================================
// ÜLKE BİLGİLERİNİ GÖSTER
// ========================================

function showCountryInfo(p) {
const panel = document.getElementById("info");
if (panel) panel.style.display = "block";
const el = (id) => document.getElementById(id);

// Başlığı hemen göster
el("country-name") && (el("country-name").textContent = (p && p.name) || "Ülke");

// Eğer JSON daha önce geldiyse paneli onunla doldur
if (window.__lastCountryJson) {
  if (typeof applyCountryDataToPanel === "function") applyCountryDataToPanel(window.__lastCountryJson);
  return;
}

// JSON gelene kadar yer tutucu
el("pop") && (el("pop").textContent = "—");
el("gdp") && (el("gdp").textContent = "—");
el("score") && (el("score").textContent = "—");
el("water-text") && (el("water-text").textContent = (p && p.waterResources) || "Bilgi yükleniyor…");

}


// Global yap

function callCountryLoaderFromProps(props){
  try{
    const iso2 = getISO2(props) || guessISO2FromName(props.name);
    if (window.loadCountryDataSmart){
      window.loadCountryDataSmart(iso2, props.name);
    } else if (window.loadCountryData){
      window.loadCountryData(iso2 || (props.name||"").toLowerCase());
    }
  }catch(e){ console.warn('Loader çağırılamadı:', e); }
}

window.showCountryInfo = showCountryInfo;

// ========================================
// BİLGİLERİ SIFIRLA
// ========================================

function resetInfo() {
  // Paneli gizle
  const infoPanel = el('info');
  if (infoPanel) infoPanel.style.display = 'none';
  
  // Bilgileri temizle
  el("country-name").textContent = "Dünya Su Kaynakları";
  el("pop").textContent = "—";
  el("gdp").textContent = "—";
  el("score").textContent = "—";
  el("water-text").textContent = "Bir ülkeye tıklayarak bilgi alın.";
  
  const flag = el("flag");
  if (flag) flag.style.display = "none";
  
  // Grafikleri yok et
  if (reserveChart) {
    reserveChart.destroy();
    reserveChart = null;
  }
  if (usageChart) {
    usageChart.destroy();
    usageChart = null;
  }
  
  // 2D haritayı dünya görünümüne çek
  if (map) {
    map.setView([20, 0], 2, {
      animate: true,
      duration: 1.5
    });
    console.log('🗺️ 2D harita sıfırlandı');
  }
}

// Global yap

function callCountryLoaderFromProps(props){
  try{
    const iso2 = getISO2(props) || guessISO2FromName(props.name);
    if (window.loadCountryDataSmart){
      window.loadCountryDataSmart(iso2, props.name);
    } else if (window.loadCountryData){
      window.loadCountryData(iso2 || (props.name||"").toLowerCase());
    }
  }catch(e){ console.warn('Loader çağırılamadı:', e); }
}

window.resetInfo = resetInfo;

// ========================================
// GEOJSON YÜKLEME VE ETKİLEŞİM
// ========================================

function loadGeoJSON() {
  console.log('📍 GeoJSON yükleniyor...');
  
  fetch("world.json")
    .then(r => r.json())
    .then(data => {
      console.log('✅ GeoJSON yüklendi');
      
      // Ülke verilerini global yap (3D için)
      window.countryData = {};
      
      currentLayer = L.geoJSON(data, {
        style: (feature) => {
          const score = feature.properties?.waterScore ?? 5;
          return {
            color: "#3d4a5a",
            weight: 1,
            fillOpacity: 0.7,
            fillColor: score >= 8 ? "#10b981" : score >= 5 ? "#f59e0b" : "#ef4444"
          };
        },
        onEachFeature: (feature, layer) => {
          const props = feature.properties || {};
          
          // 3D için veri kaydet
          const iso2 = getISO2(props) || guessISO2FromName(props.name);
          if (iso2 && props.name) {
            window.countryData[iso2] = {
              name: props.name,
              coords: [0, 0], // GeoJSON'dan hesaplanacak
              waterScore: props.waterScore || 5,
              population: props.population,
              gdp: props.gdp,
              waterResources: props.waterResources,
              properties: props
            };
          }
          
          // Tıklama olayı
          layer.on("click", () => { const p=document.getElementById("info"); if(p) p.style.display="block"; const n=document.getElementById("country-name"); if(n) n.textContent=props.name||"Ülke"; callCountryLoaderFromProps(props); callCountryLoaderFromProps(props); try {
              map.fitBounds(layer.getBounds(), {
                maxZoom: 5,
                padding: [10, 10],
                animate: true,
                duration: 1.5
              });
            } catch (e) {
              console.warn('⚠️ Yakınlaştırma hatası:', e);
            }
          });
          
          // Tooltip
          layer.bindTooltip(props?.name || "", {
            sticky: true,
            opacity: 0.9,
            direction: "center"
          });
        }
      }).addTo(map);
      
      console.log(`✅ ${Object.keys(window.countryData).length} ülke verisi hazır`);
      
    })
    .catch(err => {
      console.error("❌ GeoJSON yüklenemedi:", err);
      el("water-text").textContent = "Harita verileri yüklenemedi.";
    });
}

// ========================================
// BAŞLATMA
// ========================================

document.addEventListener('DOMContentLoaded', function() {
  initMap();
  loadGeoJSON();
  console.log('✅ 2D sistem başlatıldı');
});