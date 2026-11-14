# Neumonía IA

Prototipo universitario para explorar la clasificación de radiografías de tórax en dos clases, **Normal** y **Patrones compatibles con neumonía**. Está hecho con HTML, CSS y JavaScript. Su uso es educativo.

## Abrir la página

Desde la carpeta `neumonia-web`, ejecuta este comando con Python 3.

```sh
python -m http.server 8000 --directory dist
```

Abre [la página local](http://localhost:8000). Puedes cargar una imagen PNG o JPEG de hasta 10 MB y ver su vista previa. Para probar el flujo completo, elige un ejemplo y pulsa **Analizar radiografía**. Los ejemplos muestran resultados simulados y aparecen identificados en la interfaz. El ejemplo con neumonía también permite alternar entre **Original** y **Mapa de calor** para ver una superposición ilustrativa.

## Conectar el modelo preentrenado

El equipo debe aportar el modelo y un servicio de inferencia que pueda ejecutarlo. En `dist/config.js`, asigna a `predictionEndpoint` la URL del servicio. Con el valor vacío, los archivos propios solo tienen vista previa.

Al pulsar **Analizar** con un archivo propio, el sitio envía una petición `POST` en formato `multipart/form-data` con la imagen en el campo `image`. El servicio devuelve JSON como el siguiente.

```json
{
  "label": "pneumonia",
  "score": 0.91,
  "model": "CNN del equipo"
}
```

`label` admite `normal` o `pneumonia`. `score` es el puntaje de la clase devuelta, entre 0 y 1. El campo `model` es opcional.

El servicio debe aplicar el mismo preprocesamiento que se usó para entrenar el modelo y traducir su salida a las clases acordadas. Si el servicio está en otro origen, habilita CORS para el dominio de la web. Guarda las credenciales en el servidor y usa radiografías de prueba anonimizadas.

## Enviar el mapa Grad-CAM

El servicio puede anexar el campo `gradCam` al mismo JSON. Este ejemplo usa una cuadrícula de 2 × 2.

```json
{
  "label": "pneumonia",
  "score": 0.91,
  "gradCam": {
    "width": 2,
    "height": 2,
    "values": [0.12, 0.24, 0.18, 1.0]
  }
}
```

`width` y `height` son enteros de 1 a 1024. `values` contiene exactamente `width * height` números entre 0 y 1, de izquierda a derecha y de arriba abajo. Como el visor superpone la cuadrícula sobre la imagen completa, el servicio debe devolver el mapa con la misma orientación y deshacer cualquier recorte o relleno aplicado durante el preprocesamiento. Las dimensiones de la cuadrícula pueden ser distintas de las de la radiografía.

La página muestra la predicción aunque el servicio omita el mapa o envíe un mapa inválido. Con un mapa válido, los colores muestran la influencia relativa de cada zona en la clase devuelta por el modelo.
