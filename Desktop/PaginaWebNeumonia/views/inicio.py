import streamlit as st


def mostrar():
  st.markdown(
      '<p class="titulo-principal">Sistema Inteligente para la Detección y'
      " Clasificación de Neumonía</p>",
      unsafe_allow_html=True,
  )
  st.markdown(
      '<p class="subtitulo">Herramienta web experimental de apoyo al análisis de'
      " radiografías de tórax mediante CNN[cite: 1].</p>",
      unsafe_allow_html=True,
  )

  st.warning(
      "⚠️ **Aviso legal/académico:** Esta plataforma es un proyecto de carácter"
      " experimental y de apoyo. No sustituye el diagnóstico médico"
      " profesional[cite: 1]."
  )

  st.markdown("---")

  col1, col2 = st.columns(2, gap="large")

  with col1:
    st.markdown("### 🎯 Planteamiento y Objetivos")
    st.write(
        "Este proyecto aplica técnicas de Inteligencia Artificial, aprendizaje"
        " profundo y procesamiento de imágenes médicas para analizar"
        " radiografías de tórax y clasificarlas inicialmente como normales o"
        " con patrones compatibles con neumonía[cite: 1]."
    )
    st.write(
        "- **Objetivo General:** Desarrollar un sistema inteligente basado en"
        " redes neuronales convolucionales (CNN)[cite: 1]."
    )
    st.write(
        "- **Alcance Inicial:** Clasificación binaria (Normal vs Neumonía)"
        "[cite: 1]."
    )

  with col2:
    st.markdown("### 🛠️ Estructura del Trabajo")
    st.write(
        "El sistema cuenta con una arquitectura modular diseñada para"
        " facilitar la integración del modelo de IA desarrollado por el"
        " equipo[cite: 1]:"
    )
    st.write("- **Módulo de Entrada:** Carga de imágenes en formato estándar.")
    st.write("- **Módulo de IA:** Predicción y evaluación de patrones[cite: 1].")
    st.write(
        "- **Módulo de Resultados:** Despliegue visual del diagnóstico"
        " preliminar[cite: 1]."
    )

  st.markdown("---")

  # Centrar el botón para ir a la siguiente pantalla
  col_espacio1, col_boton, col_espacio2 = st.columns([1, 2, 1])
  with col_boton:
    if st.button(
        "🚀 Ir al Módulo de Análisis", type="primary", use_container_width=True
    ):
      st.session_state.pantalla_actual = "analisis"
      st.rerun()