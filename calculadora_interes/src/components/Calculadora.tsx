import React, { useEffect, useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Calculator, Loader2, CalendarDays, AlertTriangle } from 'lucide-react';

// Importamos el esquema y el TIPO extraído de él
import { calculoSchema, type FormValues } from '../schemas/formSchema';
import { fetchHistoricoUdi } from '../api/banxico';

interface DesgloseMensual {
  mes: string;
  dias: number;
  tasaAplicada: number;
  interesGenerado: number;
}

interface ResultadoCompleto {
  diasTotales: number;
  interesAcumulado: number;
  totalFinal: number;
  tabla: DesgloseMensual[];
}

const Calculadora: React.FC = () => {
  const [resultado, setResultado] = useState<ResultadoCompleto | null>(null);
  const [loadingTasa, setLoadingTasa] = useState(true);
  const [isCalculating, setIsCalculating] = useState(false);

  // CORRECCIÓN: Quitamos el genérico <FormValues> de aquí para evitar el conflicto
  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(calculoSchema),
    defaultValues: {
      montoPrincipal: 0,
      tasaUdi: 0,
      fechaVencimiento: '',
      fechaPago: ''
    }
  });

  useEffect(() => {
    const cargarTasaActual = async () => {
      const hoy = new Date().toISOString().split('T')[0];
      const datos = await fetchHistoricoUdi(hoy, hoy);
      if (datos && datos.length > 0) {
        setValue('tasaUdi', parseFloat(datos[0].dato));
      }
      setLoadingTasa(false);
    };
    cargarTasaActual();
  }, [setValue]);

  // Aquí sí usamos SubmitHandler<FormValues> para tipar la función
  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsCalculating(true);
    try {
      const datosApi = await fetchHistoricoUdi(data.fechaVencimiento, data.fechaPago);
      const fechaIni = new Date(data.fechaVencimiento + 'T00:00:00');
      const fechaFin = new Date(data.fechaPago + 'T00:00:00');
      
      let interesAcumuladoTotal = 0;
      const tablaDesglose: DesgloseMensual[] = [];
      let fechaCursor = new Date(fechaIni);

      while (fechaCursor <= fechaFin) {
        const inicioMes = new Date(fechaCursor);
        const finDelMes = new Date(fechaCursor.getFullYear(), fechaCursor.getMonth() + 1, 0);
        const corte = finDelMes > fechaFin ? fechaFin : finDelMes;

        const ms = corte.getTime() - inicioMes.getTime();
        const dias = Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));

        if (dias > 0) {
          const m = (inicioMes.getMonth() + 1).toString().padStart(2, '0');
          const a = inicioMes.getFullYear().toString();

          const match = datosApi.find(d => {
            const p = d.fecha.split('/');
            return p[1] === m && p[2] === a;
          });

          const tBase = match ? parseFloat(match.dato) : data.tasaUdi;
          const tFinal = (tBase * 1.25) / 100;
          const interes = data.montoPrincipal * (tFinal / 365) * dias;

          interesAcumuladoTotal += interes;
          tablaDesglose.push({
            mes: inicioMes.toLocaleString('es-MX', { month: 'long', year: 'numeric' }),
            dias,
            tasaAplicada: tBase * 1.25,
            interesGenerado: interes
          });
        }
        fechaCursor = new Date(fechaCursor.getFullYear(), fechaCursor.getMonth() + 1, 1);
      }

      setResultado({
        diasTotales: Math.ceil((fechaFin.getTime() - fechaIni.getTime()) / (1000 * 60 * 60 * 24)),
        interesAcumulado: interesAcumuladoTotal,
        totalFinal: data.montoPrincipal + interesAcumuladoTotal,
        tabla: tablaDesglose
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8 bg-slate-50 min-h-screen">
      <div className="flex items-center gap-3 border-b pb-4">
        <Calculator className="text-blue-600" size={32} />
        <h1 className="text-2xl font-black text-slate-800">Cálculo Mora Art. 276 LISF</h1>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl shadow-lg border border-slate-200 h-fit">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Capital Asegurado</label>
              <input type="number" step="0.01" {...register('montoPrincipal')} className="w-full mt-1 p-3 bg-slate-50 border rounded-xl font-bold" />
              {errors.montoPrincipal && <p className="text-red-500 text-xs mt-1">{errors.montoPrincipal?.message as string}</p>}
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Vencimiento</label>
              <input type="date" {...register('fechaVencimiento')} className="w-full mt-1 p-3 bg-slate-50 border rounded-xl" />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Fecha Pago</label>
              <input type="date" {...register('fechaPago')} className="w-full mt-1 p-3 bg-slate-50 border rounded-xl" />
              {errors.fechaPago && <p className="text-red-500 text-xs mt-1">{errors.fechaPago?.message as string}</p>}
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase flex justify-between">
                Tasa CCP-UDIs (%) {loadingTasa && <Loader2 size={14} className="animate-spin" />}
              </label>
              <input type="number" step="0.0001" {...register('tasaUdi')} className="w-full mt-1 p-3 bg-blue-50 border-blue-200 rounded-xl text-blue-700 font-bold" />
            </div>

            <button type="submit" disabled={isCalculating} className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-black transition-all">
              {isCalculating ? 'Consultando Banxico...' : 'Generar Cálculo'}
            </button>
          </form>
        </div>

        <div className="lg:col-span-8">
          {!resultado ? (
            <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed rounded-2xl text-slate-400 bg-white">
              <CalendarDays size={48} className="opacity-20 mb-2" />
              <p>Esperando datos para el desglose mensual...</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-xl shadow-sm border">
                  <span className="text-xs text-slate-400 font-bold uppercase">Días Mora</span>
                  <p className="text-3xl font-black">{resultado.diasTotales}</p>
                </div>
                <div className="bg-white p-5 rounded-xl shadow-sm border border-red-100">
                  <span className="text-xs text-red-400 font-bold uppercase">Interés</span>
                  <p className="text-3xl font-black text-red-600">${resultado.interesAcumulado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md overflow-hidden border">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-800 text-white uppercase text-[10px] tracking-widest">
                    <tr>
                      <th className="p-4">Periodo</th>
                      <th className="p-4 text-center">Días</th>
                      <th className="p-4 text-center">Tasa (1.25x)</th>
                      <th className="p-4 text-right">Interés</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {resultado.tabla.map((f, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="p-4 font-bold text-slate-700 capitalize">{f.mes}</td>
                        <td className="p-4 text-center">{f.dias}</td>
                        <td className="p-4 text-center">
                          <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded font-bold">{f.tasaAplicada.toFixed(2)}%</span>
                        </td>
                        <td className="p-4 text-right font-mono font-bold">${f.interesGenerado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-900 text-white font-bold">
                    <tr>
                      <td colSpan={3} className="p-4 text-right">TOTAL A LIQUIDAR:</td>
                      <td className="p-4 text-right text-xl text-blue-300">${resultado.totalFinal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Calculadora;