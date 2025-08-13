// --- Inicialização e criação do mapa ---

function inicializarMapa() {
    atualizarStatus('Inicializando mapa...');
    if (typeof L === 'undefined') return atualizarStatus('Leaflet não carregado', 'error');
    criarMapa();
    atualizarStatus('Mapa inicializado com sucesso!', 'success');
}

// mapa.js
function criarMapa() {
    const centroCidade = [-22.9663, -42.0278];
    const zoomInicial = 13;
    map = L.map('map').setView(centroCidade, zoomInicial);

    // Layers base
    openStreetMap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors', maxZoom: 18
    });
    satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: '© Esri', maxZoom: 18
    });
    cartoLight = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap/CARTO', maxZoom: 18
    });
    cartoDark = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap/CARTO', maxZoom: 18
    });

    openStreetMap.addTo(map);

    const estilos = {
        uf: { color: '#2980b9', weight: 8, opacity: 1, fillColor: '#2980b9', fillOpacity: 0.05 },
        municipio: { color: '#27ae60', weight: 6, opacity: 1, fillColor: '#27ae60', fillOpacity: 0.1 },
        logradouros: { color: '#f39c12', weight: 4, opacity: 1 },
        relevo: { color: '#8b4513', weight: 2, opacity: 0.8, fillColor: '#d2b48c', fillOpacity: 0.3 }
    };

    const overlayIBGE = {};
    const overlayPMAC = {};

    Promise.all([
        carregarGeoJSONComDetalhes('geojson/ibge/uf_ibge.geojson', estilos.uf, 'Limite Estadual', 'uf'),
        carregarGeoJSONComDetalhes('geojson/ibge/limite_ibge.geojson', estilos.municipio, 'Limite Municipal', 'municipio'),
        carregarGeoJSONComDetalhes('geojson/ibge/logradouros_ibge.geojson', estilos.logradouros, 'Logradouros', 'logradouros'),
        carregarGeoJSONComDetalhes('geojson/ibge/relevo_ibge.geojson', estilos.relevo, 'Relevo', 'relevo')
    ]).then(layersIBGE => {
        const nomesIBGE = ['Limite Estadual', 'Limite Municipal', 'Logradouros', 'Relevo'];
        layersIBGE.forEach((ly, i) => { if (ly) overlayIBGE[nomesIBGE[i]] = ly; });

        const zoneamentoFiles = [
            { file: 'geojson/pmac-zonas/zona_zcvs.geojson', name: 'Zona ZCVS', color: '#FF7800' },
            { file: 'geojson/pmac-zonas/zona_ec.geojson', name: 'Zona EC', color: '#abcdef' },
            { file: 'geojson/pmac-zonas/zona_zeds.geojson', name: 'Zona ZEDS', color: '#3498db' },
            { file: 'geojson/pmac-zonas/zona_zeis.geojson', name: 'Zona ZEIS', color: '#2ecc71' },
            { file: 'geojson/pmac-zonas/zona_zen.geojson', name: 'Zona ZEN', color: '#8e44ad' },
            { file: 'geojson/pmac-zonas/zona_zep.geojson', name: 'Zona ZEP', color: '#27ae60' },
            { file: 'geojson/pmac-zonas/zona_zh.geojson', name: 'Zona ZH', color: '#c0392b' },
            { file: 'geojson/pmac-zonas/zona_zic.geojson', name: 'Zona ZIC', color: '#f39c12' },
            { file: 'geojson/pmac-zonas/zona_zie.geojson', name: 'Zona ZIE', color: '#d35400' },
            { file: 'geojson/pmac-zonas/zona_zoc.geojson', name: 'Zona ZOC', color: '#1abc9c' },
            { file: 'geojson/pmac-zonas/zona_zo.geojson', name: 'Zona ZO', color: '#9b59b6' },
            { file: 'geojson/pmac-zonas/zona_zp.geojson', name: 'Zona ZP', color: '#34495e' },
            { file: 'geojson/pmac-zonas/zona_zport.geojson', name: 'Zona ZPORT', color: '#2c3e50' },
            { file: 'geojson/pmac-zonas/zona_zpvs.geojson', name: 'Zona ZPVS', color: '#16a085' },
            { file: 'geojson/pmac-zonas/zona_zr.geojson', name: 'Zona ZR', color: '#e74c3c' },
            { file: 'geojson/pmac-zonas/zona_zuc.geojson', name: 'Zona ZUC', color: '#8e44ad' },
            { file: 'geojson/pmac-zonas/zona_zuesp.geojson', name: 'Zona ZUESP', color: '#2980b9' },
            { file: 'geojson/pmac-zonas/zona_zur2.geojson', name: 'Zona ZUR2', color: '#7f8c8d' }
        ];

        return Promise.all(zoneamentoFiles.map(z =>
            carregarGeoJSONComDetalhes(z.file, { color: z.color, weight: 2, fillOpacity: 0.3 }, z.name, 'pmac')
                .then(layer => { if (layer) overlayPMAC[z.name] = layer; })
        )).then(() => {
            totalCamadas = Object.keys(overlayIBGE).length + Object.keys(overlayPMAC).length;
            preencherGruposNoMenu(overlayIBGE, overlayPMAC);
        });
    });

    L.control.scale({ position: 'bottomleft', metric: true }).addTo(map);
    // map.on('click', e => {
    //     L.popup()
    //         .setLatLng(e.latlng)
    //         .setContent(`<div style="font-family: monospace; font-size: 12px;">
    //                         <strong>Coordenadas SIRGAS 2000:</strong><br>
    //                         <strong>Lat:</strong> ${e.latlng.lat.toFixed(6)}°<br>
    //                         <strong>Lng:</strong> ${e.latlng.lng.toFixed(6)}°
    //                      </div>`)
    //         .openOn(map);
    // });
}
