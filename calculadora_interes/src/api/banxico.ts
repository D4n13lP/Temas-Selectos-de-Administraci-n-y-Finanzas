const TOKEN = import.meta.env.VITE_BANXICO_TOKEN;

export const fetchHistoricoUdi = async (fechaInicio: string, fechaFin: string): Promise<any[]> => {
  try {
    // 1. URL real de Banxico
    const banxicoUrl = `https://www.banxico.org.mx/SieAPIRest/service/v1/series/SF43899/datos/${fechaInicio}/${fechaFin}?token=${TOKEN}`;
    
    // 2. Usamos el proxy AllOrigins (esto evita el error de CORS sin depender de Netlify)
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(banxicoUrl)}`;
    
    const response = await fetch(proxyUrl);
    if (!response.ok) throw new Error('Error en la red');

    const wrapper = await response.json();
    
    // 3. AllOrigins devuelve los datos dentro de una propiedad llamada 'contents' como String
    // Tenemos que convertir ese string a un objeto JSON real
    const data = JSON.parse(wrapper.contents);

    if (data?.bmx?.series?.[0]?.datos) {
      return data.bmx.series[0].datos;
    }
    return [];
  } catch (error) {
    console.error("Error en fetchHistoricoUdi:", error);
    return [];
  }
};