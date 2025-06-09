import { PrismaClient, Genero } from '@prisma/client';

const prisma = new PrismaClient();
// Declaración única para almacenar las relaciones UsuarioRol creadas
const usuarioRoles: Array<{ id: number; id_rol: number; id_usuario: number }> = [];

// Función para generar fechas aleatorias dentro de los próximos 2 meses
function generarFechasAleatorias() {
  const ahora = new Date();
  const dosMesesDespues = new Date();
  dosMesesDespues.setMonth(dosMesesDespues.getMonth() + 2);
  
  const disponible_desde = new Date(ahora.getTime() + Math.random() * (dosMesesDespues.getTime() - ahora.getTime()));
  const disponible_hasta = new Date(disponible_desde.getTime() + Math.random() * (dosMesesDespues.getTime() - disponible_desde.getTime()));
  
  return { disponible_desde, disponible_hasta };
}

// Función para generar valores aleatorios para ingresos y viajes
function generarValoresAleatorios() {
  const ingresoTotal = Math.floor(Math.random() * 5000) + 1000; // Entre 1000 y 6000
  const NumeroViajes = Math.floor(Math.random() * 20) + 1; // Entre 1 y 20 viajes
  return { ingresoTotal, NumeroViajes };
}

async function main() {
  // 1) Crear o recuperar los roles base
  const rolesBase = ['RENTER', 'HOST','DRIVER', 'ADMIN'];
  const roles: Record<string, { id: number; rol: string }> = {};

  for (const rolName of rolesBase) {
    let rol = await prisma.rol.findFirst({ where: { rol: rolName } });
    if (!rol) {
      rol = await prisma.rol.create({ data: { rol: rolName } });
    }
    roles[rolName] = rol;
  }

  // 2) Asignar a cada usuario el rol de "host" Y al id 8 ponerle rol de administrador
  const usuarios = await prisma.usuario.findMany();
  for (const usuario of usuarios) {
    if (usuario.id === 8) {
      // Asignar rol de ADMIN al usuario con id 8
      let ur = await prisma.usuarioRol.create({
        data: {
          id_usuario: usuario.id,
          id_rol: roles['ADMIN'].id,
        },
      });
    }  
    let ur = await prisma.usuarioRol.findFirst({
      where: {
        id_usuario: usuario.id,
        id_rol: roles['HOST'].id,
      },
    });
    if (!ur) {
      ur = await prisma.usuarioRol.create({
        data: {
          id_usuario: usuario.id,
          id_rol: roles['HOST'].id,
        },
      });
    }
    usuarioRoles.push(ur);
  }

  // 3) Seleccionar la ciudad "La Paz" para las direcciones de los autos
  const ciudadLaPaz = await prisma.ciudad.findFirst({ where: { nombre: 'La Paz' } });
  if (!ciudadLaPaz) {
    throw new Error('No existe la ciudad "La Paz". Asegúrate de haberla sembrado antes.');
  }

  // 4) Obtener todas las provincias asociadas a "La Paz"
  const provinciasLaPaz = await prisma.provincia.findMany({ where: { id_ciudad: ciudadLaPaz.id } });
  if (provinciasLaPaz.length === 0) {
    throw new Error('No se encontraron provincias para La Paz. Ejecuta send3.ts primero.');
  }

  // 5) Crear varias direcciones para asignar a los carros
  // Se asignará una provincia aleatoria de "La Paz" a cada dirección.
  const direcciones: Array<{ id: number }> = [];
  const direccionesData = [
    { calle: 'Av. Siempre Viva 742', zona: 'Centro', num_casa: '742' },
    { calle: 'Calle Falsa 123', zona: 'Sur', num_casa: '123' },
    { calle: 'Pje. del Sol 456', zona: 'Norte', num_casa: '456' },
    { calle: 'Av. del Maestro 789', zona: 'Este', num_casa: '789' },
  ];

  for (const d of direccionesData) {
    // Elegir una provincia aleatoria de La Paz
    const provinciaRandom = provinciasLaPaz[Math.floor(Math.random() * provinciasLaPaz.length)];
    const dir = await prisma.direccion.create({
      data: {
        // Asignar la provincia seleccionada
        id_provincia: provinciaRandom.id,
        calle: d.calle,
        zona: d.zona,
        num_casa: d.num_casa,
      },
    });
    direcciones.push(dir);
  }

  // 6) Crear al menos 4 carros distintos, asignados a distintos hosts (como en el send2.ts original)
  const carrosData = [
    {
      vim: '1HGCM82633A004352', // VIN válido
      año: 2015,
      marca: 'TOYOTA', // Convertido a mayúsculas
      modelo: 'COROLLA', // Convertido a mayúsculas
      placa: '1234ABC', // Formato válido de placa boliviana
      asientos: 5,
      puertas: 4,
      soat: true,
      precio_por_dia: 35.0,
      num_mantenimientos: 2,
      transmicion: 'Automática',
      estado: 'Disponible',
    },
    {
      vim: '2C3KA53G76H100001',
      año: 2018,
      marca: 'HONDA',
      modelo: 'CIVIC',
      placa: '5678DEF',
      asientos: 5,
      puertas: 4,
      soat: true,
      precio_por_dia: 40.0,
      num_mantenimientos: 1,
      transmicion: 'Manual',
      estado: 'Disponible',
    },
    {
      vim: '3N1AB7AP5KY238001',
      año: 2020,
      marca: 'NISSAN',
      modelo: 'SENTRA',
      placa: 'GHI-9012',
      asientos: 5,
      puertas: 4,
      soat: true,
      precio_por_dia: 45.0,
      num_mantenimientos: 0,
      transmicion: 'Automática',
      estado: 'Disponible',
    },
    {
      vim: '1FTFW1ET4EKF51234',
      año: 2017,
      marca: 'FORD',
      modelo: 'F-150',
      placa: 'JKL-3456',
      asientos: 5,
      puertas: 4,
      soat: true,
      precio_por_dia: 60.0,
      num_mantenimientos: 3,
      transmicion: 'Automática',
      estado: 'Disponible',
    },
  ];

  // Crear los carros iniciales asignándoles direcciones y UsuarioRol de forma cíclica
  for (let i = 0; i < carrosData.length; i++) {
    const carInfo = carrosData[i];
    // Utilizar una dirección existente y asignarle una provincia aleatoria (ya creada)
    const dir = direcciones[i % direcciones.length];
    // Distribuir los carros entre los UsuarioRol existentes
    const userRole = usuarioRoles[i % usuarioRoles.length];

    const carro = await prisma.carro.create({
      data: {
        ...carInfo,
        id_direccion: dir.id,
        id_usuario_rol: userRole.id,
        descripcion: `Carro ${carInfo.marca} ${carInfo.modelo} en excelente estado`,
        ...generarValoresAleatorios(),
        ...generarFechasAleatorias(),
        id_tipodeDescuento: null
      },
    });
  }

  // 7) Agregar carros adicionales para hosts específicos:
  //    * Para el host con id 1 y el id 2, añade 4 carros más a cada uno
  //    * Para el host con id 3, añade 5 carros
  const extraCarsInfo = [
    {
      vimPrefix: '1HGCM82633A004352', // Ejemplo válido de VIN
      año: 2016,
      marca: 'KIA', // Convertido a mayúsculas
      modelo: 'RIO', // Convertido a mayúsculas
      placaPrefix: '1234ABC', // Formato válido de placa boliviana
      asientos: 5,
      puertas: 4,
      soat: true,
      precio_por_dia: 38.0,
      num_mantenimientos: 1,
      transmicion: 'Automática',
      estado: 'Disponible',
    },
    {
      vimPrefix: '2C3KA53G76H100001',
      año: 2019,
      marca: 'CHEVROLET',
      modelo: 'SPARK',
      placaPrefix: '5678DEF',
      asientos: 5,
      puertas: 4,
      soat: true,
      precio_por_dia: 42.0,
      num_mantenimientos: 0,
      transmicion: 'Manual',
      estado: 'Disponible',
    },
    {
      vimPrefix: '3N1AB7AP5KY238001',
      año: 2018,
      marca: 'HYUNDAI',
      modelo: 'ACCENT',
      placaPrefix: '3456GHI',
      asientos: 5,
      puertas: 4,
      soat: true,
      precio_por_dia: 40.0,
      num_mantenimientos: 1,
      transmicion: 'Automática',
      estado: 'Disponible',
    },
    {
      vimPrefix: '1FTFW1ET4EKF51234',
      año: 2021,
      marca: 'VOLKSWAGEN',
      modelo: 'POLO',
      placaPrefix: '6399JKL',
      asientos: 5,
      puertas: 4,
      soat: true,
      precio_por_dia: 50.0,
      num_mantenimientos: 0,
      transmicion: 'Automática',
      estado: 'Disponible',
    },
  ];

  const extraCarsInfoHost3 = [
    {
      vimPrefix: '1HGCM82633A004351', // VIN válido
      año: 2017,
      marca: 'MAZDA', // Convertido a mayúsculas
      modelo: '3', // Convertido a mayúsculas
      placaPrefix: '1234ABC', // Formato válido de placa boliviana
      asientos: 5,
      puertas: 4,
      soat: true,
      precio_por_dia: 47.0,
      num_mantenimientos: 2,
      transmicion: 'Manual',
      estado: 'Disponible',
    },
    {
      vimPrefix: '2C3KA53G76H100002',
      año: 2020,
      marca: 'SUBARU',
      modelo: 'IMPREZA',
      placaPrefix: '5678DEF',
      asientos: 5,
      puertas: 4,
      soat: true,
      precio_por_dia: 55.0,
      num_mantenimientos: 1,
      transmicion: 'Automática',
      estado: 'Disponible',
    },
    {
      vimPrefix: '3N1AB7AP5KY238003',
      año: 2019,
      marca: 'RENAULT',
      modelo: 'SANDERO',
      placaPrefix: '3456GHI',
      asientos: 5,
      puertas: 4,
      soat: true,
      precio_por_dia: 44.0,
      num_mantenimientos: 1,
      transmicion: 'Manual',
      estado: 'Disponible',
    },
    {
      vimPrefix: '1FTFW1ET4EKF51234',
      año: 2022,
      marca: 'SUZUKI',
      modelo: 'SWIFT',
      placaPrefix: '6399JKL',
      asientos: 5,
      puertas: 4,
      soat: true,
      precio_por_dia: 52.0,
      num_mantenimientos: 0,
      transmicion: 'Automática',
      estado: 'Disponible',
    },
    {
      vimPrefix: '5YJ3E1EA7KF317456',
      año: 2021,
      marca: 'FIAT',
      modelo: 'CRONOS',
      placaPrefix: '4321MNO',
      asientos: 5,
      puertas: 4,
      soat: true,
      precio_por_dia: 58.0,
      num_mantenimientos: 1,
      transmicion: 'Automática',
      estado: 'Disponible',
    },
  ];

  // Función auxiliar para crear un carro extra con generación de campo único para vim y placa
  async function crearCarroExtra(carData: any, extraIndex: number, usuarioRolId: number) {
    const provinciaRandom = provinciasLaPaz[Math.floor(Math.random() * provinciasLaPaz.length)];
    const direccion = await prisma.direccion.create({
      data: {
        id_provincia: provinciaRandom.id,
        calle: `Calle Extra ${extraIndex}`,
        zona: 'Extra',
        num_casa: `${100 + extraIndex}`,
      },
    });

    const { ingresoTotal, NumeroViajes } = generarValoresAleatorios();
    const { disponible_desde, disponible_hasta } = generarFechasAleatorias();

    const carro = await prisma.carro.create({
      data: {
        vim: `${carData.vimPrefix}${extraIndex}`,
        año: carData.año,
        marca: carData.marca,
        modelo: carData.modelo,
        placa: `${carData.placaPrefix}${extraIndex}`,
        asientos: carData.asientos,
        puertas: carData.puertas,
        soat: carData.soat,
        precio_por_dia: carData.precio_por_dia,
        num_mantenimientos: carData.num_mantenimientos,
        transmicion: carData.transmicion,
        estado: carData.estado,
        id_direccion: direccion.id,
        id_usuario_rol: usuarioRolId,
        descripcion: `Carro ${carData.marca} ${carData.modelo} en excelente estado`,
        ingresoTotal,
        NumeroViajes,
        disponible_desde,
        disponible_hasta,
        id_tipodeDescuento: null
      },
    });

    return carro;
  }

  // Agregar carros extra para el host con id 1 (4 carros)
  const host1 = usuarioRoles.find((ur) => ur.id_usuario === 1);
  if (host1) {
    const carrosHost1: number[] = []; // Array para almacenar los IDs de los carros del host 1
    for (let i = 1; i <= 4; i++) {
      const carInfo = extraCarsInfo[(i - 1) % extraCarsInfo.length];
      const carro = await crearCarroExtra(carInfo, i, host1.id);
      carrosHost1.push(carro.id); // Almacenar el ID del carro creado
    }
    console.log(`Carros del host con id_usuario = 1: ${carrosHost1.join(', ')}`);
  } else {
    console.warn('No se encontró host con id 1');
  }

  // Agregar carros extra para el host con id 2 (4 carros)
  const host2 = usuarioRoles.find((ur) => ur.id_usuario === 2);
  if (host2) {
    for (let i = 1; i <= 4; i++) {
      const carInfo = extraCarsInfo[(i - 1) % extraCarsInfo.length];
      await crearCarroExtra(carInfo, i, host2.id);
    }
  } else {
    console.warn('No se encontró host con id 2');
  }

  // Agregar carros extra para el host con id 3 (5 carros)
  const host3 = usuarioRoles.find((ur) => ur.id_usuario === 3);
  if (host3) {
    for (let i = 1; i <= 5; i++) {
      // Para host3 se utiliza la lista extraCarsInfoHost3
      const carInfo = extraCarsInfoHost3[(i - 1) % extraCarsInfoHost3.length];
      await crearCarroExtra(carInfo, i, host3.id);
    }
  } else {
    console.warn('No se encontró host con id 3');
  }

  // 8) Semilla: Características adicionales y tipos de combustible
  const caracteristicasAdicionales = [
    'Aire acondicionado',
    'Bluetooth',
    'GPS',
    'Portabicicletas',
    'Soporte para esquís',
    'Pantalla táctil',
    'Sillas para bebé',
    'Cámara de reversa',
    'Asientos de cuero',
    'Sistema antirrobo',
    'Toldo o rack de techo',
    'Vidrios polarizados',
    'Sistema de sonido',
  ];

  const tiposCombustible = ['Gasolina', 'GNV', 'Eléctrico', 'Diesel'];

  const caracteristicasMap: Record<string, number> = {};
  for (const nombre of caracteristicasAdicionales) {
    const existente = await prisma.carasteristicasAdicionales.findFirst({
      where: { nombre },
    });
    const created =
      existente ??
      (await prisma.carasteristicasAdicionales.create({
        data: { nombre },
      }));
    caracteristicasMap[nombre] = created.id;
  }

  const combustibleMap: Record<string, number> = {};
  for (const nombre of tiposCombustible) {
    const existente = await prisma.tipoCombustible.findFirst({
      where: { tipoDeCombustible: nombre },
    });
    const created =
      existente ??
      (await prisma.tipoCombustible.create({
        data: { tipoDeCombustible: nombre, id_carro: 0 },
      }));
    combustibleMap[nombre] = created.id;
  }

  // 9) Relacionar cada carro con características adicionales y con uno o más tipos de combustible
  const carros = await prisma.carro.findMany();
  for (const carro of carros) {
    // Asignar 3 características aleatorias
    const shuffledCarac = [...caracteristicasAdicionales]
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);
    for (const c of shuffledCarac) {
      await prisma.caracteristicasAdicionalesCarro.create({
        data: {
          id_carro: carro.id,
          id_carasteristicasAdicionales: caracteristicasMap[c],
        },
      });
    }

    // Asignar 1 o 2 tipos de combustible aleatorios
    const shuffledComb = [...tiposCombustible]
      .sort(() => 0.5 - Math.random())
      .slice(0, Math.random() > 0.5 ? 2 : 1);
    for (const t of shuffledComb) {
      await prisma.combustibleCarro.create({
        data: {
          id_carro: carro.id,
          id_combustible: combustibleMap[t],
        },
      });
    }
  }

  console.log('✅ Seed de roles, usuario-roles, direcciones, carros y asociaciones completado.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });