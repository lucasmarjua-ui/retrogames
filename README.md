# RetroGames

RetroGames es un portal web estático inspirado en los salones recreativos de los años 80. Reúne juegos arcade hechos con HTML, CSS, JavaScript vanilla y Canvas API, con una identidad visual común de neón, tipografía pixel-art y scanlines CRT sutiles.

## Jugar localmente

No hay dependencias ni build step. Se puede abrir `index.html` directamente en el navegador. Para una experiencia equivalente a GitHub Pages, sirve la raíz con cualquier servidor estático, por ejemplo:

```bash
python -m http.server 8000
```

Luego visita `http://localhost:8000`.

## Juegos actuales

- **Snake**: serpiente en grilla, manzanas, velocidad creciente y monedas al finalizar.
- **Pac-Man**: laberinto simplificado, pellets, power pellets y fantasmas con IA básica.
- **Tetris**: siete piezas clásicas, niveles y líneas puntuadas.
- **Breakout**: pala, bloques de colores, rebotes y vidas limitadas.
- **Space Invaders**: oleadas, disparos enemigos y defensa horizontal.
- **Asteroids**: nave con inercia, asteroides divisibles y oleadas crecientes.

Los controles son las flechas del teclado. Cada partida actualiza su récord y puede otorgar monedas al wallet global.

## Cuentas y progreso

RetroGames funciona como invitado sin registro: las monedas, récords, skins y logros se guardan en `localStorage` y el jugador puede continuar jugando offline. Desde **PLAYER LOGIN** se puede crear una cuenta o iniciar sesión con Firebase Authentication (email y contraseña). Al entrar, el progreso local se fusiona con el documento `users/{uid}` de Firestore y los cambios posteriores se guardan en ambos sitios. Cerrar sesión vuelve al modo invitado sin borrar los datos locales.

La `firebaseConfig` incluida es configuración pública de cliente, no un secreto. La seguridad real depende de las reglas de Firestore y de Authentication.

## Trofeos y logros

Cada juego tiene tres logros propios, con objetivos de bronce, plata y oro basados en acciones de juego además del puntaje. El botón `T` de cada tarjeta abre el detalle y muestra tanto los logros desbloqueados como los pendientes. Los desbloqueos se persisten en `localStorage` y se sincronizan con la cuenta Firebase cuando hay una sesión activa.

## Racha y tragaperras

El portal registra una racha diaria en `retrogames.streak` y entrega monedas al volver cada día, hasta un máximo de siete días de recompensa. La sección **TRAGAPERRAS** permite gastar monedas en tiradas con premios por dos o tres símbolos iguales.

## Arquitectura

```text
index.html                 Portal y selección de juegos
games/snake/               Página y lógica de Snake
games/pacman/              Página y lógica de Pac-Man
shared/theme.css           Variables, tipografía, layout y HUD visual
shared/wallet.js           Monedero global persistido en localStorage
shared/storage.js          Persistencia genérica namespaced por juego
shared/records.js          Récords y cálculo de medallas
shared/games-registry.js   Catálogo que consume el portal
shared/hud.js              Contrato común para score y monedas
shared/skins.js            Catálogo, compra y equipamiento de skins CSS
shared/audio.js            SFX y música chiptune sintetizados con Web Audio
shared/firebase-config.js  Configuración e inicialización del SDK Firebase CDN
shared/auth.js             Registro, login, invitado y sincronización Firestore
shared/achievements.js     Catálogo y persistencia de logros por juego
shared/streak.js           Racha diaria y recompensa de monedas
shared/slot-machine.js     Lógica de la tragaperras
shared/tutorial.js         Tutorial de controles por juego, una sola vez
about.html                 Página de información del proyecto
assets/                    Recursos opcionales futuros
```

### Cómo agregar un juego

1. Crea `games/<id>/index.html` y su script JavaScript con Canvas.
2. Importa `Wallet`, `mountHud`, `saveScore` y `getBestScore` desde `shared/`.
3. Añade una entrada a `shared/games-registry.js` con `id`, título, descripción, ruta, clase visual y umbrales `bronze`, `silver`, `gold`.
4. El portal mostrará automáticamente la nueva tarjeta y su medalla; no hace falta modificar `index.html`.

El wallet usa la clave global `retrogames.wallet`, mientras que los datos persistentes de cada juego viven bajo `retrogames.game-data` y su propio `gameId`. Así, cambiar de juego o cerrar el navegador no borra las monedas ni los mejores puntajes.

## GitHub Pages

El workflow `.github/workflows/deploy.yaml` publica los archivos estáticos en cada push a `main`, sin compilación. Después de crear el repositorio, activa Pages una sola vez en **Settings → Pages → Source: GitHub Actions**. Ese toggle no se puede configurar mediante Git.

El sitio quedará disponible en `https://lucasmarjua-ui.github.io/retrogames/` cuando el primer deploy termine.

## Roadmap

Ideas futuras: PWA instalable, soporte táctil para los juegos y tablas online.

## Licencia

MIT. Copyright Lucas Martinez, 2026. Ver [LICENSE](LICENSE).
