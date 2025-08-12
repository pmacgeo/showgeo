// --- Variáveis globais ---
const statusIndicator = document.getElementById('statusIndicator');
let map;
let camadasCarregadas = 0;
let totalCamadas = 4;
let camadasPorTipo = {};
let openStreetMap, satelliteLayer, cartoLight, cartoDark;

// --- Inicialização ---
document.addEventListener('DOMContentLoaded', () => {
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

    hamburgerBtn.addEventListener('click', () => {
        const aberto = sideMenu.classList.toggle('open');
        sideMenu.classList.toggle('closed', !aberto);
        document.body.classList.toggle('menu-open', aberto);
        hamburgerBtn.textContent = aberto ? '✖' : '☰';
    });

    const btnDarkHeader = document.getElementById('toggleDarkMode');
    const btnDarkSidebar = document.getElementById('toggleDarkModeSidebar');

    if (btnDarkHeader) btnDarkHeader.addEventListener('click', alternarModoEscuro);
    if (btnDarkSidebar) btnDarkSidebar.addEventListener('click', alternarModoEscuro);
});
