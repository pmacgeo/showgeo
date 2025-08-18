function preencherGruposNoMenu(baseIBGE, basePMAC, basePMACCameras, basePMACOnibus, basePMACAmbiental) {
    const grupoBase = document.getElementById('grupoBase');
    const grupoIBGE = document.getElementById('grupoIBGE');
    const grupoPMAC = document.getElementById('grupoPMAC');
    const grupoPMACCameras = document.getElementById('grupoPMACCameras');
    const grupoPMACOnibus = document.getElementById('grupoPMACOnibus');
    const grupoPMACAmbiental = document.getElementById('grupoPMACAmbiental');

    // Radios mapas base
    adicionarRadioBase(grupoBase, 'Nenhum mapa base', null);
    [
        { nome: 'OpenStreetMap', layer: openStreetMap },
        { nome: 'Imagem de Satélite', layer: satelliteLayer },
        { nome: 'Carto Light', layer: cartoLight },
        { nome: 'Carto Dark', layer: cartoDark }
    ].forEach(b => adicionarRadioBase(grupoBase, b.nome, b.layer));

    // Camadas IBGE
    const coresIBGE = {
        'Limite Estadual': '#2980b9',
        'Limite Municipal': '#27ae60',
        'Logradouros': '#f39c12',
        'Relevo': '#8b4513'
    };
    Object.entries(baseIBGE).forEach(([nome, layer]) => {
        adicionarCheckboxLayer(grupoIBGE, nome, layer, false, coresIBGE[nome]);
    });

    // Zoneamento PMAC
    Object.entries(basePMAC).forEach(([nome, layer]) => {
        adicionarCheckboxLayer(grupoPMAC, nome, layer, true);
    });

    // Botão para ativar/desativar todos os zoneamentos PMAC
    document.getElementById('toggleAllZoneamentos').addEventListener('click', () => {
        const checkboxes = grupoPMAC.querySelectorAll('input[type=checkbox]');
        const algumAtivo = Object.values(basePMAC).some(l => map.hasLayer(l));
        Object.values(basePMAC).forEach((layer, idx) => {
            if (algumAtivo) {
                map.removeLayer(layer);
                checkboxes[idx].checked = false;
            } else {
                layer.addTo(map);
                checkboxes[idx].checked = true;
            }
        });
    });

    // Botão para ativar/desativar todas as câmeras PMAC
    document.getElementById('toggleAllCameras').addEventListener('click', () => {
        const checkboxes = grupoPMACCameras.querySelectorAll('input[type=checkbox]');
        const algumaAtiva = Object.values(basePMACCameras).some(l => map.hasLayer(l));
        Object.values(basePMACCameras).forEach((layer, idx) => {
            if (algumaAtiva) {
                map.removeLayer(layer);
                checkboxes[idx].checked = false;
            } else {
                layer.addTo(map);
                checkboxes[idx].checked = true;
            }
        });
    });

    // Câmeras PMAC - adiciona apenas uma vez com SVG no label
    const svgUrls = {
        'Botão Pânico': 'geojson/pmac-cams/botao_panico/cake_13676147.png',
        'Câmera 360': 'geojson/pmac-cams/cam360/360-camera_1623453.png',
        'Câmera Comum': 'geojson/pmac-cams/comum/video-camera_99439.png',
        'OCR': 'geojson/pmac-cams/ocr/ocr_5376234.png',
        'Reconhecimento Facial': 'geojson/pmac-cams/rec_facial/masked-man_8269102.png'
    };

    Object.entries(basePMACCameras).forEach(([nome, layer]) => {
        adicionarCheckboxLayer(grupoPMACCameras, nome, layer, false, null, svgUrls[nome]);
    });

    // PMAC - Ônibus com ícones diferentes para Linha e Ponto
    if (basePMACOnibus) {
        // Limpa o container para evitar duplicações
        grupoPMACOnibus.innerHTML = '';

        Object.entries(basePMACOnibus).forEach(([nome, layer]) => {
            let nomeExibido;
            let iconUrl = null;

            if (nome.toLowerCase().includes('ponto')) {
                iconUrl = 'geojson/pmac-onibus/bus-stop-icon.png';
                nomeExibido = nome.replace(/^(Pontos? de Ônibus(?: -)?\s*)/i, '');
            } else if (nome.toLowerCase().includes('linha')) {
                iconUrl = 'geojson/pmac-onibus/bus-line-icon.png';
                nomeExibido = nome.replace(/^Linha\s*/i, '');
            } else {
                nomeExibido = nome;
            }

            adicionarCheckboxLayer(grupoPMACOnibus, nomeExibido, layer, false, null, iconUrl);
        });

        // Botão para ativar/desativar todos os ônibus PMAC - adicionado apenas uma vez
        const toggleAllOnibusBtn = document.getElementById('toggleAllOnibus');
        if (toggleAllOnibusBtn) {
            // Remove listeners antigos e recria
            toggleAllOnibusBtn.replaceWith(toggleAllOnibusBtn.cloneNode(true));
            const novoBotao = document.getElementById('toggleAllOnibus');

            novoBotao.addEventListener('click', () => {
                const checkboxes = grupoPMACOnibus.querySelectorAll('input[type=checkbox]');
                const algumAtivo = Object.values(basePMACOnibus).some(l => map.hasLayer(l));

                Object.values(basePMACOnibus).forEach((layer, idx) => {
                    if (algumAtivo) {
                        map.removeLayer(layer);
                        checkboxes[idx].checked = false;
                    } else {
                        layer.addTo(map);
                        checkboxes[idx].checked = true;
                    }
                });
            });
        }
    }

    // PMAC - Ambiental
    Object.entries(basePMACAmbiental).forEach(([nome, layer]) =>
        adicionarCheckboxLayer(grupoPMACAmbiental, nome, layer, false)
    );

    // Botão para ativar/desativar
    document.getElementById('toggleAllAmbiental').addEventListener('click', () => {
        const checkboxes = grupoPMACAmbiental.querySelectorAll('input[type=checkbox]');
        const algumaAtiva = Object.values(basePMACAmbiental).some(l => map.hasLayer(l));
        Object.values(basePMACAmbiental).forEach((layer, idx) => {
            if (algumaAtiva) {
                map.removeLayer(layer);
                checkboxes[idx].checked = false;
            } else {
                layer.addTo(map);
                checkboxes[idx].checked = true;
            }
        });
    });


}

