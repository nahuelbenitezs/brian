# ⚡ DBZ × Pokémon: Anime Clash 3D 🥋

Un juego de lucha 3D para navegador web, diseñado especialmente para pantallas táctiles de celulares y listo para publicar en **GitHub Pages**.

---

## 🚀 Cómo publicarlo en GitHub Pages (para jugarlo desde el celular)

Sigue estos 3 sencillos pasos para que el hermano de tu novia (o cualquiera) pueda jugarlo desde su celular con un link:

### Paso 1: Crear el repositorio en GitHub
1. Entra a [github.com](https://github.com) e inicia sesión.
2. Haz clic en **"New Repository"** (Nuevo repositorio).
3. Ponle un nombre, por ejemplo: `dbz-pokemon-3d`.
4. Asegúrate de marcarlo como **Public** (Público) y haz clic en **Create repository**.

### Paso 2: Subir los archivos
Abre tu terminal en la carpeta del juego (`bri`) y ejecuta:
```bash
git init
git add .
git commit -m "Primer lanzamiento de DBZ x Pokémon 3D"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/dbz-pokemon-3d.git
git push -u origin main
```
*(Reemplaza `TU_USUARIO` por tu nombre de usuario de GitHub)*

> 💡 **O si prefieres sin consola**: en la página de tu repositorio en GitHub, haz clic en **"uploading an existing file"**, arrastra todos los archivos y carpetas (`index.html`, `css/`, `js/`, etc.) y dale a **Commit changes**.

### Paso 3: Activar GitHub Pages
1. En tu repositorio en GitHub, ve a la pestaña **Settings** (Configuración).
2. En el menú de la izquierda, haz clic en **Pages**.
3. En **Build and deployment > Branch**, selecciona la rama **`main`** y la carpeta **`/(root)`**, y pulsa **Save**.
4. ¡Listo! En 1 minuto GitHub te dará un link parecido a:
   👉 **`https://TU_USUARIO.github.io/dbz-pokemon-3d/`**
5. Abre ese link en el celular (o pásaselo por WhatsApp) ¡y a jugar!

---

## 🎮 Controles

### 📱 En Celular (Pantalla Táctil)
- **Joystick Virtual (Pulgar Izquierdo):** Moverte por el ring 3D.
- **👊 Botón GOLPE:** Combo de artes marciales cuerpo a cuerpo.
- **⚡ Botón BLAST:** Ráfaga de Ki / Bola Eléctrica / Fuego a distancia.
- **🔥 Botón CARGA (Mantener):** Cargar Ki / Energía con aura brillante.
- **💥 Botón ULTIMATE:** Ataque definitivo (**Kamehameha**, **Impactrueno**, etc.). Requiere al menos 70% de Ki (el botón brillará cuando esté listo).
- **💨 Botón DASH:** Esquivar rápidamente con impulso.
- **⛶ Botón Superior:** Pantalla completa.
- **🔊 Botón Superior:** Activar/silenciar sonido y música.

### 💻 En PC (Teclado)
- **W, A, S, D:** Moverse
- **J:** Golpe / Combo
- **K:** Ráfaga de energía
- **L:** Cargar energía
- **U:** Ataque Definitivo (Ultimate)
- **Barra Espaciadora:** Dash / Esquivar

---

## 🌟 Características
- **Modelos 3D Auténticos GLB & Animaciones Esqueléticas:** Modelos 3D de alta fidelidad para Goku, Pikachu y Charizard (`assets/*.glb`), con animaciones reales (`03-KAMEHAMEHA`, `02-STANCE`, `Impactrueno`, etc.) y modelo detallado de Vegeta con armadura Saiyan.
- **Sistema Híbrido con Respaldo Procedural:** Si los archivos 3D tardan en cargar o se juega sin conexión, el motor cuenta con modelos procedurales HD con texturas faciales Canvas para que el juego nunca se congele ni muestre pantallas vacías.
- **Escenario 3D:** Estadio de artes marciales Tenkaichi con pilares Pokéball y montañas Dragon Ball.
- **Efectos Visuales (VFX):** Auras de Ki resplandecientes, relámpagos, esferas de energía, ondas expansivas y sacudida de pantalla.
- **Música y Efectos Web Audio:** Sintetizados en tiempo real sin descargas pesadas de audio ni problemas de copyright.
