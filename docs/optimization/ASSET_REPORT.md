# Asset report

`public` определяет почти весь размер артефакта: production `dist` остаётся около 96 MB, хотя
initial network payload сокращён. Главные источники — шесть GLB по 7–16 MB.

| Категория | Вывод                                                                     |
| --------- | ------------------------------------------------------------------------- |
| GLB       | 81+ MB; не precache, не initial fetch, загружаются только при открытии 3D |
| Video     | `bt-3.mp4` 2,85 MB; не precache                                           |
| Images    | крупнейшие `c3.png` 2,33 MB и `ka-1.jpeg` 1,71 MB                         |
| Geo/data  | разбиты Vite dynamic chunks и загружаются вместе с map experience         |
| PWA       | 33 entries / 431,53 KiB; models, images, MapView JS/CSS и stats исключены |

Оригиналы не удалялись и не перекодировались: визуальное сравнение AVIF/WebP с исходниками требует
ручного контроля качества и согласования. Existing gallery/model loading сохранено. Рекомендация:

1. прогнать GLB через `gltf-transform optimize` с визуальной проверкой каждой модели;
2. создать AVIF/WebP variants для PNG/JPEG больше 250 KB;
3. добавить реальный raster OG preview 1200x630;
4. хранить большие immutable media в CDN/Object Storage, а не в deployment bundle.
