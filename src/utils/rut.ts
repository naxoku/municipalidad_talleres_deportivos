export const validateRut = (rut: string): boolean => {
  if (!rut) return false;

  // Limpiar el RUT de puntos y guión
  const valor = rut.replace(/\./g, "").replace(/-/g, "");

  // Aislar Cuerpo y Dígito Verificador
  const cuerpo = valor.slice(0, -1);
  const dv = valor.slice(-1).toUpperCase();

  // Validar que el cuerpo sean números
  if (!/^[0-9]+$/.test(cuerpo)) return false;

  // Calcular Dígito Verificador
  let suma = 0;
  let multiplo = 2;

  for (let i = 1; i <= cuerpo.length; i++) {
    const index = multiplo * parseInt(valor.charAt(valor.length - i - 1));

    suma = suma + index;
    if (multiplo < 7) {
      multiplo = multiplo + 1;
    } else {
      multiplo = 2;
    }
  }

  const dvEsperado = 11 - (suma % 11);
  let dvCalculado = "";

  if (dvEsperado === 11) dvCalculado = "0";
  else if (dvEsperado === 10) dvCalculado = "K";
  else dvCalculado = dvEsperado.toString();

  return dvCalculado === dv;
};

export const formatRut = (rut: string): string => {
  if (!rut) return "";
  const valor = rut.replace(/\./g, "").replace(/-/g, "");
  const cuerpo = valor.slice(0, -1);
  const dv = valor.slice(-1).toUpperCase();

  if (cuerpo.length === 0) return rut;

  return `${cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}-${dv}`;
};
