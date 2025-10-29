// ========================================
// 3D SU KAYNAKLARI HARİTASI - YENİ YAPILANDIRMA
// ========================================

let viewer = null;
let currentMode = '2d';
let selectedEntity = null;

// ========================================
// GLOBAL FONKSİYONLAR
// ========================================

window.switchTo2D = switchTo2D;
window.switchTo3D = switchTo3D;

function switchTo2D() {
  currentMode = '2d';
  document.getElementById('map').style.display = 'block';
  document.getElementById('cesiumContainer').style.display = 'none';
  document.getElementById('btn2d').classList.add('active');
  document.getElementById('btn3d').classList.remove('active');
  console.log('✅ 2D moda geçildi');
}

function switchTo3D() {
  currentMode = '3d';
  document.getElementById('map').style.display = 'none';
  document.getElementById('cesiumContainer').style.display = 'block';
  document.getElementById('btn2d').classList.remove('active');
  document.getElementById('btn3d').classList.add('active');
  
  console.log('✅ 3D moda geçiliyor...');
  
  if (!viewer) {
    setTimeout(() => init3DGlobe(), 100);
  }
}

// ========================================
// CESIUM BAŞLATMA
// ========================================

function init3DGlobe() {
  console.log('🌍 Cesium başlatılıyor...');
  
  if (typeof Cesium === 'undefined') {
    console.error('❌ Cesium kütüphanesi yüklenemedi!');
    alert('3D harita yüklenemedi. Lütfen internet bağlantınızı kontrol edin.');
    return;
  }
  
  try {
    // Cesium Ion Token
    Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJlMjYyZjVkYy1mZDE0LTQyYWYtYTIwZS04ODIzMjdiMGU4M2IiLCJpZCI6MzU0NTY4LCJpYXQiOjE3NjE1OTMzNDB9.HIVvpg4rNdwkAnWLgbNgkQr1R-oBNKksU1KK77t5gJ4';

    // Viewer Oluştur
    viewer = new Cesium.Viewer('cesiumContainer', {
      baseLayerPicker: false,
      geocoder: false,
      homeButton: true,
      sceneModePicker: false,
      navigationHelpButton: false,
      fullscreenButton: false,
      infoBox: false,
      selectionIndicator: false,
      animation: false,
      timeline: false
    });

    // Globe ayarları
    viewer.scene.globe.enableLighting = false; // ❌ true yapınca hata veriyor
    viewer.scene.globe.depthTestAgainstTerrain = false;

    // Başlangıç kamera pozisyonu
    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(30, 30, 20000000),
      orientation: {
        heading: 0,
        pitch: Cesium.Math.toRadians(-90),
        roll: 0
      }
    });

    console.log('✅ Cesium başarıyla yüklendi');

    // Ülkeleri yükle
    setTimeout(() => loadCountries(), 300);

  } catch (error) {
    console.error('❌ Cesium hatası:', error);
    alert('3D harita yüklenemedi: ' + error.message);
  }
}

// ========================================
// RENK SİSTEMİ
// ========================================

function getWaterColor(score) {
  if (score >= 8) {
    return Cesium.Color.fromCssColorString('#10b981'); // Yeşil
  } else if (score >= 5) {
    return Cesium.Color.fromCssColorString('#f59e0b'); // Turuncu
  } else {
    return Cesium.Color.fromCssColorString('#ef4444'); // Kırmızı
  }
}

// ========================================
// ÜLKE YÜKLEME
// ========================================

function loadCountries() {
  console.log('📍 Ülkeler yükleniyor...');
  
  fetch('world.json')
    .then(res => res.json())
    .then(geojson => {
      console.log('✅ GeoJSON yüklendi');
      
      let successCount = 0;
      let errorCount = 0;
      
      geojson.features.forEach(feature => {
        try {
          const props = feature.properties;
          const name = props.name || props.NAME || props.ADMIN || "Ülke";
          const panel = document.getElementById("info");
          if (panel) panel.style.display = "block";
          const title = document.getElementById("country-name");
          if (title) title.textContent = name || "Ülke";

          const score = props.waterScore || 5;
          const color = getWaterColor(score);
          
          // Koordinatları işle
          let positions = extractPositions(feature.geometry);
          
          if (positions && positions.length >= 6) {
            // Entity oluştur
            const entity = viewer.entities.add({
              name: name,
              polygon: {
                hierarchy: Cesium.Cartesian3.fromDegreesArray(positions),
                material: color.withAlpha(0.7),
                outline: true,
                outlineColor: Cesium.Color.WHITE.withAlpha(0.6),
                outlineWidth: 1,
                height: 0
              },
              properties: {
                countryName: name,
                waterScore: score,
                population: props.population || props.POP_EST,
                gdp: props.gdp || props.GDP_MD,
                waterResources: props.waterResources || 'Bilgi mevcut değil',
                originalColor: color
              }
            });
            
            successCount++;
          }
        } catch (err) {
          errorCount++;
          console.warn('⚠️ Ülke işlenirken hata:', err.message);
        }
      });
      
      console.log(`✅ ${successCount} ülke yüklendi, ${errorCount} hata`);
      
      // Tıklama sistemi
      setupInteractions();
      
    })
    .catch(err => {
      console.error('❌ GeoJSON yükleme hatası:', err);
    });
}

