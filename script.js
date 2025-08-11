const statusIndicator = document.getElementById('statusIndicator');
let map;
let camadasCarregadas = 0;
let totalCamadas = 4;
let camadasPorTipo = {}; // Armazenar camadas por tipo

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
    const leafletOK = typeof L !== 'undefined';
    document.getElementById('statusLeaflet').innerHTML = leafletOK ? '✅ Leaflet: Carregado' : '❌ Leaflet: Erro';
    document.getElementById('statusLeaflet').className = leafletOK ? 'diagnostico-item diagnostico-ok' : 'diagnostico-item diagnostico-erro';

    const redeOK = navigator.onLine;
    document.getElementById('statusRede').innerHTML = redeOK ? '✅ Rede: Online' : '❌ Rede: Offline';
    document.getElementById('statusRede').className = redeOK ? 'diagnostico-item diagnostico-ok' : 'diagnostico-item diagnostico-erro';

    const mapaOK = document.getElementById('map') !== null && map !== undefined;
    document.getElementById('statusMapa').innerHTML = mapaOK ? '✅ Mapa: Inicializado' : '❌ Mapa: Erro';
    document.getElementById('statusMapa').className = mapaOK ? 'diagnostico-item diagnostico-ok' : 'diagnostico-item diagnostico-erro';

    document.getElementById('statusGeoJSON').innerHTML = `📁 Camadas: ${camadasCarregadas}/${totalCamadas}`;
    document.getElementById('statusGeoJSON').className = camadasCarregadas > 0 ? 'diagnostico-item diagnostico-ok' : 'diagnostico-item diagnostico-aviso';

    const statusCamadas = camadasCarregadas === totalCamadas ? '✅ Todas carregadas' :
        camadasCarregadas > 0 ? '⚠️ Parcialmente carregadas' : '❌ Nenhuma carregada';
    document.getElementById('statusCamadas').innerHTML = statusCamadas;
    document.getElementById('statusCamadas').className = camadasCarregadas === totalCamadas ? 'diagnostico-item diagnostico-ok' :
        camadasCarregadas > 0 ? 'diagnostico-item diagnostico-aviso' : 'diagnostico-item diagnostico-erro';
}

function inicializarMapa() {
    try {
        atualizarStatus('Inicializando mapa...');
        if (typeof L === 'undefined') {
            throw new Error('Leaflet não foi carregado');
        }
        criarMapa();
        atualizarStatus('Mapa inicializado com sucesso!', 'success');
    } catch (error) {
        console.error('❌ Erro ao inicializar mapa:', error);
        atualizarStatus('Erro ao inicializar mapa', 'error');
    }
}

