<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" class="logo" width="120"/>

# Portal de Mobilidade Urbana – Código-fonte completo

A seguir você encontra **todos os arquivos** – criados do zero – para levantar, em poucos minutos, um portal responsivo que carrega um mapa interativo de Arraial do Cabo-RJ e permite ativar/desativar camadas GeoJSON.
A solução usa apenas Docker, Laravel 11 (opcional), Leaflet, Tailwind CSS e Alpine JS, sem dependências comerciais.

## 1. Estrutura de diretórios

```
portal-mobilidade/
├── docker/
│   ├── nginx/
│   │   └── default.conf
│   └── php/
│       └── Dockerfile
├── docker-compose.yml
├── public/
│   ├── index.html
│   ├── app.js
│   └── style.css
└── data/                  # GeoJSON convertidos via ogr2ogr
    ├── limite_ibge.geojson
    ├── faces_log2022.geojson
    ├── rotas_quadriciclos.geojson
    └── estac_quadriciclos.geojson
```


## 2. Arquivos Docker

### 2.1 `docker/php/Dockerfile`

```dockerfile
FROM php:8.2-fpm-alpine

# Extensões necessárias
RUN docker-php-ext-install pdo pdo_mysql

WORKDIR /var/www/html
COPY public /var/www/html

EXPOSE 9000
CMD ["php-fpm"]
```


### 2.2 `docker/nginx/default.conf`

```nginx
server {
    listen 80;
    server_name _;

    root /var/www/html;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }

    # Gzip estático
    gzip            on;
    gzip_types      text/css application/javascript application/json;
}
```


### 2.3 `docker-compose.yml`

```yaml
version: '3.9'

services:
  php:
    build: ./docker/php
    volumes:
      - ./public_old:/var/www/html:ro
    expose:
      - "9000"

  nginx:
    image: nginx:1.25-alpine
    volumes:
      - ./public_old:/var/www/html:ro
      - ./docker/nginx/default.conf:/etc/nginx/conf.d/default.conf:ro
    ports:
      - "8080:80"
    depends_on:
      - php
```

> Suba tudo com:
> `docker compose up -d --build`

## 3. Front-end (diretório `public/`)

### 3.1 `index.html`

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Portal de Mobilidade – Arraial do Cabo</title>

  <!-- Leaflet -->
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

  <!-- Tailwind via CDN -->
  <script src="https://cdn.tailwindcss.com"></script>

  <!-- Estilos adicionais -->
  <link rel="stylesheet" href="style.css" />
</head>
<body class="h-screen overflow-hidden" x-data="mapApp()" x-init="init()">
  <!-- Barra superior -->
  <header class="bg-blue-600 text-white p-4 flex items-center">
    <button @click="toggleDrawer" class="mr-4 p-2 hover:bg-blue-700 rounded-md">
      <!-- Ícone hamburger -->
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M4 6h16M4 12h16M4 18h16"/>
      </svg>
    </button>
    <h1 class="text-lg font-semibold">Portal de Mobilidade Urbana</h1>
  </header>

  <!-- Área do mapa -->
  <div id="map" class="h-full w-full"></div>

  <!-- Drawer lateral -->
  <div x-show="drawerOpen"
       x-transition.opacity
       class="fixed inset-0 bg-black/40 z-40"
       @click="closeDrawer"></div>

  <aside x-show="drawerOpen"
         x-transition:enter="transition transform duration-300"
         x-transition:enter-start="-translate-x-full"
         x-transition:enter-end="translate-x-0"
         x-transition:leave="transition transform duration-300"
         x-transition:leave-start="translate-x-0"
         x-transition:leave-end="-translate-x-full"
         class="fixed top-0 left-0 z-50 h-screen w-72 bg-white shadow-lg overflow-y-auto">
    <div class="p-4 border-b font-semibold">Camadas disponíveis</div>
    <template x-for="layer in layers" :key="layer.id">
      <div class="flex items-center justify-between px-4 py-2 border-b">
        <label class="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" :value="layer.id"
                 @change="toggleLayer(layer)"
                 x-model="layersOnMap"
                 class="accent-blue-600 h-4 w-4">
          <span x-text="layer.name"></span>
        </label>
        <a :href="layer.url" download
           class="text-blue-500 text-sm hover:underline">Baixar</a>
      </div>
    </template>
  </aside>

  <!-- AlpineJS -->
  <script src="https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js" defer></script>

  <!-- Lógica principal -->
  <script src="app.js"></script>
  <!-- Leaflet JS (carregado após app.js para evitar FOUC no Tailwind) -->
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
</body>
</html>
```


### 3.2 `app.js`

```js
// Dados das camadas – você pode obtê-los via fetch se preferir
const layersCatalog = [
  {
    id: 'limite',
    name: 'Limite Municipal',
    url: 'data/limite_ibge.geojson',
    color: '#1d4ed8',
    type: 'vector'
  },
  {
    id: 'faces',
    name: 'Faces de Logradouro 2022',
    url: 'data/faces_log2022.geojson',
    color: '#16a34a',
    type: 'vector'
  },
  {
    id: 'rotas_quad',
    name: 'Rotas de Quadriciclo',
    url: 'data/rotas_quadriciclos.geojson',
    color: '#d97706',
    type: 'vector'
  },
  {
    id: 'estac_quad',
    name: 'Estacionamento Quadriciclos',
    url: 'data/estac_quadriciclos.geojson',
    color: '#dc2626',
    type: 'vector'
  }
];

