import streamlit as st

from views import analisis, inicio



# --- CONFIGURACIÓN DE LA PÁGINA ---

st.set_page_config(

    page_title="Sistema IA - Detección de Neumonía", page_icon="🩺", layout="wide"

)





# --- CONTROL DE NAVEGACIÓN ENTRE PANTALLAS ---

if "pantalla_actual" not in st.session_state:

  st.session_state.pantalla_actual = "inicio"



# Renderizar la pantalla correspondiente según el estado

if st.session_state.pantalla_actual == "inicio":

  inicio.mostrar()

elif st.session_state.pantalla_actual == "analisis":

  analisis.mostrar()