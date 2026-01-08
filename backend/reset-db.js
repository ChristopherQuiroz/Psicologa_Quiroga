const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function resetDatabase() {
  console.log('��� Limpiando base de datos...');
  
  // ELIMINAR en orden (por restricciones de foreign keys)
  await prisma.$executeRaw`DELETE FROM "Bloqueo"`;
  await prisma.$executeRaw`DELETE FROM "Reserva"`;
  await prisma.$executeRaw`DELETE FROM "Consulta"`;
  await prisma.$executeRaw`DELETE FROM "Paciente"`;
  await prisma.$executeRaw`DELETE FROM "Psicologa"`;
  await prisma.$executeRaw`DELETE FROM "Usuario"`;
  
  console.log('✅ Base de datos limpiada');
  
  // Crear usuarios de prueba (CONTRASEÑAS EN TEXTO)
  const psicologaUser = await prisma.usuario.create({
    data: {
      email: 'psicologa@quiroga.com',
      password: 'admin123', // TEXTO PLANO
      tipo: 'psicologa',
    },
  });

  await prisma.psicologa.create({
    data: {
      nombre: 'Lic. María Quiroga',
      id_usuario: psicologaUser.id_usuario,
    },
  });

  console.log('✅ Psicóloga creada: psicologa@quiroga.com / admin123');

  // Crear pacientes
  const pacientes = [
    { email: 'juan@test.com', password: 'password123', nombre: 'Juan Pérez', telefono: '77712345' },
    { email: 'maria@test.com', password: 'password123', nombre: 'María López', telefono: '77754321' },
    { email: 'carlos@test.com', password: 'password123', nombre: 'Carlos García', telefono: '77798765' },
  ];

  for (const p of pacientes) {
    const user = await prisma.usuario.create({
      data: {
        email: p.email,
        password: p.password,
        tipo: 'paciente',
      },
    });

    await prisma.paciente.create({
      data: {
        nombre: p.nombre,
        telefono: p.telefono,
        id_usuario: user.id_usuario,
      },
    });
    console.log(`✅ Paciente: ${p.email} / ${p.password}`);
  }

  // Crear tipos de consulta
  const consultas = [
    { motivo: 'Consulta inicial', duracion: 60 },
    { motivo: 'Sesión individual', duracion: 50 },
    { motivo: 'Sesión de pareja', duracion: 80 },
    { motivo: 'Seguimiento', duracion: 40 },
  ];

  for (const c of consultas) {
    await prisma.consulta.create({ data: c });
  }

  console.log('✅ Base de datos lista para pruebas');
  await prisma.$disconnect();
}

resetDatabase().catch(console.error);
