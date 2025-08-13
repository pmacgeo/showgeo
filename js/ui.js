function preencherGruposNoMenu(baseIBGE, basePMAC) {
    const grupoBase = document.getElementById('grupoBase');
    const grupoIBGE = document.getElementById('grupoIBGE');
    const grupoPMAC = document.getElementById('grupoPMAC');

    // 1 — Radios para mapas base + opção nenhum
    adicionarRadioBase(grupoBase, 'Nenhum mapa base', null);
    [
        { nome: 'OpenStreetMap', layer: openStreetMap },
        { nome: 'Imagem de Satélite', layer: satelliteLayer },
        { nome: 'Carto Light', layer: cartoLight },
        { nome: 'Carto Dark', layer: cartoDark }
    ].forEach(b => adicionarRadioBase(grupoBase, b.nome, b.layer));

    // 2 — IBGE com cor nos labels
    const coresIBGE = {
        'Limite Estadual': '#2980b9',
        'Limite Municipal': '#27ae60',
        'Logradouros': '#f39c12',
        'Relevo': '#8b4513'
    };
    Object.entries(baseIBGE).forEach(([nome, layer]) => {
        adicionarCheckboxLayer(grupoIBGE, nome, layer, false, coresIBGE[nome]);
    });

    // Zoneamentos (PMAC)
    Object.entries(basePMAC).forEach(([nome, layer]) => {
        adicionarCheckboxLayer(grupoPMAC, nome, layer, true);
    });

    // 3 — Botão zoneamentos sincroniza checkboxes
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

function adicionarCheckboxLayer(container, nome, layer, isZoneamento = false, cor = null) {
    const label = document.createElement('label');
    const check = document.createElement('input');
    check.type = 'checkbox';
    check.checked = map.hasLayer(layer);
    check.addEventListener('change', () => {
        if (check.checked) layer.addTo(map);
        else map.removeLayer(layer);
    });
    label.appendChild(check);
    label.appendChild(document.createTextNode(nome));

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
        else if (txt.includes('PMAC Dados 1')) lbl.style.setProperty('--layer-color', '#e67e22');
        else if (txt.includes('PMAC Dados 2')) lbl.style.setProperty('--layer-color', '#c0392b');
    });

    document.querySelectorAll('.leaflet-control-layers-base label').forEach(lbl => {
        const txt = lbl.textContent.trim();
        if (txt.includes('OpenStreetMap')) lbl.style.setProperty('--layer-color', '#7db817');
        else if (txt.includes('Satélite')) lbl.style.setProperty('--layer-color', '#448aff');
        else if (txt.includes('Carto Light')) lbl.style.setProperty('--layer-color', '#f1c40f');
        else if (txt.includes('Carto Dark')) lbl.style.setProperty('--layer-color', '#34495e');
    });
}

// Troca somente o mapa base no dark mode sem tocar nas outras camadas
function alternarModoEscuro() {
    document.body.classList.toggle('dark-mode');

    // Remove apenas as camadas base
    [openStreetMap, satelliteLayer, cartoLight, cartoDark].forEach(l => {
        if (map.hasLayer(l)) {
            map.removeLayer(l);
        }
    });

    // Adiciona o tile base conforme o modo
    if (document.body.classList.contains('dark-mode')) {
        cartoDark.addTo(map);
        setRadioLayerByName('Carto Dark');
    } else {
        cartoLight.addTo(map);
        setRadioLayerByName('Carto Light');
    }

    // Atualiza texto do botão na sidebar
    const sidebarBtn = document.getElementById('toggleDarkModeSidebar');
    if (sidebarBtn) {
        sidebarBtn.textContent = document.body.classList.contains('dark-mode')
            ? '☀️ Alternar Modo Claro'
            : '🌙 Alternar Modo Escuro';
    }

    aplicarCoresLabels();
}

// Botão Zoom para cidade (ajuste mapa.setView conforme necessidade)
function zoomParaCidade() {
    if (map) {
        map.setView([-22.94978, -42.080], 12);
    }
}

// Funções extras para imprimir, ajuda e futura pesquisa
function imprimirMapa() {
    window.print();
}

function mostrarAjuda() {
    alert("📖 Ajuda:\n\n- Use o botão à esquerda para abrir/fechar o menu.\n- Clique nas camadas para ativar/desativar.\n- Clique no mapa para ver coordenadas.\n- Use o botão modo escuro para alterar o tema.");
}

function pesquisarLocal() {
    alert("Função de pesquisa será implementada futuramente.");
}
