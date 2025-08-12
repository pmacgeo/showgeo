const statusIndicator = document.getElementById('statusIndicator');

let map;
let camadasCarregadas = 0;
let totalCamadas = 4;
let camadasPorTipo = {}; // Armazenar camadas por tipo

let openStreetMap, satelliteLayer, cartoLight, cartoDark;

function atualizarStatus(mensagem, tipo = 'loading') {
    statusIndicator.textContent = mensagem;
    statusIndicator.className = `status-indicator ${tipo}`;
    if (tipo === 'success') {
        setTimeout(() => {
            statusIndicator.style.display = 'none';
        }, 3000);
    }
}

function atualizarDiagnostico() {
    document.getElementById('statusLeaflet').textContent = typeof L !== 'undefined' ? '✅ Leaflet: Carregado' : '❌ Leaflet: Erro';
    document.getElementById('statusRede').textContent = navigator.onLine ? '✅ Rede: Online' : '❌ Rede: Offline';
    document.getElementById('statusMapa').textContent = map ? '✅ Mapa: Inicializado' : '❌ Mapa: Erro';
    document.getElementById('statusGeoJSON').textContent = `📁 Camadas: ${camadasCarregadas}/${totalCamadas}`;
    document.getElementById('statusCamadas').textContent =
        camadasCarregadas === totalCamadas ? '✅ Todas carregadas' :
            camadasCarregadas > 0 ? '⚠️ Parcialmente carregadas' : '❌ Nenhuma carregada';
}

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

    function carregarGeoJSONComDetalhes(nomeArquivo, estilo, nomeDisplay, tipoCamada) {
        const camposLabel = ['NOME_REAL', 'legenda', 'nome', 'titulo'];
        return fetch(nomeArquivo)
            .then(response => {
                if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                return response.text();
            })
            .then(texto => {
                if (!texto || texto.trim().length === 0) throw new Error('Arquivo vazio');

                let data;
                try {
                    data = JSON.parse(texto);
                } catch (err) {
                    throw new Error(`Erro no JSON: ${err.message}`);
                }
                if (!data.type || data.type !== 'FeatureCollection') throw new Error('GeoJSON inválido');
                if (!data.features || !Array.isArray(data.features) || data.features.length === 0) return null;

                const layer = L.geoJSON(data, {
                    style: () => ({
                        ...estilo,
                        opacity: estilo.opacity || 0.8,
                        fillOpacity: estilo.fillOpacity || 0.3,
                        weight: estilo.weight || 3
                    }),
                    onEachFeature: (feature, layer) => {
                        if (feature.properties) {
                            let content = `<div style="font-family: Arial, sans-serif; max-width: 300px;"><h4 style="color:#2c3e50;">${nomeDisplay}</h4>`;
                            for (const prop in feature.properties) {
                                if (feature.properties[prop]) {
                                    content += `<p style="margin:3px 0; font-size:12px;"><strong>${prop}:</strong> ${feature.properties[prop]}</p>`;
                                }
                            }
                            content += '</div>';
                            layer.bindPopup(content);

                            const campoLabelEncontrado = camposLabel.find(c => feature.properties[c]);
                            if (campoLabelEncontrado) {
                                layer.bindTooltip(feature.properties[campoLabelEncontrado], {
                                    permanent: false,
                                    direction: 'center',
                                    className: `label-${campoLabelEncontrado.toLowerCase()}`,
                                    sticky: true
                                });
                            }
                        }
                        layer.on({
                            mouseover: e => {
                                e.target.setStyle({
                                    weight: (estilo.weight || 3) + 2,
                                    opacity: 1,
                                    fillOpacity: Math.min((estilo.fillOpacity || 0.3) + 0.3, 0.8)
                                });
                                if (e.target.bringToFront) e.target.bringToFront();
                            },
                            mouseout: e => {
                                e.target.setStyle(estilo);
                            }
                        });
                    }
                });

                camadasPorTipo[tipoCamada] = layer;
                camadasCarregadas++;
                atualizarDiagnostico();
                return layer;
            })
            .catch(error => {
                console.error(`Erro ao carregar ${nomeArquivo}:`, error);
                return null;
            });
    }

    const estilos = {
        uf: { color: '#2980b9', weight: 8, opacity: 1, fillColor: '#2980b9', fillOpacity: 0.05 },
        municipio: { color: '#27ae60', weight: 6, opacity: 1, fillColor: '#27ae60', fillOpacity: 0.1 },
        limites: { color: '#9b59b6', weight: 5, opacity: 1, fillColor: '#9b59b6', fillOpacity: 0.08 },
        relevo: { color: '#8b4513', weight: 2, opacity: 0.8, fillColor: '#d2b48c', fillOpacity: 0.3 },
        logradouros: { color: '#f39c12', weight: 4, opacity: 1 },
        bairros: { color: '#e74c3c', weight: 3, opacity: 1, fillColor: '#e74c3c', fillOpacity: 0.15, dashArray: '5,5' }
    };

    Promise.all([
        carregarGeoJSONComDetalhes('uf_ibge.geojson', estilos.uf, 'Limite Estadual IBGE', 'uf'),
        carregarGeoJSONComDetalhes('limite_ibge.geojson', estilos.municipio, 'Limite Municipal IBGE', 'municipio'),
        carregarGeoJSONComDetalhes('logradouros_ibge.geojson', estilos.logradouros, 'Logradouros IBGE', 'logradouros'),
        carregarGeoJSONComDetalhes('relevo_ibge.geojson', estilos.relevo, 'Relevo IBGE', 'relevo'),
        // carregarGeoJSONComDetalhes('bairros_ibge.geojson', estilos.bairros, 'Bairros IBGE', 'bairros')
    ]).then(layers => {
        const baseMaps = {
            "🗺️ OpenStreetMap": openStreetMap,
            "🛰️ Imagem de Satélite": satelliteLayer,
            "🌅 Carto Light": cartoLight,
            "🌃️ Carto Dark": cartoDark
        };

        const overlayMaps = {};
        const nomesCamadas = ['🗾 Limite Estadual', '🗺️ Limite Municipal', '🛣️ Logradouros', '⛰️ Relevo'];

        layers.forEach((layer, idx) => {
            if (layer) {
                overlayMaps[nomesCamadas[idx]] = layer;
                console.log(`Camada adicionada: ${nomesCamadas[idx]}`);
            }
        });

        const layerControl = L.control.layers(baseMaps, overlayMaps, { collapsed: false });
        // Adiciona ao mapa para inicializar corretamente
        layerControl.addTo(map);

        // Container do controle
        const controlContainer = layerControl.getContainer();
        // Move o container do controle para o menu lateral
        const camadasList = document.getElementById('camadasList');
        camadasList.innerHTML = ''; // limpa antes
        camadasList.appendChild(controlContainer);

        // Adiciona as camadas automaticamente
        // ['uf', 'municipio', 'logradouros', 'relevo'].forEach(tipo => {
        //     if (camadasPorTipo[tipo]) camadasPorTipo[tipo].addTo(map);
        // });

        // Reorganizar como Item/Subitem (títulos separados)
        const baseSection = controlContainer.querySelector('.leaflet-control-layers-base');
        const overlaySection = controlContainer.querySelector('.leaflet-control-layers-overlays');
        if (baseSection) {
            const titleBase = document.createElement('h5');
            titleBase.textContent = 'Mapas Base';
            // Só insere se baseSection estiver dentro do container
            if (controlContainer.contains(baseSection)) {
                baseSection.parentNode.insertBefore(titleBase, baseSection);
            } else {
                controlContainer.appendChild(titleBase);
            }
        }
        if (overlaySection) {
            const titleOverlay = document.createElement('h5');
            titleOverlay.textContent = 'Camadas Extras';
            // Só insere se overlaySection estiver no container
            if (controlContainer.contains(overlaySection)) {
                overlaySection.parentNode.insertBefore(titleOverlay, overlaySection);
            } else {
                controlContainer.appendChild(titleOverlay);
            }
        }

        atualizarDiagnostico();
    });

    // Bônus: escala e clique para mostrar coordenadas
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

