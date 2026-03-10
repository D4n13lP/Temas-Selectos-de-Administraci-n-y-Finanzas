const TOKEN = import.meta.env.VITE_BANXICO_TOKEN;

export const fetchHistoricoUdi = async (fechaInicio: string, fechaFin: string): Promise<any[]> => {
  try {
    // Si estás en producción (Netlify), usa el túnel. Si no, usa el proxy de respaldo.
    const isLocal = window.location.hostname === 'localhost';
    const baseUrl = isLocal 
      ? 'https://api.allorigins.win/raw?url=https://www.banxico.org.mx/SieAPIRest/service/v1/series'
      : '/api/banxico';

    const url = `${baseUrl}/SF43899/datos/${fechaInicio}/${fechaFin}?token=${TOKEN}`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (data?.bmx?.series?.[0]?.datos) {
      return data.bmx.series[0].datos;
    }
    return [];
  } catch (error) {
    console.error("Error:", error);
    // Tu tabla de backup que pusimos antes puede ir aquí
    return [];
  }
};