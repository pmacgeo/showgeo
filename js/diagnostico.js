// --- Funções de atualização do status e diagnóstico ---

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
