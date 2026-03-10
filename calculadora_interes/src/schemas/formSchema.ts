import * as z from 'zod';

// Definimos el esquema
export const calculoSchema = z.object({
  montoPrincipal: z.coerce.number({ message: "Ingresa un monto válido" })
    .min(1, "El monto debe ser mayor a 0"),
  fechaVencimiento: z.string().min(1, "La fecha es obligatoria"),
  fechaPago: z.string().min(1, "La fecha es obligatoria"),
  tasaUdi: z.coerce.number({ message: "Ingresa una tasa válida" })
    .min(0.0001, "La tasa es obligatoria"),
}).refine((data) => {
  const inicio = new Date(data.fechaVencimiento + 'T00:00:00');
  const fin = new Date(data.fechaPago + 'T00:00:00');
  return fin >= inicio;
}, {
  message: "La fecha de pago no puede ser anterior al vencimiento",
  path: ["fechaPago"],
});

// ESTA LÍNEA ES LA CLAVE: 
// Extraemos el tipo exacto que Zod espera y genera.
export type FormValues = z.infer<typeof calculoSchema>;