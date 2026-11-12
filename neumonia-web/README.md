# Neumonía IA

Prototipo universitario para explorar la clasificación de radiografías de tórax en dos clases, **Normal** y **Patrones compatibles con neumonía**. Está hecho con HTML, CSS y JavaScript. Su uso es educativo.

## Abrir la página

Desde la carpeta `neumonia-web`, ejecuta este comando con Python 3.

```sh
python -m http.server 8000 --directory dist
```

Abre [la página local](http://localhost:8000). Puedes cargar una imagen PNG o JPEG de hasta 10 MB y ver su vista previa. Para probar el flujo completo, elige un ejemplo y pulsa **Analizar**. Los ejemplos muestran resultados simulados y aparecen identificados en la interfaz.

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
