// --- Inicialização e criação do mapa ---

function inicializarMapa() {
    atualizarStatus('Inicializando mapa...');
    if (typeof L === 'undefined') return atualizarStatus('Leaflet não carregado', 'error');
    criarMapa();
    atualizarStatus('Mapa inicializado com sucesso!', 'success');
}

// Marca o radio do mapa base com o nome informado
function setRadioLayerByName(name) {
    const radios = document.querySelectorAll('input[name="mapBase"]');
    radios.forEach(radio => {
        if (radio.nextSibling.textContent.trim() === name) {
            radio.checked = true;
        }
    });
}

function createSvgIcon(svgUrl) {
    return L.icon({
        iconUrl: svgUrl,
        iconSize: [100, 100],  // Ajuste o tamanho conforme necessário
        iconAnchor: [50, 50], // Centraliza o ícone no ponto
        popupAnchor: [0, -50]
    });
}

function carregarGeoJSONPmacCameras(geojsonPath, svgIconPath, nomeDisplay) {
    return fetch(geojsonPath)
        .then(response => {
            if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            return response.json();
        })
        .then(data => {
            if (!data.features || data.features.length === 0) return null;

            const icon = createSvgIcon(svgIconPath);

            const layer = L.geoJSON(data, {
                pointToLayer: (feature, latlng) => L.marker(latlng, { icon }),
                onEachFeature: (feature, layer) => {
                    if (feature.properties) {
                        let popupContent = `<div style="font-family: Arial, sans-serif; max-width: 300px;">
                                  <h4>${nomeDisplay}</h4>`;
                        for (const prop in feature.properties) {
                            popupContent += `<p><strong>${prop}:</strong> ${feature.properties[prop]}</p>`;
                        }
                        popupContent += '</div>';
                        layer.bindPopup(popupContent);
                    }
                }
            });

            return layer;
        })
        .catch(error => {
            console.error(`Erro ao carregar ${geojsonPath}:`, error);
            return null;
        });
}

function criarMapa() {
    // Define as coordenadas e zoom para o município conforme o botão
    const viewMunicipio = [-22.94978, -42.080];
    const zoomInicial = 12;

    // Cria o mapa já centralizado e com o zoom desejado
    map = L.map('map').setView(viewMunicipio, zoomInicial);

    // Define as camadas base (tiles) normalmente
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

    // Adiciona a camada base inicial, por exemplo, OpenStreetMap
    openStreetMap.addTo(map);

    const estilos = {
        uf: { color: '#2980b9', weight: 8, opacity: 1, fillColor: '#2980b9', fillOpacity: 0.05 },
        municipio: { color: '#27ae60', weight: 6, opacity: 1, fillColor: '#27ae60', fillOpacity: 0.1 },
        logradouros: { color: '#f39c12', weight: 4, opacity: 1 },
        relevo: { color: '#8b4513', weight: 2, opacity: 0.8, fillColor: '#d2b48c', fillOpacity: 0.3 }
    };

    const overlayIBGE = {};
    const overlayPMAC = {};
    const overlayPMACCameras = {};
    camadasPorTipo['pmac'] = overlayPMAC;
    camadasPorTipo['pmac_cameras'] = overlayPMACCameras;

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

        const camerasFiles = [
            { file: 'geojson/pmac-cams/botao_panico/botao_panico.geojson', svg: 'geojson/pmac-cams/botao_panico/botao_panico.svg', name: 'Botão Pânico' },
            { file: 'geojson/pmac-cams/cam360/camera_360.geojson', svg: 'geojson/pmac-cams/cam360/camera_360.svg', name: 'Câmera 360' },
            { file: 'geojson/pmac-cams/comum/camera_comum.geojson', svg: 'geojson/pmac-cams/comum/camera_comum.svg', name: 'Câmera Comum' },
            { file: 'geojson/pmac-cams/ocr/ocr.geojson', svg: 'geojson/pmac-cams/ocr/ocr.svg', name: 'OCR' },
            { file: 'geojson/pmac-cams/rec_facial/rec_facial.geojson', svg: 'geojson/pmac-cams/rec_facial/rec_facial.svg', name: 'Reconhecimento Facial' }
        ];

        return Promise.all(zoneamentoFiles.map(z =>
            carregarGeoJSONComDetalhes(
                z.file,
                { color: z.color, weight: 2, fillOpacity: 0.3 },
                z.name,
                'pmac'
            ).then(layer => {
                if (layer) {
                    overlayPMAC[z.name] = layer;
                    // ❌ NÃO incrementa aqui, já é feito em carregarGeoJSONComDetalhes()
                }
            })
        )).then(() => {
            return Promise.all(camerasFiles.map(cam =>
                carregarGeoJSONPmacCameras(cam.file, cam.svg, cam.name)
                    .then(layer => {
                        if (layer) {
                            overlayPMACCameras[cam.name] = layer;
                            camadasCarregadas++;          // ✅ Só aqui incrementa
                            atualizarDiagnostico();
                        }
                    })
            ));
        }).then(() => {
            totalCamadas = Object.keys(overlayIBGE).length +
                Object.keys(overlayPMAC).length +
                Object.keys(overlayPMACCameras).length;

            preencherGruposNoMenu(overlayIBGE, overlayPMAC, overlayPMACCameras);

            setTimeout(() => {
                setRadioLayerByName('Imagem de Satélite');
            }, 100);
        });
    });

    L.control.scale({ position: 'bottomleft', metric: true }).addTo(map);

    // Evento de clique no mapa comentado — pode ser ativado se quiser mostrar coordenadas clicadas
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
