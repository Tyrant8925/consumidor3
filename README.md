# Ahorro+ V2 — prototipo académico

Aplicación web de demostración inspirada en la paleta azul, rojo y blanco de Farmacias del Ahorro. No es una aplicación oficial. Productos, precios, pedidos, citas y puntos son ficticios.

## Ejecutar en VS Code (recomendado)
1. Extrae el ZIP completo. No abras ni copies solamente el HTML.
2. Abre la carpeta `AhorroPlus_V2` en VS Code (Archivo > Abrir carpeta).
3. Instala Node.js 18 o posterior si todavía no está instalado (https://nodejs.org/).
4. Abre Terminal > Nueva terminal. Ejecuta `node server.js` (también sirve `npm start`). No hace falta `npm install`.
5. Abre http://127.0.0.1:3000/ en Edge o Chrome. Debe decir **API REST conectada** en la franja superior.
6. Para detener el servidor usa Ctrl+C. Si el puerto está ocupado, cierra el servidor anterior o, en PowerShell, ejecuta `$env:PORT=3001; node server.js` y abre http://127.0.0.1:3001/.

## Modo local de emergencia
Abre `index.html` directamente o con Live Server. La aplicación debe mostrar **Modo demo local** y usar exactamente el mismo motor de catálogo, chat, pedidos y citas en el navegador. En ese modo no está consumiendo el servidor REST. No necesita internet. Mantén todos los archivos juntos.

## Archivos
- `index.html`: estructura y accesibilidad básica.
- `styles.css`: diseño responsive y paleta inspirada en la marca.
- `app.js`: interacción, consumo de API y respaldo local.
- `core.js`: catálogo y reglas del asistente, validaciones y cálculos compartidos.
- `server.js`: servidor HTTP y API REST.
- `logo.svg`: símbolo propio del prototipo.
- `package.json`: comandos de ejecución y pruebas.
- `tests.js`: pruebas automáticas con `npm test`.
- `INICIAR.bat`: acceso rápido en Windows (requiere Node.js).

## API REST
| Método | Ruta | Función |
| --- | --- | --- |
| GET | /api/health | Verifica la versión y conexión |
| GET | /api/products | Catálogo; q, category y promo=true opcionales |
| GET | /api/promotions | Productos con descuento |
| GET | /api/appointments/slots | Horarios |
| POST | /api/appointments | date y time |
| POST | /api/orders | items: [{id, quantity}] |
| POST | /api/chat | message y context opcional |

Prueba http://127.0.0.1:3000/api/products con el servidor iniciado.

## Prueba de exposición
- Buscar «termómetro»; aparecerá un producto.
- Abrir Ahorri y preguntar «¿Qué promociones hay?»; muestra cinco ofertas y el botón Ver promociones.
- Preguntar «¿Cuánto cuesta el termómetro?»; responde $119 MXN.
- Preguntar «¿Cuánto cuesta el envío?»; responde $49 y gratis desde $499.
- Agregar un producto al carrito y simular compra; se generan folio y puntos (guardados en el navegador).
- Preguntar «¿Cuántos puntos tengo?». Agenda una cita de demostración con fecha y hora.

## Limitaciones
Chatbot basado en reglas y contexto limitado; no es IA generativa ni ofrece asesoría médica. No usa API externa, claves o pagos. No hay inventario real, persistencia de pedidos/citas en servidor, cuentas ni datos sensibles. El modo local es una simulación. La API fue probada con solicitudes HTTP y el motor con pruebas unitarias; la navegación automatizada en Chromium estuvo bloqueada por el entorno de creación, por lo que la interfaz se debe comprobar en el equipo del usuario.