function alternarModoEscuro() {
    document.body.classList.toggle('dark-mode');
    map.eachLayer(layer => map.removeLayer(layer));
    if (document.body.classList.contains('dark-mode')) {
        cartoDark.addTo(map);
    } else {
        openStreetMap.addTo(map);
    }
    Object.values(camadasPorTipo).forEach(camada => camada?.addTo(map));

    document.getElementById('toggleDarkMode').textContent = document.body.classList.contains('dark-mode') ? '☀️ Modo Claro' : '🌙 Modo Escuro';
    const sidebarBtn = document.getElementById('toggleDarkModeSidebar');
    if (sidebarBtn) sidebarBtn.textContent = document.body.classList.contains('dark-mode') ? '☀️ Alternar Modo Claro' : '🌙 Alternar Modo Escuro';
}

document.addEventListener('DOMContentLoaded', () => {
    // Abrir no desktop, fechar no mobile
    if (window.innerWidth >= 769) {
        document.body.classList.add('menu-open');
        document.getElementById('sideMenu').classList.add('open');
        document.getElementById('hamburgerBtn').textContent = '✖';
    } else {
        document.body.classList.remove('menu-open');
        document.getElementById('sideMenu').classList.remove('open');
        document.getElementById('sideMenu').classList.add('closed');
        document.getElementById('hamburgerBtn').textContent = '☰';
    }

    inicializarMapa();
    setInterval(atualizarDiagnostico, 2000);

    const sideMenu = document.getElementById('sideMenu');
    const hamburgerBtn = document.getElementById('hamburgerBtn');

    // Hamburger abre/fecha menu lateral
    hamburgerBtn.addEventListener('click', () => {
        const aberto = sideMenu.classList.toggle('open');
        sideMenu.classList.toggle('closed', !aberto);

        // adiciona ou remove no body para acionar o CSS de margin no mapa
        document.body.classList.toggle('menu-open', aberto);
        // Alternar ícone hamburger / X
        hamburgerBtn.textContent = aberto ? '✖' : '☰';
    });

    const btnDarkHeader = document.getElementById('toggleDarkMode');
    const btnDarkSidebar = document.getElementById('toggleDarkModeSidebar');

    if (btnDarkHeader) {
        btnDarkHeader.addEventListener('click', alternarModoEscuro);
    }
    if (btnDarkSidebar) {
        btnDarkSidebar.addEventListener('click', alternarModoEscuro);
    }

    // Botão modo escuro no header
    document.getElementById('toggleDarkMode').addEventListener('click', alternarModoEscuro);
    // Botão modo escuro no menu lateral
    document.getElementById('toggleDarkModeSidebar').addEventListener('click', alternarModoEscuro);
});
