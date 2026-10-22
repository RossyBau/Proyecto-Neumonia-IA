from PIL import Image
import streamlit as st


def mostrar():
  # Botón para regresar al inicio
  if st.button("⬅️ Volver a la Información General"):
    st.session_state.pantalla_actual = "inicio"
    st.rerun()

  st.markdown("## 🔍 Módulo de Análisis de Radiografías")
  st.write(
      "Sube una radiografía de tórax para que el sistema procese y evalúe los"
      " patrones clínicos."
  )

  # Selector de etapa
  etapa_actual = st.selectbox(
      "Seleccione el nivel de análisis del proyecto:",
      [
          "Primera Etapa: Normal vs Neumonía",
      ],
  )

  st.markdown("---")

  col_izq, col_der = st.columns(2, gap="large")

  with col_izq:
    st.subheader("📁 1. Cargar Radiografía")
    archivo_subido = st.file_uploader(
        "Sube la radiografía (Formatos: PNG, JPG, JPEG)",
        type=["png", "jpg", "jpeg"],
    )

    if archivo_subido is not None:
      imagen = Image.open(archivo_subido)
      st.image(
          imagen,
          caption="Radiografía cargada correctamente",
          use_container_width=True,
      )
      analizar_btn = st.button(
          "⚡ Ejecutar Predicción de IA", type="primary", use_container_width=True
      )
    else:
      st.info("👈 Sube una imagen para habilitar el botón de análisis.")
      analizar_btn = False

  with col_der:
    st.subheader("📊 2. Resultados del Modelo")

    if archivo_subido is None:
      st.markdown(
          "<div style='text-align: center; color: #aaa; margin-top: 80px;'>"
          "<h3>Esperando radiografía...</h3></div>",
          unsafe_allow_html=True,
      )
    else:
      if analizar_btn:
        with st.spinner("Analizando imagen mediante Red Neuronal (CNN)..."):
          import time

          time.sleep(1.5)  # Simulación de respuesta del modelo

          # ==========================================================
          # ZONA DE INTEGRACIÓN FUTURA (IA de tu compañera):
          # resultado, confianza = modelo_ia.predecir(archivo_subido)
          # ==========================================================
          resultado_simulado = "NEUMONIA"  # Cambiar a "NORMAL" para probar

        if "Primera Etapa" in etapa_actual:
          if resultado_simulado == "NORMAL":
            st.markdown(
                '<div class="caja-normal">ESTADO: NORMAL</div>',
                unsafe_allow_html=True,
            )
            st.success(
                "No se detectan patrones radiológicos evidentes compatibles"
                " con neumonía."
            )
          else:
            st.markdown(
                '<div class="caja-neumonia">PATRONES COMPATIBLES CON'
                " NEUMONÍA</div>",
                unsafe_allow_html=True,
            )
            st.error(
                "Se identificaron anomalías o texturas asociadas a procesos"
                " neumónicos[cite: 1]."
            )

          st.markdown("---")
          st.write("**Grado de Confianza del Modelo:**")
          st.progress(0.92)
          st.caption("Confianza estimada: 92.4%")

        else:
          st.markdown(
              '<div class="caja-neumonia">SUBTIPO: NEUMONÍA BACTERIANA</div>',
              unsafe_allow_html=True,
          )