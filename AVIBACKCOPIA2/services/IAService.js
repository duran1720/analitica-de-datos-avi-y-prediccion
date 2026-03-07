const axios = require("axios");

const IA_URL = "http://127.0.0.1:8000/predict";

const predecirDesercion = async (aprendiz) => {
  try {

    const response = await axios.post(IA_URL, {
      programaId: aprendiz.programaId,
      horas_inasistidas: aprendiz.horas_inasistidas
    });

    return response.data;

  } catch (error) {
    console.error("Error IA:", error.message);
    return null;
  }
};

module.exports = {
  predecirDesercion
};