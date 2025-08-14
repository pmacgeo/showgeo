// mapa.js - criação e carregamento assíncrono das camadas do mapa com Leaflet (async/await)

// Variáveis globais do mapa e camadas
let map;
let camadasPorTipo = {};

// Grupos principais de camadas por tipo
const overlayIBGE = {};
const overlayPMAC = {};
const overlayPMACCameras = {};
const overlayPMACOnibus = {};

camadasPorTipo['ibge'] = overlayIBGE;
camadasPorTipo['pmac'] = overlayPMAC;
camadasPorTipo['pmac_cameras'] = overlayPMACCameras;
camadasPorTipo['pmac_onibus'] = overlayPMACOnibus;

// Camadas base
let openStreetMap, satelliteLayer, cartoLight, cartoDark;

// Função para criar o mapa e carregar todas as camadas
async function criarMapa() {
    // Inicializa o mapa centrado em Arraial do Cabo - RJ
    map = L.map('map').setView([-22.94978, -42.080], 12);

    // Define as camadas base (tiles)
    openStreetMap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18
    });
    satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: '© Esri',
        maxZoom: 18
    });
    cartoLight = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap/CARTO',
        maxZoom: 18
    });
    cartoDark = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap/CARTO',
        maxZoom: 18
    });

    // Adiciona camada base inicial
    satelliteLayer.addTo(map);
    setRadioLayerByName('Imagem de Satélite');

    // Estilos para camadas IBGE
    const estilosIBGE = {
        uf: { color: '#2980b9', weight: 8, opacity: 1, fillColor: '#2980b9', fillOpacity: 0.05 },
        municipio: { color: '#27ae60', weight: 6, opacity: 1, fillColor: '#27ae60', fillOpacity: 0.1 },
        logradouros: { color: '#f39c12', weight: 4, opacity: 1 },
        relevo: { color: '#8b4513', weight: 2, opacity: 0.8, fillColor: '#d2b48c', fillOpacity: 0.3 }
    };

    // Arquivos e descrições para IBGE
    const ibgeFiles = [
        { file: 'geojson/ibge/uf_ibge.geojson', estilo: estilosIBGE.uf, name: 'Limite Estadual', tipo: 'uf' },
        { file: 'geojson/ibge/limite_ibge.geojson', estilo: estilosIBGE.municipio, name: 'Limite Municipal', tipo: 'municipio' },
        { file: 'geojson/ibge/logradouros_ibge.geojson', estilo: estilosIBGE.logradouros, name: 'Logradouros', tipo: 'logradouros' },
        { file: 'geojson/ibge/relevo_ibge.geojson', estilo: estilosIBGE.relevo, name: 'Relevo', tipo: 'relevo' }
    ];

    // Arquivos e cores para zoneamento PMAC
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

    // Arquivos para câmeras PMAC com seus ícones
    const camerasFiles = [
        { file: 'geojson/pmac-cams/botao_panico/botao_panico.geojson', svg: 'geojson/pmac-cams/botao_panico/botao_panico.svg', name: 'Botão Pânico' },
        { file: 'geojson/pmac-cams/cam360/camera_360.geojson', svg: 'geojson/pmac-cams/cam360/camera_360.svg', name: 'Câmera 360' },
        { file: 'geojson/pmac-cams/comum/camera_comum.geojson', svg: 'geojson/pmac-cams/comum/camera_comum.svg', name: 'Câmera Comum' },
        { file: 'geojson/pmac-cams/ocr/ocr.geojson', svg: 'geojson/pmac-cams/ocr/ocr.svg', name: 'OCR' },
        { file: 'geojson/pmac-cams/rec_facial/rec_facial.geojson', svg: 'geojson/pmac-cams/rec_facial/rec_facial.svg', name: 'Reconhecimento Facial' }
    ];

    // Arquivos ônibus PMAC (linhas e pontos)
    const onibusFiles = [
        { file: 'geojson/pmac-onibus/arraial_x_figueira.geojson', name: 'Linha Arraial ↔ Figueira', color: '#e67e22' },
        { file: 'geojson/pmac-onibus/centro_x_praias.geojson', name: 'Linha Centro ↔ Praias', color: '#1abc9c' },
        { file: 'geojson/pmac-onibus/figueira_x_arraial.geojson', name: 'Linha Figueira ↔ Arraial', color: '#2980b9' },
        { file: 'geojson/pmac-onibus/figueira_x_pernambuca.geojson', name: 'Linha Figueira ↔ Pernambuca', color: '#9b59b6' },
        { file: 'geojson/pmac-onibus/pernambuca_x_figueira.geojson', name: 'Linha Pernambuca ↔ Figueira', color: '#34495e' },
        { file: 'geojson/pmac-onibus/pontos_de_onibus_150.geojson', name: 'Pontos de Ônibus - Linha 150', point: true },
        { file: 'geojson/pmac-onibus/pontos_de_onibus_340.geojson', name: 'Pontos de Ônibus - Linha 340', point: true },
        { file: 'geojson/pmac-onibus/pontos_de_onibus_341.geojson', name: 'Pontos de Ônibus - Linha 341', point: true }
    ];

    // Função para carregar arquivos GeoJSON com estilo e popup - reutiliza função existente
    async function carregarGeoJSONComDetalhesAsync(file, estilo, nomeDisplay, tipoCamada) {
        try {
            const response = await fetch(file);
            if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            const data = await response.json();

            const layer = L.geoJSON(data, {
                style: () => ({
                    ...estilo,
                    opacity: estilo.opacity || 0.8,
                    fillOpacity: estilo.fillOpacity || 0.3,
                    weight: estilo.weight || 3
                }),
                onEachFeature: (feature, layer) => {
                    if (feature.properties) {
                        let content = `<div style="font-family: Arial, sans-serif; max-width: 300px;">
                            <h4>${nomeDisplay}</h4>`;
                        for (const prop in feature.properties) {
                            if (feature.properties[prop]) {
                                content += `<p style="margin:3px 0; font-size:12px;"><strong>${prop}:</strong> ${feature.properties[prop]}</p>`;
                            }
                        }
                        content += '</div>';
                        layer.bindPopup(content);
                    }
                    layer.on({
                        mouseover: e => {
                            e.target.setStyle({ weight: (estilo.weight || 3) + 2, opacity: 1, fillOpacity: Math.min((estilo.fillOpacity || 0.3) + 0.3, 0.8) });
                            if (e.target.bringToFront) e.target.bringToFront();
                        },
                        mouseout: e => {
                            e.target.setStyle(estilo);
                        }
                    });
                }
            });

            camadasPorTipo[tipoCamada] = layer;
            // Dentro da função que carrega uma camada GeoJSON, após sucesso:
            camadasCarregadas++;
            atualizarDiagnostico();

            return layer;
        } catch (error) {
            console.error(`Erro ao carregar ${file}:`, error);
            return null;
        }
    }

    // Função para carregar câmeras PMAC (pontos com ícones)
    async function carregarGeoJSONPmacCamerasAsync(file, svgIconPath, nomeDisplay) {
        try {
            const response = await fetch(file);
            if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            const data = await response.json();

            if (!data.features || data.features.length === 0) return null;

            const icon = L.icon({
                iconUrl: svgIconPath,
                iconSize: [100, 100],
                iconAnchor: [50, 50],
                popupAnchor: [0, -50]
            });

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
            // Dentro da função que carrega uma camada GeoJSON, após sucesso:
            camadasCarregadas++;
            atualizarDiagnostico();

            return layer;
        } catch (error) {
            console.error(`Erro ao carregar ${file}:`, error);
            return null;
        }
    }

    // Função para carregar linhas de ônibus (polilinhas)
    async function carregarGeoJSONOnibusLinha(file, color, nomeDisplay) {
        try {
            const response = await fetch(file);
            if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            const data = await response.json();

            const layer = L.geoJSON(data, {
                style: { color: color, weight: 4, opacity: 0.9 },
                onEachFeature: (feature, layer) => {
                    if (feature.properties) {
                        let popup = `<h4>${nomeDisplay}</h4>`;
                        for (const prop in feature.properties) {
                            popup += `<p><strong>${prop}:</strong> ${feature.properties[prop]}</p>`;
                        }
                        layer.bindPopup(popup);
                    }
                }
            });
            // Dentro da função que carrega uma camada GeoJSON, após sucesso:
            camadasCarregadas++;
            atualizarDiagnostico();

            return layer;
        } catch (error) {
            console.error(`Erro ao carregar ${file}:`, error);
            return null;
        }
    }

    // Função para carregar pontos de ônibus (com ícone personalizado)
    async function carregarGeoJSONOnibusPonto(file, nomeDisplay) {
        try {
            const response = await fetch(file);
            if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            const data = await response.json();

            const icon = L.icon({
                iconUrl: 'geojson/pmac-onibus/bus-stop-icon.png', // ajuste conforme sua pasta/imagem
                iconSize: [20, 20]
            });

            const layer = L.geoJSON(data, {
                pointToLayer: (feature, latlng) => L.marker(latlng, { icon }),
                onEachFeature: (feature, layer) => {
                    if (feature.properties) {
                        let popup = `<h4>${nomeDisplay}</h4>`;
                        for (const prop in feature.properties) {
                            popup += `<p><strong>${prop}:</strong> ${feature.properties[prop]}</p>`;
                        }
                        layer.bindPopup(popup);
                    }
                }
            });
            // Dentro da função que carrega uma camada GeoJSON, após sucesso:
            camadasCarregadas++;
            atualizarDiagnostico();

            return layer;
        } catch (error) {
            console.error(`Erro ao carregar ${file}:`, error);
            return null;
        }
    }

    // Carrega em paralelo todas as camadas necessárias
    try {
        // Promessas para IBGE
        const promIBGE = ibgeFiles.map(f => carregarGeoJSONComDetalhesAsync(f.file, f.estilo, f.name, f.tipo));

        // Promessas para zoneamento PMAC
        const promPMAC = zoneamentoFiles.map(z => carregarGeoJSONComDetalhesAsync(z.file, { color: z.color, weight: 2, fillOpacity: 0.3 }, z.name, 'pmac'));

        // Promessas para câmeras PMAC
        const promCameras = camerasFiles.map(c => carregarGeoJSONPmacCamerasAsync(c.file, c.svg, c.name));

        // Promessas para ônibus PMAC (linhas e pontos)
        const promOnibus = onibusFiles.map(item => {
            if (item.point) {
                return carregarGeoJSONOnibusPonto(item.file, item.name)
                    .then(layer => {
                        if (layer) overlayPMACOnibus[item.name] = layer;
                        return layer;
                    });
            } else {
                return carregarGeoJSONOnibusLinha(item.file, item.color, item.name)
                    .then(layer => {
                        if (layer) overlayPMACOnibus[item.name] = layer;
                        return layer;
                    });
            }
        });

        // Aguarda todas as promessas resolverem
        const [ibgeLayers, pmacLayers, cameraLayers] = await Promise.all([
            Promise.all(promIBGE),
            Promise.all(promPMAC),
            Promise.all(promCameras)
        ]);

        // Atualiza os grupos IBGE, PMAC, Câmeras com as camadas carregadas
        ibgeLayers.forEach((layer, i) => { if (layer) overlayIBGE[ibgeFiles[i].name] = layer; });
        pmacLayers.forEach((layer, i) => { if (layer) overlayPMAC[zoneamentoFiles[i].name] = layer; });
        cameraLayers.forEach((layer, i) => { if (layer) overlayPMACCameras[camerasFiles[i].name] = layer; });

        // Aguarda carregamento dos ônibus (já adicionados em overlayPMACOnibus via then acima)
        await Promise.all(promOnibus);

        // Atualiza total de camadas carregadas (supondo que exista a variável global totalCamadas)
        const totalCount = Object.keys(overlayIBGE).length + Object.keys(overlayPMAC).length + Object.keys(overlayPMACCameras).length + Object.keys(overlayPMACOnibus).length;
        if (typeof totalCamadas !== 'undefined') {
            totalCamadas = totalCount;
        }

        if (totalCamadas === camadasCarregadas) {
            atualizarStatus("Mapa carregado com sucesso!", "success");
        }

        // Atualiza o menu lateral com todas as camadas carregadas
        preencherGruposNoMenu(overlayIBGE, overlayPMAC, overlayPMACCameras, overlayPMACOnibus);

    } catch (error) {
        console.error("Erro geral ao carregar camadas do mapa:", error);
    }

    // Adiciona componente de escala métrica ao mapa
    L.control.scale({ position: 'bottomleft', metric: true }).addTo(map);
}

function inicializarMapa() {
    criarMapa();
    // inicializarMapaComSatelite();
    setRadioLayerByName('Imagem de Satélite');
}
