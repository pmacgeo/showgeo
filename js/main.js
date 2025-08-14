// --- Variáveis globais ---
const statusIndicator = document.getElementById('statusIndicator');
// let map;
let camadasCarregadas = 0;
let totalCamadas = 4;
// let camadasPorTipo = {};
// let openStreetMap, satelliteLayer, cartoLight, cartoDark;

// --- Função global para marcar o radio do mapa base pelo nome ---
function setRadioLayerByName(name) {
    const radios = document.querySelectorAll('input[name="mapBase"]');
    radios.forEach(radio => {
        if (radio.nextSibling.textContent.trim() === name) {
            radio.checked = true;
        }
    });
}

// --- Função para iniciar o mapa já com a camada satélite ativada ---
function inicializarMapaComSatelite() {
    // Remove todas as camadas base ativas
    [openStreetMap, satelliteLayer, cartoLight, cartoDark].forEach(layer => {
        if (map.hasLayer(layer)) {
            map.removeLayer(layer);
        }
    });
    // Adiciona a camada satélite
    satelliteLayer.addTo(map);
    // Marca o rádio "Imagem de Satélite"
    setRadioLayerByName('Imagem de Satélite');
}

document.addEventListener('DOMContentLoaded', () => {
    // Ativa modo escuro por padrão
    document.body.classList.add('dark-mode');

    const sidebarBtn = document.getElementById('toggleDarkModeSidebar');
    if (sidebarBtn) {
        sidebarBtn.textContent = '☀️ Alternar Modo Claro';
    }

    // Inicializa o mapa
    inicializarMapa();

    // Aguarda para garantir que o mapa esteja criado, depois ativa o satélite
    setTimeout(inicializarMapaComSatelite, 300);

    // Controle da abertura do menu lateral conforme tamanho da tela
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

    // Atualiza diagnóstico a cada 2 segundos
    setInterval(atualizarDiagnostico, 2000);

    // Botão hambúrguer do menu lateral
    const sideMenu = document.getElementById('sideMenu');
    const hamburgerBtn = document.getElementById('hamburgerBtn');

    hamburgerBtn.addEventListener('click', () => {
        const aberto = sideMenu.classList.toggle('open');
        sideMenu.classList.toggle('closed', !aberto);
        document.body.classList.toggle('menu-open', aberto);
        hamburgerBtn.textContent = aberto ? '✖' : '☰';
    });

    // Botões de modo escuro
    const btnDarkHeader = document.getElementById('toggleDarkMode');
    const btnDarkSidebar = document.getElementById('toggleDarkModeSidebar');
    if (btnDarkHeader) btnDarkHeader.addEventListener('click', alternarModoEscuro);
    if (btnDarkSidebar) btnDarkSidebar.addEventListener('click', alternarModoEscuro);

    // Botões de ação do mapa
    document.getElementById('btnZoomCity').addEventListener('click', zoomParaCidade);
    document.getElementById('btnPrint').addEventListener('click', imprimirMapa);
    document.getElementById('btnHelp').addEventListener('click', mostrarAjuda);
    // document.getElementById('searchBtn').addEventListener('click', pesquisarLocal);

    // Fecha o menu lateral ao clicar fora
    // document.addEventListener('click', (e) => {
    //     const clicouFora = !sideMenu.contains(e.target) && !hamburgerBtn.contains(e.target);
    //     if (sideMenu.classList.contains('open') && clicouFora) {
    //         sideMenu.classList.remove('open');
    //         sideMenu.classList.add('closed');
    //         document.body.classList.remove('menu-open');
    //         hamburgerBtn.textContent = '☰';
    //     }
    // });
});