function mapApp() {
  return {
    drawerOpen: false,
    layers: layersCatalog,
    layersOnMap: [],
    layerInstances: {},
    map: null,

    init() {
      // Mapa base
      this.map = L.map('map').setView([-22.96574, -42.02799], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap'
      }).addTo(this.map);
      L.control.scale().addTo(this.map);

      // Restaurar camadas salvas (opcional: localStorage)
    },

    toggleDrawer() {
      this.drawerOpen = !this.drawerOpen;
    },
    closeDrawer() {
      this.drawerOpen = false;
    },

    /* Ativa ou desativa camada */
    toggleLayer(layer) {
      if (this.layerInstances[layer.id]) {
        this.map.removeLayer(this.layerInstances[layer.id]);
        delete this.layerInstances[layer.id];
        return;
      }

      if (layer.type === 'vector') {
        fetch(layer.url)
          .then(res => res.json())
          .then(data => {
            const geo = L.geoJSON(data, {
              style: { color: layer.color },
              onEachFeature: (feat, lyr) => {
                const tbl =
                  '<table class="text-xs">' +
                  Object.entries(feat.properties)
                    .map(([k, v]) => `<tr><td class="pr-2 font-medium">${k}</td><td>${v}</td></tr>`)
                    .join('') +
                  '</table>';
                lyr.bindPopup(tbl);
              }
            }).addTo(this.map);
            this.layerInstances[layer.id] = geo;
          });
      }
      // Raster layer (tile) exemplo:
      // if (layer.type === 'raster') { ... }
    }
  };
}
```


### 3.3 `style.css` (apenas ajustes simples)

```css
html, body, #map { height: 100%; }
```


## 4. Conversão dos dados

Converta Shapefiles/KMZ para GeoJSON reprojetados em SIRGAS 2000 / UTM-23S (EPSG 31983):

```bash
ogr2ogr -f GeoJSON -t_srs EPSG:31983 data/limite_ibge.geojson \
        SHAPEFILES/arraialdocabo_limite_ibge/arraialdocabo_limite_ibge.shp
```

Repita para cada camada. GeoJSONs menores carregam mais rápido no navegador.

## 5. Subir a aplicação

```bash
git clone https://seu-repositorio.git portal-mobilidade
cd portal-mobilidade
docker compose up -d --build
```

Acesse em `http://localhost:8080`.

## 6. Próximos passos (opcionais)

| Funcionalidade | Como fazer |
| :-- | :-- |
| Cache das camadas | Hospedar GeoJSON em S3 com CloudFront ou usar Laravel + Redis |
| Autocomplete de logradouros | Índice Fuse.js filtrando `faces_log2022` |
| PostGIS | Adicionar container `postgis/postgis` e usar pacote `clickbar/laravel-magellan` |
| Exportar seleção | `ogr2ogr` via endpoint PHP e `Content-Disposition: attachment` |

Pronto! Com esses arquivos você já tem um **portal de mobilidade** completo, criado do zero, capaz de servir camadas geoespaciais em um mapa interativo e responsivo.

<div style="text-align: center">⁂</div>

[^1]: https://pt.linkedin.com/pulse/criando-um-ambiente-kubernetes-docker-compose-para-projeto-kochen

[^2]: https://stackoverflow.com/questions/20912652/dynamic-php-geo-json-example-with-leaflet-js

[^3]: https://github.com/mstaack/laravel-postgis

[^4]: https://github.com/mhilker/docker-nginx-php-example

[^5]: https://gist.github.com/imrankabir02/fb49cc63a207e77b113803823b2aecad

[^6]: https://marcosteodoro.dev/blog/ambiente-desenvolvimento-laravel-docker/

[^7]: https://geohelm.docs.acugis.com/en/latest/apps/php.html

[^8]: https://laravel-news.com/package/clickbar-laravel-magellan

[^9]: https://marc.it/dockerize-application-with-nginx-and-php8

[^10]: https://dev.to/richardcron/how-to-add-geolocation-based-property-search-map-integration-in-laravel-for-an-airbnb-clone-with-external-apis-3gba

[^11]: https://github.com/cybervoigt/laravel-example-app-01

