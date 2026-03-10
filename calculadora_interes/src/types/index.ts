export interface DesgloseMensual {
  mes: string;
  dias: number;
  tasaAplicada: number;
  interesGenerado: number;
}

export interface ResultadoCompleto {
  diasTotales: number;
  interesAcumulado: number;
  totalFinal: number;
  tabla: DesgloseMensual[];
}

export interface BanxicoResponse {
  bmx: {
    series: Array<{
      datos: Array<{
        dato: string;
        fecha: string;
      }>;
    }>;
  };
}