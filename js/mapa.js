// --- Inicialização e criação do mapa ---

function inicializarMapa() {
    atualizarStatus('Inicializando mapa...');
    if (typeof L === 'undefined') return atualizarStatus('Leaflet não carregado', 'error');
    criarMapa();
    atualizarStatus('Mapa inicializado com sucesso!', 'success');
}

function criarMapa() {
    const centroCidade = [-22.9663, -42.0278];
    const zoomInicial = 13;

    map = L.map('map').setView(centroCidade, zoomInicial);

    // Camadas base
    openStreetMap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18
    });
    satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: '© Esri, DigitalGlobe, GeoEye, Earthstar Geographics',
        maxZoom: 18
    });
    cartoLight = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap contributors, © CARTO',
        maxZoom: 18
    });
    cartoDark = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap contributors, © CARTO',
        maxZoom: 18
    });

    openStreetMap.addTo(map);

    L.marker(centroCidade)
        .addTo(map)
        .bindPopup('<strong>Arraial do Cabo - RJ</strong><br>Centro da cidade')
        .openPopup();

    const estilos = {
        uf: { color: '#2980b9', weight: 8, opacity: 1, fillColor: '#2980b9', fillOpacity: 0.05 },
        municipio: { color: '#27ae60', weight: 6, opacity: 1, fillColor: '#27ae60', fillOpacity: 0.1 },
        limites: { color: '#9b59b6', weight: 5, opacity: 1, fillColor: '#9b59b6', fillOpacity: 0.08 },
        relevo: { color: '#8b4513', weight: 2, opacity: 0.8, fillColor: '#d2b48c', fillOpacity: 0.3 },
        logradouros: { color: '#f39c12', weight: 4, opacity: 1 },
        bairros: { color: '#e74c3c', weight: 3, opacity: 1, fillColor: '#e74c3c', fillOpacity: 0.15, dashArray: '5,5' }
    };

    const overlayIBGE = {};
    const overlayPMAC = {};

    Promise.all([
        carregarGeoJSONComDetalhes('uf_ibge.geojson', estilos.uf, 'Limite Estadual IBGE', 'uf'),
        carregarGeoJSONComDetalhes('limite_ibge.geojson', estilos.municipio, 'Limite Municipal IBGE', 'municipio'),
        carregarGeoJSONComDetalhes('logradouros_ibge.geojson', estilos.logradouros, 'Logradouros IBGE', 'logradouros'),
        carregarGeoJSONComDetalhes('relevo_ibge.geojson', estilos.relevo, 'Relevo IBGE', 'relevo')
    ]).then(layersIBGE => {

        const nomesCamadasIBGE = ['🗾 Limite Estadual', '🗺️ Limite Municipal', '🛣️ Logradouros', '⛰️ Relevo'];
        layersIBGE.forEach((layer, idx) => {
            if (layer) overlayIBGE[nomesCamadasIBGE[idx]] = layer;
        });

        // PMAC Dados Gerais
        Promise.all([
            carregarGeoJSONComDetalhes('pmac_dados1.geojson', { color: '#e67e22', weight: 3, opacity: 0.9, fillColor:'#e67e22', fillOpacity:0.4 }, 'PMAC Dados 1', 'pmac1'),
            carregarGeoJSONComDetalhes('pmac_dados2.geojson', { color: '#c0392b', weight: 3, opacity: 0.9, fillColor:'#c0392b', fillOpacity:0.4 }, 'PMAC Dados 2', 'pmac2')
        ]).then(layersPMAC => {
            const nomesCamadasPMAC = ['📍 PMAC Dados 1', '📍 PMAC Dados 2'];
            layersPMAC.forEach((layer, idx) => {
                if (layer) overlayPMAC[nomesCamadasPMAC[idx]] = layer;
            });

            // PMAC - Zoneamentos
            const overlayZoneamentosPMAC = {};
            const zoneamentoFiles = [
                { file: 'geojson/zona_zcvs.geojson',   name: 'Zona ZCVS',   color: '#FF7800' },
                { file: 'geojson/zona_zeds.geojson',   name: 'Zona ZEDS',   color: '#3498db' },
                { file: 'geojson/zona_zeis.geojson',   name: 'Zona ZEIS',   color: '#2ecc71' },
                { file: 'geojson/zona_zen.geojson',    name: 'Zona ZEN',    color: '#8e44ad' },
                { file: 'geojson/zona_zep.geojson',    name: 'Zona ZEP',    color: '#27ae60' },
                { file: 'geojson/zona_zh.geojson',     name: 'Zona ZH',     color: '#c0392b' },
                { file: 'geojson/zona_zic.geojson',    name: 'Zona ZIC',    color: '#f39c12' },
                { file: 'geojson/zona_zie.geojson',    name: 'Zona ZIE',    color: '#d35400' },
                { file: 'geojson/zona_zoc.geojson',    name: 'Zona ZOC',    color: '#1abc9c' },
                { file: 'geojson/zona_zo.geojson',     name: 'Zona ZO',     color: '#9b59b6' },
                { file: 'geojson/zona_zp.geojson',     name: 'Zona ZP',     color: '#34495e' },
                { file: 'geojson/zona_zport.geojson',  name: 'Zona ZPORT',  color: '#2c3e50' },
                { file: 'geojson/zona_zpvs.geojson',   name: 'Zona ZPVS',   color: '#16a085' },
                { file: 'geojson/zona_zr.geojson',     name: 'Zona ZR',     color: '#e74c3c' },
                { file: 'geojson/zona_zuc.geojson',    name: 'Zona ZUC',    color: '#8e44ad' },
                { file: 'geojson/zona_zuesp.geojson',  name: 'Zona ZUESP',  color: '#2980b9' },
                { file: 'geojson/zona_zur2.geojson',   name: 'Zona ZUR2',   color: '#7f8c8d' }
            ];

            Promise.all(
                zoneamentoFiles.map(z =>
                    carregarGeoJSONComDetalhes(z.file, { color: z.color, weight: 2, fillOpacity: 0.3 }, z.name, 'zoneamento')
                        .then(layer => {
                            if (layer) overlayZoneamentosPMAC[z.name] = layer;
                        })
                )
            ).then(() => {
                // Controles principais base e IBGE
                const baseMaps = {
                    "🗺️ OpenStreetMap": openStreetMap,
                    "🛰️ Imagem de Satélite": satelliteLayer,
                    "🌅 Carto Light": cartoLight,
                    "🌃️ Carto Dark": cartoDark
                };

                const controlIBGE = L.control.layers(baseMaps, overlayIBGE, { collapsed: false });
                const controlPMAC = L.control.layers(null, overlayPMAC, { collapsed: false });
                const controlZoneamentosPMAC = L.control.layers(null, overlayZoneamentosPMAC, { collapsed: true });

                controlIBGE.addTo(map);
                controlPMAC.addTo(map);
                controlZoneamentosPMAC.addTo(map);

                // Atualiza menu lateral personalizado
                const camadasList = document.getElementById('camadasList');
                camadasList.innerHTML = '';

                const titleBase = document.createElement('h5');
                titleBase.textContent = 'Mapas Base';
                camadasList.appendChild(titleBase);
                camadasList.appendChild(controlIBGE.getContainer().querySelector('.leaflet-control-layers-base'));

                const titleIBGE = document.createElement('h5');
                titleIBGE.textContent = 'IBGE - Dados Abertos';
                camadasList.appendChild(titleIBGE);
                camadasList.appendChild(controlIBGE.getContainer().querySelector('.leaflet-control-layers-overlays'));

                const titlePMAC = document.createElement('h5');
                titlePMAC.textContent = 'PMAC - Dados Coletados';
                camadasList.appendChild(titlePMAC);
                camadasList.appendChild(controlPMAC.getContainer().querySelector('.leaflet-control-layers-overlays'));

                const titleZoneamentos = document.createElement('h5');
                titleZoneamentos.textContent = 'PMAC - Zoneamentos';
                camadasList.appendChild(titleZoneamentos);
                camadasList.appendChild(controlZoneamentosPMAC.getContainer().querySelector('.leaflet-control-layers-overlays'));

                aplicarCoresLabels();
                atualizarDiagnostico();
            });
        });
    });

    // Escala e clique para coordenadas
    L.control.scale({ position: 'bottomleft', metric: true, imperial: false }).addTo(map);
    map.on('click', e => {
        L.popup()
            .setLatLng(e.latlng)
            .setContent(`<div style="font-family: monospace; font-size: 12px;">
                            <strong>Coordenadas SIRGAS 2000:</strong><br>
                            <strong>Lat:</strong> ${e.latlng.lat.toFixed(6)}°<br>
                            <strong>Lng:</strong> ${e.latlng.lng.toFixed(6)}°
                         </div>`)
            .openOn(map);
    });
}