[^12]: https://leafletjs.com/examples/geojson/

[^13]: https://support.servbay.com/pt/database-management/postgresql-extensions/postgis

[^14]: https://stackoverflow.com/questions/46332919/combining-php-fpm-with-nginx-in-one-dockerfile

[^15]: https://www.youtube.com/watch?v=LTJ5t3fXoXU

[^16]: https://www.youtube.com/watch?v=olZu2L5IxZI

[^17]: https://gis.stackexchange.com/questions/230296/leaflet-from-postgre-via-php-to-geojson-to-website

[^18]: https://kinsta.com/pt/blog/laravel-http/

[^19]: https://www.reddit.com/r/docker/comments/14tgb5n/how_to_configure_correctly_the_nginx_phpfpm_stack/

[^20]: https://github.com/alexpechkarev/google-maps

[^21]: https://www.riannek.de/2024/postgis-with-docker-compose/

[^22]: https://flowbite.com/docs/components/sidebar/

[^23]: https://www.dimins.com/online-help/diveport-admin/80/pdf-files/converting a shapefile to geojson format.pdf

[^24]: https://www.ultimateakash.com/blog-details/Ii1TJGAKYAo=/How-To-Integrate-Leaflet-Maps-in-Laravel-2022

[^25]: https://stackoverflow.com/questions/66205577/how-do-i-add-postgis-to-my-postgresql-setup-using-pure-docker-compose

[^26]: https://stackoverflow.com/questions/70513971/responsive-sidebar-tailwind-css

[^27]: https://gist.github.com/benbalter/5858851

[^28]: https://laravel-news.com/use-leaflet-and-google-maps-blade-components-in-laravel

[^29]: https://www.youtube.com/watch?v=p59ypKD4e_A

[^30]: https://flyonui.com/docs/navigations/sidebar/

[^31]: https://mapscaping.com/ogr2ogr-basics-cheat-sheet/

[^32]: https://github.com/nafiesl/laravel-leaflet-example

[^33]: https://github.com/postgis/docker-postgis/issues/320

[^34]: https://www.youtube.com/watch?v=MszSqhEw__8

[^35]: https://morphocode.com/using-ogr2ogr-convert-data-formats-geojson-postgis-esri-geodatabase-shapefiles/

[^36]: https://leafletjs.com/examples/quick-start/

[^37]: https://postgis.net/documentation/getting_started/install_docker/

[^38]: https://tailwindcss.com/plus/ui-blocks/application-ui/application-shells/sidebar

[^39]: https://gis.stackexchange.com/questions/479481/converting-shapefiles-into-geojson

[^40]: https://packagist.org/packages/ginocampra/laravel-leaflet

[^41]: https://github.com/guygriffiths/leaflet-geojson-filter

[^42]: https://flyonui.com/docs/overlays/drawer/

[^43]: https://docs.docker.com/guides/frameworks/laravel/development-setup/

[^44]: https://github.com/ShabuShabu/laravel-postgis

[^45]: https://stackoverflow.com/questions/21974597/leaflet-js-is-it-possible-to-filter-geojson-features-by-property

[^46]: https://pagedone.io/docs/drawer

[^47]: https://docs.docker.com/guides/frameworks/laravel/production-setup/

[^48]: https://laravel-news.com/package/shabushabu-laravel-postgis

[^49]: https://www.material-tailwind.com/docs/react/drawer

[^50]: https://www.digitalocean.com/community/tutorials/how-to-set-up-laravel-nginx-and-mysql-with-docker-compose-on-ubuntu-20-04

[^51]: https://gis.stackexchange.com/questions/189988/filtering-geojson-data-to-include-in-leaflet-map

[^52]: https://flowbite.com/docs/components/drawer/

[^53]: https://learnlaravel.net/1253/adding-interactive-maps-to-laravel-with-leaflet-js-step-2-installing-leaflet-with-laravel-mix/

[^54]: https://stackoverflow.com/questions/70203259/trouble-configuring-laravel-with-nginx-and-docker-compose

[^55]: https://stackoverflow.com/questions/50412538/laravel-with-postgresql-and-postgis-point

[^56]: https://ppl-ai-code-interpreter-files.s3.amazonaws.com/web/direct-files/dec4c2a0b00ee5d0521872122be9f7a1/174042ed-3ef2-42c7-a209-fcf854f21645/app.js

[^57]: https://ppl-ai-code-interpreter-files.s3.amazonaws.com/web/direct-files/dec4c2a0b00ee5d0521872122be9f7a1/174042ed-3ef2-42c7-a209-fcf854f21645/style.css

[^58]: https://ppl-ai-code-interpreter-files.s3.amazonaws.com/web/direct-files/dec4c2a0b00ee5d0521872122be9f7a1/174042ed-3ef2-42c7-a209-fcf854f21645/index.html