function adicionarRadioBase(container, nome, layer) {
    const label = document.createElement('label');
    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = 'mapBase';
    radio.addEventListener('change', () => {
        [openStreetMap, satelliteLayer, cartoLight, cartoDark].forEach(l => map.removeLayer(l));
        if (layer) layer.addTo(map);
    });
    label.appendChild(radio);
    label.appendChild(document.createTextNode(' ' + nome));
    container.appendChild(label);
}

function adicionarCheckboxLayer(container, nome, layer, isZoneamento = false, cor = null, svgUrl = null) {
    const label = document.createElement('label');
    const check = document.createElement('input');
    check.type = 'checkbox';
    check.checked = map.hasLayer(layer);
    check.addEventListener('change', () => {
        if (check.checked) layer.addTo(map);
        else map.removeLayer(layer);
    });

    // Checkbox
    label.appendChild(check);
    label.appendChild(document.createTextNode(' '));

    // Ícone
    if (svgUrl) {
        const img = document.createElement('img');
        img.src = svgUrl;
        img.style.width = '20px';
        img.style.height = '20px';
        img.style.marginRight = '8px';
        img.style.verticalAlign = 'middle';
        label.appendChild(img);
    }

    // Nome
    label.appendChild(document.createTextNode(nome));

    // Cores
    if (isZoneamento) {
        const zoneamentoCores = {
            'Zona ZCVS': '#FF7800', 'Zona EC': '#abcdef', 'Zona ZEDS': '#3498db',
            'Zona ZEIS': '#2ecc71', 'Zona ZEN': '#8e44ad', 'Zona ZEP': '#27ae60',
            'Zona ZH': '#c0392b', 'Zona ZIC': '#f39c12', 'Zona ZIE': '#d35400',
            'Zona ZOC': '#1abc9c', 'Zona ZO': '#9b59b6', 'Zona ZP': '#34495e',
            'Zona ZPORT': '#2c3e50', 'Zona ZPVS': '#16a085', 'Zona ZR': '#e74c3c',
            'Zona ZUC': '#8e44ad', 'Zona ZUESP': '#2980b9', 'Zona ZUR2': '#7f8c8d'
        };
        if (zoneamentoCores[nome]) {
            label.style.borderLeft = `8px solid ${zoneamentoCores[nome]}`;
            label.style.paddingLeft = '8px';
        }
    } else if (cor) {
        label.style.borderLeft = `8px solid ${cor}`;
        label.style.paddingLeft = '8px';
    }

    container.appendChild(label);
}

function aplicarCoresLabels() {
    document.querySelectorAll('#camadasList label').forEach(lbl => {
        const txt = lbl.textContent.trim();
        if (txt.includes('Limite Estadual')) lbl.style.setProperty('--layer-color', '#2980b9');
        else if (txt.includes('Limite Municipal')) lbl.style.setProperty('--layer-color', '#27ae60');
        else if (txt.includes('Logradouros')) lbl.style.setProperty('--layer-color', '#f39c12');
        else if (txt.includes('Relevo')) lbl.style.setProperty('--layer-color', '#8b4513');
    });

    document.querySelectorAll('.leaflet-control-layers-base label').forEach(lbl => {
        const txt = lbl.textContent.trim();
        if (txt.includes('OpenStreetMap')) lbl.style.setProperty('--layer-color', '#7db817');
        else if (txt.includes('Satélite')) lbl.style.setProperty('--layer-color', '#448aff');
        else if (txt.includes('Carto Light')) lbl.style.setProperty('--layer-color', '#f1c40f');
        else if (txt.includes('Carto Dark')) lbl.style.setProperty('--layer-color', '#34495e');
    });
}

function alternarModoEscuro() {
    document.body.classList.toggle('dark-mode');
    [openStreetMap, satelliteLayer, cartoLight, cartoDark].forEach(l => {
        if (map.hasLayer(l)) {
            map.removeLayer(l);
        }
    });
    if (document.body.classList.contains('dark-mode')) {
        cartoDark.addTo(map);
        setRadioLayerByName('Carto Dark');
    } else {
        cartoLight.addTo(map);
        setRadioLayerByName('Carto Light');
    }
    const sidebarBtn = document.getElementById('toggleDarkModeSidebar');
    if (sidebarBtn) {
        sidebarBtn.textContent = document.body.classList.contains('dark-mode')
            ? '☀️ Alternar Modo Claro'
            : '🌙 Alternar Modo Escuro';
    }
    aplicarCoresLabels();
}

function zoomParaCidade() {
    if (map) {
        map.setView([-22.94978, -42.080], 12);
    }
}

function imprimirMapa() {
    window.print();
}

function mostrarAjuda() {
    alert("📖 Ajuda:\n\n- Use o botão à esquerda para abrir/fechar o menu.\n- Clique nas camadas para ativar/desativar.\n- Clique no mapa para ver coordenadas.\n- Use o botão modo escuro para alterar o tema.");
}

function pesquisarLocal() {
    alert("Função de pesquisa será implementada futuramente.");
}
