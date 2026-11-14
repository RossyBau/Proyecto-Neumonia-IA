(() => {
  'use strict';

  const byId = (id) => document.getElementById(id);
  const fileInput = byId('file-input');
  const dropZone = byId('drop-zone');
  const uploadIdle = byId('upload-idle') || dropZone;
  const uploadMessage = byId('upload-message');
  const preview = byId('preview');
  const previewImage = byId('preview-image');
  const previewName = byId('preview-name');
  const previewDetails = byId('preview-details');
  const originalView = byId('view-original');
  const heatmapView = byId('view-heatmap');
  const heatmapLayer = byId('heatmap-layer');
  const heatmapLegend = byId('heatmap-legend');
  const heatmapCaption = byId('heatmap-caption');
  const heatmapNote = byId('heatmap-note');
  const resetButton = byId('reset-button');
  const replaceButton = byId('replace-button');
  const analyzeButton = byId('analyze-button');
  const resultEmpty = byId('result-empty');
  const resultEmptyTitle = byId('result-empty-title');
  const resultEmptyText = byId('result-empty-text');
  const resultLoading = byId('result-loading');
  const resultOutput = byId('result-output');
  const resultLabel = byId('result-label');
  const resultSource = byId('result-source');
  const resultScore = byId('result-score');
  const resultMeter = byId('result-meter');
  const resultMessage = byId('result-message');
  const modeLabel = byId('mode-label');
  const workspace = document.querySelector('.workspace-grid');
  const sourceFile = byId('source-file');
  const viewerIdle = byId('viewer-idle');
  const mobileViewer = byId('mobile-viewer');
  const mobileResult = byId('mobile-result');
  const mobileLayout = window.matchMedia('(max-width: 760px)');

  function showWorkspaceView(view, focusTarget) {
    workspace.dataset.view = view;
    mobileViewer.setAttribute('aria-pressed', String(view === 'viewer'));
    mobileResult.setAttribute('aria-pressed', String(view === 'result'));
    if (focusTarget && mobileLayout.matches) focusTarget.focus({ preventScroll: true });
  }

  const maxFileBytes = 10 * 1024 * 1024;
  const maxHeatmapSide = 1024;
  const heatmapColors = [[65, 37, 149], [161, 42, 192], [239, 85, 62], [255, 220, 84]];
  const numberFormat = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 1 });
  const percentFormat = new Intl.NumberFormat('es-MX', {
    style: 'percent', maximumFractionDigits: 1,
  });

  const classLabels = {
    normal: 'Normal',
    pneumonia: 'Patrones compatibles con neumonía',
  };
  const samples = {
    normal: {
      name: 'Radiografía de ejemplo normal',
      key: 'normal',
      url: './assets/ejemplo-normal.webp',
      result: { label: 'normal', score: 0.94 },
    },
    pneumonia: {
      name: 'Radiografía de ejemplo con neumonía',
      key: 'pneumonia',
      url: './assets/ejemplo-neumonia.webp',
      result: { label: 'pneumonia', score: 0.91 },
    },
  };

  const endpoint = readEndpoint();
  let selection = null;
  let selectionVersion = 0;
  let loadingImage = false;
  let activeRequest = null;

  function readEndpoint() {
    const value = window.NEUMONIA_CONFIG?.predictionEndpoint;
    if (typeof value !== 'string' || !value.trim()) return '';

    try {
      const url = new URL(value.trim(), window.location.href);
      return ['https:', 'http:'].includes(url.protocol) ? url.href : '';
    } catch {
      return '';
    }
  }

  function showMessage(element, message = '', kind = 'info') {
    element.textContent = message;
    element.dataset.kind = kind;
    element.hidden = !message;
  }

  function setResultState(state) {
    if (state !== 'output') resetHeatmap();
    resultEmpty.hidden = state !== 'empty';
    resultLoading.hidden = state !== 'loading';
    resultOutput.hidden = state !== 'output';
    showMessage(resultMessage);
  }

  function updateControls() {
    const choosingFile = document.activeElement === dropZone;
    uploadIdle.hidden = Boolean(selection);
    sourceFile.hidden = !selection;
    viewerIdle.hidden = Boolean(selection);
    preview.hidden = !selection;
    analyzeButton.disabled = loadingImage || Boolean(activeRequest)
      || !selection || (!selection.result && !endpoint);
    analyzeButton.setAttribute('aria-busy', String(Boolean(activeRequest)));
    if (selection && choosingFile) replaceButton.focus();

    for (const [button, key] of sampleButtons) {
      button?.setAttribute('aria-pressed', String(selection?.key === key));
    }
    resultEmptyTitle.textContent = selection ? 'Imagen lista' : 'Esperando una imagen';
    if (!selection) {
      resultEmptyText.textContent = 'Carga una radiografía o elige una imagen de ejemplo para comenzar.';
    } else if (selection.result) {
      resultEmptyText.textContent = 'Pulsa Analizar para ver un resultado de demostración.';
    } else if (endpoint) {
      resultEmptyText.textContent = 'Pulsa Analizar para enviar la imagen al modelo.';
    } else {
      resultEmptyText.textContent = 'La vista previa está lista. La predicción se habilita al conectar el modelo.';
    }
  }

  function imageDimensions(url) {
    const image = new Image();
    image.src = url;
    return image.decode().then(() => ({
      width: image.naturalWidth,
      height: image.naturalHeight,
    }));
  }

  function releaseSelection() {
    if (selection?.file) URL.revokeObjectURL(selection.url);
    selection = null;
  }

  function cancelPrediction() {
    activeRequest?.abort();
    activeRequest = null;
  }

  function showPreview(next) {
    releaseSelection();
    selection = next;
    previewImage.src = next.url;
    previewImage.alt = next.file ? 'Vista previa del archivo cargado' : next.name;
    previewName.textContent = next.name;
    const details = next.file ? formatSize(next.file.size) : 'Imagen de ejemplo';
    previewDetails.textContent = `${details} · ${next.width} × ${next.height} px`;
    if (next.file && !endpoint) {
      showMessage(uploadMessage, 'Puedes probar el flujo de análisis con una imagen de ejemplo.');
    } else {
      showMessage(uploadMessage);
    }
  }

  function formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${numberFormat.format(bytes / 1024)} KB`;
    return `${numberFormat.format(bytes / (1024 * 1024))} MB`;
  }

  async function validateFile(file) {
    if (!file.size) throw new Error('El archivo está vacío. Selecciona otra imagen.');
    if (file.size > maxFileBytes) throw new Error('La imagen supera el límite de 10 MB.');

    const bytes = new Uint8Array(await file.slice(0, 8).arrayBuffer());
    const png = [137, 80, 78, 71, 13, 10, 26, 10];
    const jpeg = [255, 216, 255];
    if (!png.every((byte, i) => bytes[i] === byte)
        && !jpeg.every((byte, i) => bytes[i] === byte)) {
      throw new Error('Selecciona una imagen válida en formato PNG o JPEG.');
    }
  }

  async function selectImage({ file, sample }) {
    const version = ++selectionVersion;
    cancelPrediction();
    loadingImage = true;
    setResultState('empty');
    showMessage(uploadMessage, 'Preparando vista previa…');
    updateControls();

    let objectUrl = '';
    try {
      if (file) {
        await validateFile(file);
        if (version !== selectionVersion) return;
        objectUrl = URL.createObjectURL(file);
      }
      const url = objectUrl || sample.url;
      const dimensions = await imageDimensions(url).catch(() => {
        throw new Error('No se pudo abrir la imagen. Prueba con otro archivo o ejemplo.');
      });
      if (version !== selectionVersion) return;

      const next = file ? { file, name: file.name, url } : sample;
      showPreview({ ...next, ...dimensions });
      objectUrl = '';
    } catch (error) {
      if (version === selectionVersion) showMessage(uploadMessage, error.message, 'error');
    } finally {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      if (version === selectionVersion) {
        loadingImage = false;
        updateControls();
      }
    }
  }

  function clearImage() {
    selectionVersion += 1;
    loadingImage = false;
    cancelPrediction();
    releaseSelection();
    previewImage.removeAttribute('src');
    fileInput.value = '';
    showMessage(uploadMessage);
    setResultState('empty');
    updateControls();
    dropZone.focus();
  }

  function validResult(result) {
    return result && typeof result.label === 'string' && Object.hasOwn(classLabels, result.label)
      && Number.isFinite(result.score) && result.score >= 0 && result.score <= 1;
  }

  function validHeatmap(map) {
    return map && Number.isInteger(map.width) && Number.isInteger(map.height)
      && map.width > 0 && map.width <= maxHeatmapSide
      && map.height > 0 && map.height <= maxHeatmapSide
      && Array.isArray(map.values) && map.values.length === map.width * map.height
      && map.values.every((value) => Number.isFinite(value) && value >= 0 && value <= 1);
  }

  function exampleHeatmap() {
    // Una mancha dibujada para demostrar el visor, sin ejecución de un modelo.
    const width = 48;
    const height = 48;
    const values = Array.from({ length: width * height }, (_, index) => {
      const x = (index % width) / (width - 1);
      const y = Math.floor(index / width) / (height - 1);
      const center = Math.exp(-((x - 0.70) ** 2 / 0.015 + (y - 0.62) ** 2 / 0.018));
      const edge = Math.exp(-((x - 0.79) ** 2 / 0.010 + (y - 0.70) ** 2 / 0.012));
      return Math.min(1, 0.95 * center + 0.43 * edge);
    });
    return { width, height, values };
  }

  function renderHeatmap(map) {
    // La matriz abarca toda la imagen. Conservamos la relación de aspecto del original.
    const scale = Math.min(1, maxHeatmapSide / Math.max(selection.width, selection.height));
    heatmapLayer.width = Math.max(1, Math.round(selection.width * scale));
    heatmapLayer.height = Math.max(1, Math.round(selection.height * scale));

    const source = document.createElement('canvas');
    source.width = map.width;
    source.height = map.height;
    const sourceContext = source.getContext('2d');
    const layerContext = heatmapLayer.getContext('2d');
    if (!sourceContext || !layerContext) return false;

    const pixels = sourceContext.createImageData(map.width, map.height);
    map.values.forEach((value, i) => {
      const segment = value * (heatmapColors.length - 1);
      const first = Math.min(Math.floor(segment), heatmapColors.length - 2);
      const fraction = segment - first;
      for (let channel = 0; channel < 3; channel++) {
        const from = heatmapColors[first][channel];
        const to = heatmapColors[first + 1][channel];
        pixels.data[i * 4 + channel] = from + (to - from) * fraction;
      }
      pixels.data[i * 4 + 3] = 205 * value ** 0.85;
    });
    sourceContext.putImageData(pixels, 0, 0);
    layerContext.drawImage(source, 0, 0, heatmapLayer.width, heatmapLayer.height);
    return true;
  }

  function selectView(showHeatmap) {
    if (showHeatmap && heatmapView.disabled) return;
    heatmapLayer.hidden = !showHeatmap;
    heatmapLegend.hidden = !showHeatmap;
    originalView.setAttribute('aria-pressed', String(!showHeatmap));
    heatmapView.setAttribute('aria-pressed', String(showHeatmap));
  }

  function resetHeatmap() {
    if (document.activeElement === heatmapView) originalView.focus();
    heatmapView.disabled = true;
    selectView(false);
    showMessage(heatmapNote);
  }

  function showResultHeatmap(result, simulated) {
    const map = simulated && selection.key === 'pneumonia' ? exampleHeatmap() : result.gradCam;
    if (!validHeatmap(map) || !renderHeatmap(map)) {
      resetHeatmap();
      showMessage(heatmapNote, simulated
        ? 'El mapa ilustrativo está disponible en el ejemplo con neumonía.'
        : 'Mapa de influencia no disponible para este resultado.');
      return;
    }

    const kind = simulated ? 'demo' : 'model';
    const caption = simulated ? 'Mapa ilustrativo' : 'Influencia del modelo';
    heatmapLayer.dataset.kind = kind;
    heatmapLayer.setAttribute('aria-label', `${caption} sobre la radiografía`);
    heatmapLegend.dataset.kind = kind;
    if (heatmapCaption) heatmapCaption.textContent = caption;
    showMessage(heatmapNote, simulated
      ? 'El mapa es ilustrativo. Sus colores simulan la escala de influencia.'
      : 'Grad-CAM muestra la influencia relativa de cada zona en la clase predicha.', kind);
    heatmapView.disabled = false;
    selectView(true);
  }

  function showResult(result, simulated) {
    const scoreText = percentFormat.format(result.score);
    const modelName = typeof result.model === 'string' ? result.model.trim() : '';
    resultOutput.dataset.kind = result.label;
    resultLabel.textContent = classLabels[result.label];
    resultSource.textContent = simulated ? 'Resultado simulado' : (modelName || 'Modelo preentrenado');
    resultScore.textContent = scoreText;
    resultMeter.value = result.score * 100;
    resultMeter.setAttribute('aria-label', `Puntuación ${simulated ? 'simulada' : 'del modelo'}: ${scoreText}`);
    setResultState('output');
    showResultHeatmap(result, simulated);
  }

  async function analyze() {
    if (analyzeButton.disabled || !selection) return;
    if (mobileLayout.matches) showWorkspaceView('result', byId('result-title'));
    if (selection.result) {
      showResult(selection.result, true);
      return;
    }

    const controller = new AbortController();
    activeRequest = controller;
    setResultState('loading');
    updateControls();
    let timedOut = false;
    const timer = window.setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 30000);

    try {
      const body = new FormData();
      body.append('image', selection.file);
      const response = await fetch(endpoint, { method: 'POST', body, signal: controller.signal });
      if (!response.ok) throw new Error('El servicio no pudo analizar la imagen. Intenta de nuevo.');
      const result = await response.json().catch(() => null);
      if (!validResult(result)) throw new Error('El servicio devolvió un resultado que no se pudo interpretar.');
      if (activeRequest === controller) showResult(result, false);
    } catch (error) {
      if (activeRequest !== controller) return;
      setResultState('empty');
      let message = error instanceof TypeError ? 'No se pudo conectar al servicio de predicción.' : error.message;
      if (timedOut) message = 'La predicción tardó demasiado. Intenta de nuevo.';
      showMessage(resultMessage, message, 'error');
    } finally {
      window.clearTimeout(timer);
      if (activeRequest === controller) {
        activeRequest = null;
        updateControls();
      }
    }
  }

  dropZone.addEventListener('click', () => fileInput.click());
  replaceButton.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (file) selectImage({ file });
    fileInput.value = '';
  });

  for (const target of [dropZone, preview]) {
    target.addEventListener('dragover', (event) => {
      if (!event.dataTransfer.types.includes('Files')) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = 'copy';
      target.classList.add('is-dragging');
    });
    target.addEventListener('dragleave', (event) => {
      if (!(event.relatedTarget instanceof Node) || !target.contains(event.relatedTarget)) {
        target.classList.remove('is-dragging');
      }
    });
    target.addEventListener('drop', (event) => {
      event.preventDefault();
      target.classList.remove('is-dragging');
      const files = event.dataTransfer.files;
      if (files.length === 1) selectImage({ file: files[0] });
      if (files.length > 1) showMessage(uploadMessage, 'Selecciona una sola imagen a la vez.', 'error');
    });
  }

  const sampleButtons = new Map([
    [byId('sample-button'), 'normal'],
    [byId('sample-pneumonia-button'), 'pneumonia'],
  ]);
  for (const button of document.querySelectorAll('[data-sample]')) {
    sampleButtons.set(button, button.dataset.sample);
  }
  for (const [button, key] of sampleButtons) {
    if (button && Object.hasOwn(samples, key)) {
      button.addEventListener('click', () => selectImage({ sample: samples[key] }));
    }
  }

  resetButton.addEventListener('click', clearImage);
  mobileViewer.addEventListener('click', () => showWorkspaceView('viewer'));
  mobileResult.addEventListener('click', () => showWorkspaceView('result'));
  byId('result-back').addEventListener('click', () => showWorkspaceView('viewer', mobileViewer));
  byId('open-guide').addEventListener('click', () => byId('analysis-guide').showModal());
  analyzeButton.addEventListener('click', analyze);
  originalView.addEventListener('click', () => selectView(false));
  heatmapView.addEventListener('click', () => selectView(true));
  if (endpoint) {
    modeLabel.textContent = 'Modelo preentrenado';
    modeLabel.dataset.mode = 'model';
  }
  setResultState('empty');
  updateControls();
})();