// ========================================
// KOORDİNAT İŞLEME
// ========================================

function extractPositions(geometry) {
  let ring = null;
  
  if (geometry.type === 'Polygon') {
    ring = geometry.coordinates[0];
  } else if (geometry.type === 'MultiPolygon') {
    // En büyük poligonu bul
    let maxRing = null;
    let maxLen = 0;
    
    geometry.coordinates.forEach(poly => {
      if (poly[0].length > maxLen) {
        maxRing = poly[0];
        maxLen = poly[0].length;
      }
    });
    
    ring = maxRing;
  }
  
  if (!ring || ring.length < 3) return null;
  
  // Basitleştir (max 100 nokta)
  const positions = [];
  const step = Math.max(1, Math.floor(ring.length / 100));
  
  for (let i = 0; i < ring.length; i += step) {
    const coord = ring[i];
    if (coord && coord.length >= 2) {
      positions.push(coord[0]); // lon
      positions.push(coord[1]); // lat
    }
  }
  
  return positions;
}

// ========================================
// ETKİLEŞİM SİSTEMİ
// ========================================

function setupInteractions() {
  const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
  
  // TIKLAMA
  handler.setInputAction((click) => {
    const picked = viewer.scene.pick(click.position);
    
    if (Cesium.defined(picked) && picked.id) {
      handleCountryClick(picked.id);
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  
  // HOVER
  handler.setInputAction((movement) => {
    const picked = viewer.scene.pick(movement.endPosition);
    
    if (Cesium.defined(picked) && picked.id && picked.id.polygon) {
      document.body.style.cursor = 'pointer';
      handleCountryHover(picked.id);
    } else {
      document.body.style.cursor = 'default';
      resetHover();
    }
  }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
}

// ========================================
// TIKLAMA İŞLEMİ
// ========================================

function handleCountryClick(entity) {
  const props = entity.properties;
  const name = props.countryName?._value || entity.name;
  
  
  try {
    const iso2 = (typeof getISO2==='function' && entity.properties) ? getISO2({ISO_A2: entity.properties.iso2?._value}) : (typeof guessISO2FromName==='function' ? guessISO2FromName(name) : null);
    if (window.loadCountryDataSmart) window.loadCountryDataSmart(iso2, name);
  } catch(e){ console.warn('3D loader hata:', e); }
// Önceki seçimi temizle
  if (selectedEntity && selectedEntity.polygon) {
    const oldColor = selectedEntity.properties.originalColor._value;
    selectedEntity.polygon.material = oldColor.withAlpha(0.7);
    selectedEntity.polygon.outlineWidth = 1;
  }
  
  // Yeni seçimi vurgula
  if (entity.polygon) {
    const color = props.originalColor._value;
    entity.polygon.material = color.withAlpha(0.95);
    entity.polygon.outlineColor = Cesium.Color.WHITE;
    entity.polygon.outlineWidth = 3;
  }
  
  selectedEntity = entity;
  
  // Paneli aç
  openInfoPanel(props);
  
  // Ülkeye yakınlaştır (boyutuna göre)
  zoomToCountry(entity);
}

// ========================================
// YAKINLAŞTIRMA SİSTEMİ
// ========================================

function zoomToCountry(entity) {
  try {
    // Ülkenin sınırlarını al
    const positions = entity.polygon.hierarchy._value.positions;
    
    if (!positions || positions.length < 3) {
      console.warn('⚠️ Yakınlaştırma için yeterli koordinat yok');
      return;
    }
    
    // Bounding sphere hesapla
    const boundingSphere = Cesium.BoundingSphere.fromPoints(positions);
    
    // Ülke boyutuna göre mesafe hesapla
    const radius = boundingSphere.radius;
    let distance = radius * 3.5; // Ülkenin 3.5 katı mesafeden bak
    
    // Minimum ve maksimum mesafe sınırları
    distance = Math.max(500000, Math.min(distance, 5000000)); // 500km - 5000km arası
    
    // Kamera açısı ve yönelim
    const center = boundingSphere.center;
    const heading = 0;
    const pitch = Cesium.Math.toRadians(-45); // 45° yukarıdan
    const roll = 0;
    
    // Animasyonlu yakınlaştırma
    viewer.camera.flyToBoundingSphere(boundingSphere, {
      duration: 2.0,
      offset: new Cesium.HeadingPitchRange(heading, pitch, distance)
    });
    
    console.log(`✈️ Yakınlaştırma: ${(distance/1000).toFixed(0)}km mesafeden`);
    
  } catch (error) {
    console.warn('⚠️ Yakınlaştırma hatası:', error.message);
    // Hata olursa basit yakınlaştırma
    viewer.flyTo(entity, {
      duration: 2.0,
      offset: new Cesium.HeadingPitchRange(0, Cesium.Math.toRadians(-45), 2000000)
    });
  }
}

// ========================================
// HOVER İŞLEMİ
// ========================================

let hoveredEntity = null;

function handleCountryHover(entity) {
  if (entity === selectedEntity) return;
  if (entity === hoveredEntity) return;
  
  // Önceki hover'ı temizle
  resetHover();
  
  // Yeni hover
  if (entity.polygon) {
    const color = entity.properties.originalColor._value;
    entity.polygon.material = color.withAlpha(0.85);
    entity.polygon.outlineWidth = 2;
    hoveredEntity = entity;
  }
}

function resetHover() {
  if (hoveredEntity && hoveredEntity !== selectedEntity && hoveredEntity.polygon) {
    const color = hoveredEntity.properties.originalColor._value;
    hoveredEntity.polygon.material = color.withAlpha(0.7);
    hoveredEntity.polygon.outlineWidth = 1;
    hoveredEntity = null;
  }
}

// ========================================
// PANEL SİSTEMİ
// ========================================

function openInfoPanel(props) {
  const panel = document.getElementById('info');
  if (!panel) return;
  
  panel.style.display = 'block';
  
  const countryInfo = {
    name: props.countryName?._value || 'Unknown',
    population: props.population?._value,
    gdp: props.gdp?._value,
    waterScore: props.waterScore?._value || 5,
    waterResources: props.waterResources?._value || 'Bilgi mevcut değil'
  };
  
  // showCountryInfo fonksiyonunu çağır
  if (typeof window.showCountryInfo === 'function') {
    window.showCountryInfo(countryInfo);
    console.log('✅ Panel güncellendi');
  } else {
    console.error('❌ showCountryInfo bulunamadı');
  }
}

// ========================================
// RESET FONKSİYONU
// ========================================

window.resetInfo = function() {
  const panel = document.getElementById('info');
  if (panel) panel.style.display = 'none';
  
  // Seçimi temizle
  if (selectedEntity && selectedEntity.polygon) {
    const color = selectedEntity.properties.originalColor._value;
    selectedEntity.polygon.material = color.withAlpha(0.7);
    selectedEntity.polygon.outlineWidth = 1;
    selectedEntity = null;
  }
  
  // 3D modda kamerayı dünya görünümüne döndür
  if (viewer && currentMode === '3d') {
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(30, 30, 20000000),
      duration: 2.0,
      orientation: {
        heading: 0,
        pitch: Cesium.Math.toRadians(-90),
        roll: 0
      }
    });
    console.log('🌍 Kamera dünya görünümüne döndü');
  }
  
  // Bilgileri sıfırla
  const elements = {
    'country-name': 'Dünya Su Kaynakları',
    'pop': '—',
    'gdp': '—',
    'score': '—',
    'water-text': 'Bir ülkeye tıklayarak bilgi alın.'
  };
  
  Object.keys(elements).forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = elements[id];
  });
  
  const flag = document.getElementById('flag');
  if (flag) flag.style.display = 'none';
  
  console.log('✅ Panel sıfırlandı');
}

// ========================================
// BAŞLATMA
// ========================================

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    switchTo2D();
    console.log('✅ Sayfa yüklendi, 2D aktif');
  });
} else {
  switchTo2D();
  console.log('✅ 2D aktif');
}