function criarMapa() {
    const centroCidade = [-22.9663, -42.0278];
    const zoomInicial = 13;

    map = L.map('map').setView(centroCidade, zoomInicial);

    // Camadas base
    const openStreetMap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18,
        zIndex: 1
    });

    const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: '© Esri, DigitalGlobe, GeoEye, Earthstar Geographics',
        maxZoom: 18,
        zIndex: 1
    });

    const cartoLight = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap contributors, © CARTO',
        maxZoom: 18,
        zIndex: 1
    });

    const cartoDark = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap contributors, © CARTO',
        maxZoom: 18,
        zIndex: 1
    });


    openStreetMap.addTo(map);

    L.marker(centroCidade)
        .addTo(map)
        .bindPopup('<strong>Arraial do Cabo - RJ</strong><br>Centro da cidade')
        .openPopup();

    function carregarGeoJSONComDetalhes(nomeArquivo, estilo, nomeDisplay, tipoCamada) {
        // Centralizado no topo do script ou no início da função
        const camposLabel = ['NOME_REAL', 'legenda', 'nome', 'titulo'];

        console.log(`🔄 Tentando carregar: ${nomeArquivo}`);

        return fetch(nomeArquivo)
            .then(response => {
                console.log(`📡 Resposta para ${nomeArquivo}:`, response.status, response.statusText);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                return response.text();
            })
            .then(texto => {
                console.log(`📄 Conteúdo bruto de ${nomeArquivo}:`, texto.substring(0, 200) + '...');

                if (!texto || texto.trim().length === 0) {
                    throw new Error('Arquivo completamente vazio');
                }

                let data;
                try {
                    data = JSON.parse(texto);
                } catch (parseError) {
                    throw new Error(`Erro ao fazer parse do JSON: ${parseError.message}`);
                }

                if (!data.type || data.type !== 'FeatureCollection') {
                    throw new Error('Não é um FeatureCollection válido');
                }

                if (!data.features || !Array.isArray(data.features) || data.features.length === 0) {
                    console.warn(`⚠️ ${nomeArquivo} não possui features válidas`);
                    return null;
                }

                console.log(`✅ ${nomeArquivo} carregado com sucesso. Features:`, data.features.length);

                // Filtrar apenas features de Arraial do Cabo se necessário

                console.log(`🔍 Filtrado para Arraial do Cabo: ${data.features.length} features`);

                const layer = L.geoJSON(data, {
                    style: function(feature) {
                        return {
                            ...estilo,
                            opacity: estilo.opacity || 0.8,
                            fillOpacity: estilo.fillOpacity || 0.3,
                            weight: estilo.weight || 3
                        };
                    },
                    pane: 'overlayPane',
                    onEachFeature: function(feature, layer) {
                        if (feature.properties) {
                            let content = '<div style="font-family: Arial, sans-serif; max-width: 300px;">';
                            content += `<h4 style="margin: 0 0 10px 0; color: #2c3e50;">${nomeDisplay}</h4>`;

                            for (const prop in feature.properties) {
                                if (feature.properties[prop] !== null && feature.properties[prop] !== '') {
                                    content += `<p style="margin: 3px 0; font-size: 12px;"><strong>${prop}:</strong> ${feature.properties[prop]}</p>`;
                                }
                            }
                            content += '</div>';
                            layer.bindPopup(content);

                            // Exibir etiqueta como label flutuante para logradouros ou relevo
                            if (feature.properties) {
                                // Encontrar primeiro campo existente
                                const campoLabelEncontrado = camposLabel.find(campo => feature.properties[campo]);

                                if (campoLabelEncontrado) {
                                    const valorLabel = feature.properties[campoLabelEncontrado];

                                    // Criar nome da classe CSS baseado no campo (opcional, pode usar um padrão)
                                    const tipoClasse = `label-${campoLabelEncontrado.toLowerCase()}`;

                                    // Exibir tooltip
                                    layer.bindTooltip(valorLabel, {
                                        permanent: false,     // true se quiser deixar fixo
                                        direction: 'center',
                                        className: tipoClasse,
                                        sticky: true
                                    });
                                }
                            }
                        }

                        // Efeitos de interação
                        layer.on({
                            mouseover: function(e) {
                                const targetLayer = e.target;
                                targetLayer.setStyle({
                                    weight: (estilo.weight || 3) + 2,
                                    opacity: 1,
                                    fillOpacity: Math.min((estilo.fillOpacity || 0.3) + 0.3, 0.8)
                                });
                                if (targetLayer.bringToFront) {
                                    targetLayer.bringToFront();
                                }
                            },
                            mouseout: function(e) {
                                const targetLayer = e.target;
                                targetLayer.setStyle(estilo);
                            }
                        });
                    }
                });

                // Armazenar camada por tipo
                camadasPorTipo[tipoCamada] = layer;

                camadasCarregadas++;
                atualizarDiagnostico();
                return layer;
            })
            .catch(error => {
                console.error(`❌ Erro detalhado ao carregar ${nomeArquivo}:`, error);
                return null;
            });
    }

    // Estilos otimizados para máxima visibilidade
    const estilos = {
        uf: {
            color: '#2980b9',
            weight: 8,
            opacity: 1,
            fillColor: '#2980b9',
            fillOpacity: 0.05
        },
        municipio: {
            color: '#27ae60',
            weight: 6,
            opacity: 1,
            fillColor: '#27ae60',
            fillOpacity: 0.1
        },
        limites: {
            color: '#9b59b6',
            weight: 5,
            opacity: 1,
            fillColor: '#9b59b6',
            fillOpacity: 0.08
        },
        relevo: {
            color: '#8b4513',
            weight: 2,
            opacity: 0.8,
            fillColor: '#d2b48c',
            fillOpacity: 0.3
        },
        logradouros: {
            color: '#f39c12',  // Cor laranja vibrante
            weight: 4,         // Espessura da linha adequada para visualização
            opacity: 1         // Opacidade total para evitar transparência excessiva
        },
        bairros: {
            color: '#e74c3c',
            weight: 3,
            opacity: 1,
            fillColor: '#e74c3c',
            fillOpacity: 0.15,
            dashArray: '5,5'
        }
    };

    // Carregar camadas em ordem específica
    Promise.all([
        carregarGeoJSONComDetalhes('uf_ibge.geojson', estilos.uf, 'Limite Estadual IBGE', 'uf'),
        carregarGeoJSONComDetalhes('limite_ibge.geojson', estilos.municipio, 'Limite Municipal IBGE', 'municipio'), //limites
        carregarGeoJSONComDetalhes('logradouros_ibge.geojson', estilos.logradouros, 'Logradouros IBGE', 'logradouros'),
        carregarGeoJSONComDetalhes('relevo_ibge.geojson', estilos.relevo, 'Relevo IBGE', 'relevo'),
        // carregarGeoJSONComDetalhes('bairros_ibge.geojson', estilos.bairros, 'Bairros IBGE', 'bairros')
    ]).then(function(layers) {
        const baseMaps = {
            "🗺️ OpenStreetMap": openStreetMap,
            "🛰️ Imagem de Satélite": satelliteLayer,
            "🌅 Carto Light": cartoLight,
            "🌃️ Carto Dark": cartoDark
        };

        const overlayMaps = {};
        const nomesCamadas = [
            // 🏛️
            '🗾 Limite Estadual',
            '🗺️ Limite Municipal',
            '🛣️ Logradouros',
            '⛰️ Relevo'
            // '🏘️ Bairros'
        ];

        // Processar cada camada
        layers.forEach((layer, index) => {
            if (layer) {
                overlayMaps[nomesCamadas[index]] = layer;
                console.log(`✅ Camada real adicionada: ${nomesCamadas[index]}`);
            }
        });

        const totalCamadas = Object.keys(overlayMaps).length;
        console.log(`📊 Total de camadas disponíveis: ${totalCamadas}`);

        if (totalCamadas === 0) {
            console.warn('⚠️ Nenhuma camada foi carregada');
            return;
        }

        // Criar controle de camadas
        const layerControl = L.control.layers(baseMaps, overlayMaps, {
            position: 'topright',
            collapsed: false
        }).addTo(map);

        console.log('✅ Controle de camadas adicionado ao mapa');

        // ADICIONAR TODAS AS CAMADAS AUTOMATICAMENTE COM ORDEM CORRETA
        const ordemAdicao = ['uf', 'municipio', 'logradouros', 'relevo'];
        let camadasAdicionadas = 0;

        ordemAdicao.forEach((tipo, index) => {
            const camada = camadasPorTipo[tipo];
            if (camada) {
                camada.addTo(map);
                console.log(`✅ Camada ${tipo} adicionada ao mapa`);
                camadasAdicionadas++;
            }
        });

        // Função para manter ordem das camadas (CORRIGIDA)
        function organizarCamadas() {
            ordemAdicao.forEach((tipo, index) => {
                const camada = camadasPorTipo[tipo];
                if (camada && camada.bringToFront) {
                    setTimeout(() => {
                        camada.bringToFront();
                    }, index * 100);
                }
            });
        }

        // Executar reorganização inicial e periodicamente
        setTimeout(organizarCamadas, 1000);
        setInterval(organizarCamadas, 5000);

        atualizarDiagnostico();
        console.log(`🎯 Mapa configurado com ${totalCamadas} camadas disponíveis`);
        console.log(`📍 ${camadasAdicionadas} camadas visíveis automaticamente`);
    });

    // Controles adicionais
    L.control.scale({
        position: 'bottomleft',
        metric: true,
        imperial: false
    }).addTo(map);

    // Clique para coordenadas
    map.on('click', function(e) {
        L.popup()
            .setLatLng(e.latlng)
            .setContent(`
                        <div style="font-family: monospace; font-size: 12px;">
                            <strong>Coordenadas SIRGAS 2000:</strong><br>
                            <strong>Lat:</strong> ${e.latlng.lat.toFixed(6)}°<br>
                            <strong>Lng:</strong> ${e.latlng.lng.toFixed(6)}°
                        </div>
                    `)
            .openOn(map);
    });

    console.log('✅ Mapa de Arraial do Cabo inicializado com sucesso!');
}

// Inicializar quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(inicializarMapa, 100);
    setInterval(atualizarDiagnostico, 2000);
    atualizarDiagnostico();

    // Botão modo escuro
    // const btnDark = document.getElementById('toggleDarkMode');
    // btnDark.addEventListener('click', function() {
    //     document.body.classList.toggle('dark-mode');
    //
    //     // Troca camada base
    //     if (document.body.classList.contains('dark-mode')) {
    //         map.eachLayer(function(layer) {
    //             map.removeLayer(layer);
    //         });
    //         camadasPorTipo['uf']?.addTo(map);
    //         camadasPorTipo['municipio']?.addTo(map);
    //         camadasPorTipo['logradouros']?.addTo(map);
    //         camadasPorTipo['relevo']?.addTo(map);
    //         // Adiciona mapa escuro
    //         cartoDark.addTo(map);
    //         btnDark.textContent = '☀️ Modo Claro';
    //     } else {
    //         map.eachLayer(function(layer) {
    //             map.removeLayer(layer);
    //         });
    //         camadasPorTipo['uf']?.addTo(map);
    //         camadasPorTipo['municipio']?.addTo(map);
    //         camadasPorTipo['logradouros']?.addTo(map);
    //         camadasPorTipo['relevo']?.addTo(map);
    //         openStreetMap.addTo(map);
    //         btnDark.textContent = '🌙 Modo Escuro';
    //     }
    // });
});
