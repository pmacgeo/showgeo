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
