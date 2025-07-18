<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" class="logo" width="120"/>

# Portal de Mobilidade Urbana de Arraial do Cabo – Proposta de Arquitetura, Bases e Demonstração de Valor

O novo Portal de Mobilidade Urbana integra **geoprocessamento moderno, dados públicos e um front-end responsivo** para apoiar decisões da Secretaria de Mobilidade Urbana (SMU) e ampliar a transparência para cidadãos e turistas. A seguir descrevemos a arquitetura recomendada, fluxo de dados, preparo das bases e exemplos de camadas temáticas que podem ser filtradas no mapa interativo.

![Arquitetura de contêineres Docker proposta para o portal](https://user-gen-media-assets.s3.amazonaws.com/gpt4o_images/bdd3a7ac-a236-4c9d-b1ba-9cdcda889b19.png)

Arquitetura de contêineres Docker proposta para o portal

## 1. Visão Geral do Projeto

- **Objetivo principal:** disponibilizar em um só ambiente as camadas geoespaciais municipais (limite IBGE, relevo, faces de logradouro, rotas de quadriciclo, estacionamentos, TRLVs, etc.) e criar filtros temáticos para planejamento viário, turismo e fiscalização.
- **Benefícios imediatos:**
    - suporte técnico a estudos de ciclovias, acessibilidade e sinalização viária[^1][^2]
    - consolidação de bases dispersas em formato **GeoJSON** consumido pelo Leaflet[^3]
    - publicação de camadas no padrão **SIRGAS 2000 / UTM 23S (EPSG 31983)**, evitando erros de sobreposição[^4][^5]


## 2. Arquitetura Docker-Laravel

A solução utiliza três serviços em contêineres:


| Serviço | Imagem base | Função |
| :-- | :-- | :-- |
| nginx | nginx:alpine | Proxy reverso, serve assets, compressão Gzip |
| php-fpm | php:8.2-fpm | Aplicação Laravel 11, rota `/api/geo` (GeoJSON paginado) |
| db | postgis:15 | PostGIS opcional para análises espaciais e cache de consultas |

Volumes mapeiam os diretórios `storage/JSON`, `storage/KMZ` e `storage/SHAPEFILES` para dentro do contêiner PHP. A versão **somente front-end** é compilada via Vite e pode ser hospedada como site estático em S3 ou GitHub Pages.

![Fluxo de dados do portal geoespacial](https://user-gen-media-assets.s3.amazonaws.com/gpt4o_images/54286b3b-4240-4fca-bab0-2b70397f04d4.png)

Fluxo de dados do portal geoespacial

## 3. ETL das Fontes de Dados

### 3.1 Shapefiles

1. Conversão com **GDAL/ogr2ogr** para GeoJSON, reprojetando para EPSG 31983:
```
ogr2ogr -t_srs EPSG:31983 \
  /app/public/data/limite_ibge.geojson \
  /data/SHP/arraialdocabo_limite_ibge.shp
```

2. Indexação espacial (`CREATE INDEX USING GIST`) se armazenado no PostGIS.

### 3.2 Arquivos KMZ/KML

- Extração via `unzip` + `ogr2ogr`.
- Rotas de quadriciclo e pontos turísticos recebem atributo `categoria` para filtragem rápida no Leaflet[^6][^7].


### 3.3 JSON IBGE

- O arquivo `3300258_faces_de_logradouros_2022.json` já contém GEOJSON; basta validar CRS e inserir metadados (`tipo_via`, `codigo_face`).


## 4. API Laravel

```php
Route::get('/api/geo/{layer}', GeoController::class);

class GeoController
{
    public function __invoke(Request $req, $layer)
    {
        $path = storage_path("app/public_old/data/{$layer}.geojson");
        return response()->file($path, ['Content-Type'=>'application/geo+json']);
    }
}
```

- O front-end chama `/api/geo/limite_ibge?bbox=...&props=categoria` usando `fetch` e carrega no mapa como `L.geoJSON`.
- Middleware de **cache** em Redis garante respostas em < 200 ms para camadas pesadas.


## 5. Interface Mapas \& Filtros

### 5.1 Camadas essenciais

| Camada | Formato | Uso |
| :-- | :-- | :-- |
| Limite municipal | GeoJSON | recorte base para todas as análises |
| Faces de logradouro | GeoJSON | endereçamento, roteirização de frota escolar[^8][^9] |
| Rotas de quadriciclos | GeoJSON | ordenamento turístico e fiscalização[^10][^11] |
| Estacionamentos de buggy/quadriciclo | GeoJSON | gestão de carga em alta temporada[^12] |
| Altimetria \& relevo | GeoTIFF/PNG hillshade | planejamento de ciclovias e drenagem[^2] |
| Bairros IBGE | GeoJSON | relatórios socioeconômicos[^13][^14] |

### 5.2 Funcionalidades

- **Filtro por camada e categoria** (ex.: mostrar só TRLVs com status “concluído”).
- **Busca de logradouro** autocompleta usando index JSON.
- **Exportar seleção**: usuário pode baixar o recorte em shapefile, ativando rota Laravel que chama `ogr2ogr`.


## 6. Responsividade \& Acessibilidade

- Layout em **Tailwind CSS** com grid “sidebar à esquerda + mapa” que colapsa em mobile.
- Contraste e legendas WCAG 2.1.
- Atalhos de teclado “Shift + .” para focar no mapa.


## 7. Fluxo de Deploy

1. `docker compose build` – PHP instala dependências Composer e Node.
2. `docker compose up -d` – containers sobem em rede interna.
3. `php artisan migrate --seed` (opcional PostGIS).
4. CLI `php artisan geo:import` converte todos os shapefiles/KMZ uma vez.

CI/CD: GitHub Actions testa, gera imagens e envia para registry.

## 8. Próximos Passos

- **Dashboard de indicadores**: integrar a API do IBGE para dados de população residente e usar Chart.js.
- **Geolocalização em tempo real**: usar MQTT + Leaflet.Realtime para monitorar bicicletas públicas.
- **Módulo de participação popular**: coletar sugestões via formulário conectado ao banco PostGIS.


## 9. Conclusão

Com esta arquitetura, a SMU obtém um **portal unificado, escalável e de baixo custo**, capaz de:

- Servir dados oficiais em padrão aberto GeoJSON.
- Facilitar análises de mobilidade (fluxo de turistas, estacionamento de quadriciclos, ciclovias).
- Fomentar a transparência e o engajamento da comunidade.

A estrutura em Docker garante portabilidade entre servidores da Prefeitura ou nuvem; a separação API ↔ front-end permite publicar também a versão estática para consumo público sem expor o back-end municipal.

Assim, Arraial do Cabo dá um passo decisivo rumo a uma **gestão de mobilidade baseada em evidências espaciais e acessível a todos**.

<div style="text-align: center">⁂</div>

[^1]: https://www.geopixel.com.br/a-influencia-da-geotecnologia-no-planejamento-urbano-e-infraestrutura-desafios-e-oportunidades/

[^2]: https://rigeo.sgb.gov.br/handle/doc/23690

[^3]: https://www.packtpub.com/en-us/learning/how-to-tutorials/shapefiles-leaflet

[^4]: https://products.aspose.app/gis/pt/epsg/code-31983

[^5]: https://spatialreference.org/ref/epsg/31983/

[^6]: https://github.com/sntran/kmz-geojson

[^7]: https://www.npmjs.com/package/parse2-kmz

[^8]: https://saberaberto.homologacao.uneb.br/items/5030874d-4da0-4827-97b0-122db19b3bd6

[^9]: https://bdtd.ibict.br/vufind/Record/UPF-1_63c16c5a10ac8dc1c0f13722e564dbe7

[^10]: https://jornaldesabado.net/arraial-do-cabo-mirante-da-prainha-vai-contar-com-ciclovia/

[^11]: https://www.civitatis.com/br/arraial-do-cabo/tour-quadriciclo-arraial-cabo/

[^12]: https://www.marica.rj.gov.br/marica-mobilidade/

[^13]: https://www.ibge.gov.br/geociencias/todos-os-produtos-geociencias/15761-areas-dos-municipios.html

[^14]: https://www.ibge.gov.br/cidades-e-estados/rj/arraial-do-cabo.html

[^15]: https://www.geopixel.com.br/geoprocessamento/

[^16]: https://seer.ufrgs.br/index.php/bgg/article/view/37397

[^17]: https://aeroengenharia.com/glossario/o-que-e-planejamento-urbano-com-geotecnologia/

[^18]: https://pluris2020.faac.unesp.br/Paper1132.pdf

[^19]: https://sigte.com.br

[^20]: https://ssr.com.br/beneficios-geoprocessamento-monitoramento-transporte/

[^21]: https://www.cartografia.org.br/cbc/2017/trabalhos/5/325.html

[^22]: https://poloplanejamento.com/blog/como-utilizar-o-geoprocessamento-no-planejamento-urbano/

[^23]: http://observatoriodageografia.uepg.br/s/ogb/item/34285

[^24]: https://seer.ufu.br/index.php/caminhosdegeografia/article/download/15396/8695/58174

[^25]: https://editoraessentia.iff.edu.br/index.php/ENGEO/article/view/1656/840

[^26]: https://run.unl.pt/bitstream/10362/7388/1/Aplicabilidade dos SIG na Gestão dos Transporte Publicos_Caso%20de%20Estudo%20Almada.pdf

[^27]: https://www.redalyc.org/pdf/5769/576963572006.pdf

[^28]: https://doity.com.br/curso-de-geoprocessamento-aplicado-mobilidade-urbana-plataforma-qgis

[^29]: https://ojs.revistacontemporanea.com/ojs/index.php/home/article/view/308

[^30]: https://homepages.dcc.ufmg.br/~clodoveu/files/100.40/AC011. 1996 Geoprocessamento no sistema de transporte e transito de Belo Horizonte.pdf

[^31]: https://seer.ufrgs.br/index.php/bgg/article/view/37397/24144

[^32]: https://www.ultimateakash.com/blog-details/Ii1TJGAKYAo=/How-To-Integrate-Leaflet-Maps-in-Laravel-2022

[^33]: https://www.digitalocean.com/community/tutorials/how-to-set-up-laravel-nginx-and-mysql-with-docker-compose-on-ubuntu-20-04

[^34]: https://github.com/nafiesl/laravel-leaflet-example

[^35]: https://github.com/ishaqadhel/docker-laravel-mysql-nginx-starter

[^36]: https://stackoverflow.com/questions/43478121/display-shapefile-on-leaflet-map-using-an-uploaded-file-zip

[^37]: https://packagist.org/packages/ginocampra/laravel-leaflet

[^38]: https://docs.docker.com/guides/frameworks/laravel/development-setup/

[^39]: https://www.chatdb.ai/tools/shapefile-viewer

[^40]: https://leafletjs.com/examples/quick-start/

[^41]: https://docs.docker.com/guides/frameworks/laravel/production-setup/

[^42]: https://github.com/calvinmetcalf/leaflet.shapefile

[^43]: https://learnlaravel.net/1253/adding-interactive-maps-to-laravel-with-leaflet-js-step-2-installing-leaflet-with-laravel-mix/

[^44]: https://alisonjuliano.com/docker-ambiente-de-desenvolvimento-php-laravel-com-nginx-e-mysql/

[^45]: https://www.youtube.com/watch?v=XI4E5sjnjDI

[^46]: https://laravel-news.com/use-leaflet-and-google-maps-blade-components-in-laravel

[^47]: https://www.youtube.com/watch?v=H_GYFOBmPjQ

[^48]: https://equatorstudios.com/shapefile-viewer/

[^49]: https://themesbrand.com/velzon/docs/laravel/leaflet.html

[^50]: https://www.youtube.com/watch?v=oWNBwHtfOt4

[^51]: https://forest-gis.com/download-de-shapefiles/

[^52]: https://pt.wikipedia.org/wiki/Arraial_do_Cabo

[^53]: https://github.com/r-brasil/shapefile

[^54]: https://map.mec.gov.br/attachments/download/64632/Template MDI com a 4ª EDICAO_GUIA_FIC_3%C2%AA_EDICAO_CNCT_atualizado_10.04.2017.xlsx

[^55]: https://www.aemerj.org.br/images/pdf/PMMA/PMMAArraialdoCabo.pdf

[^56]: https://softwarepublico.gov.br/gitlab/gsan/geosan/wikis/ProjecoesCartograficasUtilizadasNoBrasil

[^57]: https://geoftp.ibge.gov.br/cartas_e_mapas/mapas_municipais/colecao_de_mapas_municipais/2020/RJ/arraial_do_cabo/3300258_MM.pdf

[^58]: https://www.lcg.ufrj.br/thesis/tarsus-magnus-MSc.pdf

[^59]: https://geoftp.ibge.gov.br/cartas_e_mapas/mapas_municipais/colecao_de_mapas_municipais/2022/RJ/arraial_do_cabo/A0_3300258_MM.pdf

[^60]: https://www.gov.br/icmbio/pt-br/assuntos/biodiversidade/unidade-de-conservacao/unidades-de-biomas/marinho/lista-de-ucs/resex-marinha-do-arraial-do-cabo

[^61]: https://www.der.rj.gov.br/documentos/mapas/Mapa do Rio de Janeiro.pdf

[^62]: https://epsg.io/?q=Brazil\&page=2

[^63]: https://ipsbrasil.org.br/en/explore/dados/download?sort_order=asc\&sort_by=hcsap\&page=352\&per_page=10

[^64]: https://www.rj.gov.br/drm/sites/default/files/arquivos_paginas/Arraial%20do%20Cabo.pdf

[^65]: https://epsg.io/?q=31983++kind%3ACRS

[^66]: https://gasparesganga.com/labs/php-shapefile/

[^67]: https://gis.stackexchange.com/questions/150977/convert-a-shapefile-to-geojson-with-php

[^68]: https://github.com/teamzac/laravel-shapefiles

[^69]: https://stackoverflow.com/questions/58851248/upload-json-shp-kml-kmz-file-and-convert-it-into-geojson

[^70]: https://www.statsilk.com/maps/convert-esri-shapefile-map-geojson-format

[^71]: https://php-download.com/package/laravel-shtb/php-shapefile

[^72]: https://github.com/allebb/cartographer

[^73]: https://github.com/gasparesganga/php-shapefile

[^74]: https://gis.stackexchange.com/questions/324979/how-can-i-convert-kmz-file-to-json

[^75]: https://mygeodata.cloud/converter/geojson-to-shp

[^76]: https://packagist.org/packages/laravel-shtb/php-shapefile

[^77]: https://mygeodata.cloud/converter/kmz-to-geojson

[^78]: https://geophp.net

[^79]: https://www.webgis.dev/posts/loading-shape-files-in-postgis-with-qgis

[^80]: https://kmz2shp.com

[^81]: https://stackoverflow.com/questions/46729002/convert-csv-geojson-shape-file-to-dxf-file-in-php

[^82]: https://www.webgis.dev

[^83]: https://github.com/albertrein/google-maps-kmz-convert-geoJson

[^84]: https://ceteclins.com.br/sig-para-o-planejamento-urbano/

[^85]: https://enterprise.arcgis.com/pt-br/portal/11.2/use/shapefiles.htm

[^86]: https://www.rio.rj.gov.br/web/pmus/mapa-da-rede-de-transportes

[^87]: https://brisabiketour.wordpress.com

[^88]: https://publicacoes.amigosdanatureza.org.br/index.php/anap_brasil/article/download/1675/1662

[^89]: https://enterprise.arcgis.com/pt-br/portal/10.6/use/access-data.htm

[^90]: https://www.tripadvisor.com.br/Attractions-g1056623-Activities-c61-t211-Arraial_do_Cabo_State_of_Rio_de_Janeiro.html

[^91]: https://urbanismo.niteroi.rj.gov.br

[^92]: https://www.youtube.com/watch?v=2cBKjaXR0QQ

[^93]: https://blog.img.com.br/governo/sig-em-prefeituras/

[^94]: https://support.esri.com/pt-br/knowledge-base/how-to-download-publicly-shared-data-from-arcgis-online-000015899

[^95]: https://www.viagem20.com.br/experiencia/passeio-de-quadriciclo-porto-seguro

[^96]: https://www.marica.rj.gov.br/marica-mobilidade/documentos/

[^97]: https://www.viajenaviagem.com/destino/arraial-do-cabo/o-que-fazer/

[^98]: https://publicacoes.amigosdanatureza.org.br/index.php/anap_brasil/article/view/1675

[^99]: https://hoteisquintadosol.com/passeio-quadriciclo-porto-seguro/

