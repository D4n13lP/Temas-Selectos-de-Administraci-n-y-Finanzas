const TOKEN = import.meta.env.VITE_BANXICO_TOKEN;

export const fetchHistoricoUdi = async (fechaInicio: string, fechaFin: string): Promise<any[]> => {
  try {
    // IMPORTANTE: En Netlify, usamos la ruta relativa que definimos en _redirects
    // NO usamos AllOrigins ni la URL completa de Banxico aquí.
    const url = `/api/banxico/SF43899/datos/${fechaInicio}/${fechaFin}?token=${TOKEN}`;
    
    const response = await fetch(url);

    // Si la respuesta no es JSON, esto lanzará el error que ves
    const data = await response.json();

    if (data?.bmx?.series?.[0]?.datos) {
      return data.bmx.series[0].datos;
    }
    return [];
  } catch (error) {
    console.error("Error en fetchHistoricoUdi:", error);
    return [];
  }
};