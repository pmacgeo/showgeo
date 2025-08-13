// ui.js
function preencherGruposNoMenu(baseIBGE, basePMAC) {
    const grupoBase = document.getElementById('grupoBase');
    const grupoIBGE = document.getElementById('grupoIBGE');
    const grupoPMAC = document.getElementById('grupoPMAC');

    // Mapas base
    [
        { nome: 'OpenStreetMap', layer: openStreetMap },
        { nome: 'Imagem de Satélite', layer: satelliteLayer },
        { nome: 'Carto Light', layer: cartoLight },
        { nome: 'Carto Dark', layer: cartoDark }
    ].forEach(b => adicionarCheckboxLayer(grupoBase, b.nome, b.layer));

    // IBGE - dados abertos
    Object.entries(baseIBGE).forEach(([nome, layer]) => {
        adicionarCheckboxLayer(grupoIBGE, nome, layer);
    });

    // PMAC - dados coletados (zoneamentos)
    Object.entries(basePMAC).forEach(([nome, layer]) => {
        adicionarCheckboxLayer(grupoPMAC, nome, layer, true);
    });

    // Botão para ativar/desativar todos os zoneamentos
    const btnToggle = document.getElementById('toggleAllZoneamentos');
    btnToggle.addEventListener('click', () => {
        const algumAtivo = Object.values(basePMAC).some(l => map.hasLayer(l));
        Object.values(basePMAC).forEach(layer => {
            if (algumAtivo) map.removeLayer(layer);
            else layer.addTo(map);
        });
    });
}

function adicionarCheckboxLayer(container, nome, layer, isZoneamento = false) {
    const label = document.createElement('label');
    label.style.display = 'flex';
    label.style.alignItems = 'center';
    label.style.gap = '6px';

    const check = document.createElement('input');
    check.type = 'checkbox';
    check.checked = map.hasLayer(layer);

    check.addEventListener('change', () => {
        if (check.checked) layer.addTo(map);
        else map.removeLayer(layer);
    });

    label.appendChild(check);

    const textNode = document.createTextNode(nome);
    label.appendChild(textNode);

    // Estilo para zoneamentos com cores diferenciadas
    if (isZoneamento) {
        const zoneamentoCores = {
            'Zona ZCVS': '#FF7800',
            'Zona EC': '#abcdef',
            'Zona ZEDS': '#3498db',
            'Zona ZEIS': '#2ecc71',
            'Zona ZEN': '#8e44ad',
            'Zona ZEP': '#27ae60',
            'Zona ZH': '#c0392b',
            'Zona ZIC': '#f39c12',
            'Zona ZIE': '#d35400',
            'Zona ZOC': '#1abc9c',
            'Zona ZO': '#9b59b6',
            'Zona ZP': '#34495e',
            'Zona ZPORT': '#2c3e50',
            'Zona ZPVS': '#16a085',
            'Zona ZR': '#e74c3c',
            'Zona ZUC': '#8e44ad',
            'Zona ZUESP': '#2980b9',
            'Zona ZUR2': '#7f8c8d'
        };
        if(zoneamentoCores[nome]) {
            label.style.borderLeft = `8px solid ${zoneamentoCores[nome]}`;
            label.style.paddingLeft = '8px';
        }
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

function alternarModoEscuro() {
    document.body.classList.toggle('dark-mode');
    map.eachLayer(layer => map.removeLayer(layer));
    if (document.body.classList.contains('dark-mode')) {
        cartoDark.addTo(map);
    } else {
        openStreetMap.addTo(map);
    }
    Object.values(camadasPorTipo).forEach(camada => camada?.addTo(map));

    const sidebarBtn = document.getElementById('toggleDarkModeSidebar');
    if (sidebarBtn)
        sidebarBtn.textContent = document.body.classList.contains('dark-mode') ? '☀️ Alternar Modo Claro' : '🌙 Alternar Modo Escuro';

    aplicarCoresLabels();
}

// --- Botão Zoom para cidade ---
function zoomParaCidade() {
    if (map) {
        map.setView([-22.9663, -42.0278], 13);
    }
}

// --- Botão Imprimir ---
function imprimirMapa() {
    window.print();
}

// --- Botão Ajuda ---
function mostrarAjuda() {
    alert("📖 Ajuda:\n\n- Use o botão à esquerda para abrir/fechar o menu.\n- Clique nas camadas para ativar/desativar.\n- Clique no mapa para ver coordenadas.\n- Use o botão modo escuro para alterar o tema.");
}

// --- Botão Pesquisar ---
// function pesquisarLocal() {
//     const termo = document.getElementById('searchInput').value.trim();
//     if (!termo) {
//         alert("Digite um local ou endereço para pesquisar.");
//         return;
//     }
//     alert(`Pesquisa futura para: ${termo}\n\n(Será implementada geocodificação)`);
// }
