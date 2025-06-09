import { PrismaClient, Genero } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 1) Crear o recuperar el país "Bolivia"
  let bolivia = await prisma.pais.findFirst({
    where: { nombre: 'Bolivia' },
  });

  if (!bolivia) {
    bolivia = await prisma.pais.create({
      data: { nombre: 'Bolivia' },
    });
  }

  // 2) Crear ciudades si no existen
  const ciudadesNombres = [
    'La Paz',
    'Cochabamba',
    'Santa Cruz',
    'Oruro',
    'Potosí',
    'Chuquisaca',
    'Tarija',
    'Beni',
    'Pando',
  ];

  for (const nombre of ciudadesNombres) {
    const existente = await prisma.ciudad.findFirst({
      where: { nombre },
    });
    if (!existente) {
      await prisma.ciudad.create({
        data: {
          nombre,
          id_pais: bolivia.id,  // Cambiado de Pais.connect a id_pais directo
        },
      });
    }
  }

  // 3) Leer ciudades para obtener sus IDs
  const ciudadesBD = await prisma.ciudad.findMany();

  // 4) Crear usuarios de prueba (si no existen ya)
  const usuariosSeed = [
    {
      nombre: 'Ana Pérez',
      genero: Genero.FEMENINO,
      fecha_nacimiento: new Date('1990-05-14'),
      contraseña: '1234', // Cambiado de contraseña a contrase_a
      telefono: '78912345',
      id_ciudad: ciudadesBD.find((d) => d.nombre === 'La Paz')?.id,
      correo: 'ana.perez@example.com',
    },
    {
      nombre: 'Carlos Gómez',
      genero: Genero.MASCULINO,
      fecha_nacimiento: new Date('1985-11-23'),
      contraseña: 'abcd', // Cambiado
      telefono: '71234567',
      id_ciudad: ciudadesBD.find((d) => d.nombre === 'Cochabamba')?.id,
      correo: 'carlos.gomez@example.com',
    },
    {
      nombre: 'Luis Flores',
      genero: Genero.MASCULINO,
      fecha_nacimiento: new Date('1998-07-09'),
      contraseña: 'qwerty', // Cambiado
      telefono: '70123456',
      id_ciudad: ciudadesBD.find((d) => d.nombre === 'Santa Cruz')?.id,
      correo: 'luis.flores@example.com',
    },
    {
      nombre: 'María Rojas',
      genero: Genero.FEMENINO,
      fecha_nacimiento: new Date('2000-01-01'),
      contraseña: 'pass', // Cambiado
      telefono: '76543210',
      id_ciudad: ciudadesBD.find((d) => d.nombre === 'Oruro')?.id,
      correo: 'maria.rojas@example.com',
    },
    {
      nombre: 'Patricia Díaz',
      genero: Genero.OTRO,
      fecha_nacimiento: new Date('1993-09-27'),
      contraseña: 'pat123', // Cambiado
      telefono: '73456789',
      id_ciudad: ciudadesBD.find((d) => d.nombre === 'Potosí')?.id,
      correo: 'patricia.diaz@example.com',
    },
    {
      nombre: 'Renter Tucumanas',
      genero: Genero.OTRO,
      fecha_nacimiento: new Date('1993-09-27'),
      contraseña: '$2b$10$rKh4YJSaCJag0l3UAHIeo.0gBrE7XH/QEm/ZBPjDkCDGLZS5j1vZy', 
      telefono: '66666666',
      id_ciudad: ciudadesBD.find((d) => d.nombre === 'Potosí')?.id,
      correo: 'admin@gmail.com',
    },
    {
      nombre: 'Host Tucumanas',
      genero: Genero.OTRO,
      fecha_nacimiento: new Date('1993-09-27'),
      contraseña: '$2b$10$HgqpO/h/yqOh25wXrlRotONisbdpyFpb2sbqWoW3OZ7KpB3Dt4Y4e',
      telefono: '66666667',
      id_ciudad: ciudadesBD.find((d) => d.nombre === 'Potosí')?.id,
      correo: 'host@gmail.com',
    },
    {
      nombre: 'Admin Tucumanas',
      genero: Genero.OTRO,
      fecha_nacimiento: new Date('1993-09-27'),
      contraseña: '$2b$10$3mvTMaCOV/twjtQMVk2Sy.21lfQmUeS6Tny9jk9XgXCjVmb4q3Q4W', // Cambiado
      telefono: '66666668',
      id_ciudad: ciudadesBD.find((d) => d.nombre === 'Potosí')?.id,
      correo: 'admin@gmail.com',
    },
  ] as const;

  for (const u of usuariosSeed) {
    const existe = await prisma.usuario.findFirst({
      where: { nombre: u.nombre },
    });
    if (!existe) {
      await prisma.usuario.create({ 
        data: {
          ...u,
          id_ciudad: u.id_ciudad ?? undefined, // Manejo de posible null
        } 
      });
    }
  }

  console.log('🌱 Datos semilla insertados correctamente');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });