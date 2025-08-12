// --- Função para carregar arquivos GeoJSON e aplicar estilos/detalhes ---

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
                        let content = `<div style="font-family: Arial, sans-serif; max-width: 300px;">
                            <h4 style="color:#2c3e50;">${nomeDisplay}</h4>`;
                        for (const prop in feature.properties) {
                            if (feature.properties[prop]) {
                                content += `<p style="margin:3px 0; font-size:12px;">
                                    <strong>${prop}:</strong> ${feature.properties[prop]}</p>`;
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
