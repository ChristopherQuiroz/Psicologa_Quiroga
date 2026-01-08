import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de datos...');

  // 1. Primero, verificar si los usuarios ya existen
  console.log('🔍 Verificando usuarios existentes...');
  
  const existingUsers = await prisma.usuario.findMany({
    where: {
      email: {
        in: [
          'psicologa@quiroga.com',
        ]
      }
    }
  });

  console.log(`✅ Encontrados ${existingUsers.length} usuarios existentes`);

  // 2. Crear psicóloga solo si no existe
  const psicologaEmail = 'psicologa@quiroga.com';
  const psicologaExistente = existingUsers.find(u => u.email === psicologaEmail);
  
  if (!psicologaExistente) {
    console.log('👩‍⚕️ Creando cuenta de psicóloga...');
    await prisma.usuario.create({
      data: {
        email: psicologaEmail,
        password: 'admin123',
        tipo: 'psicologa',
        psicologa: {
          create: {
            nombre: 'Lic. María Quiroga',
          },
        },
      },
    });
    console.log(`✅ Psicóloga creada: ${psicologaEmail}`);
  } else {
    console.log(`✅ Psicóloga ya existe: ${psicologaEmail}`);
    // Actualizar contraseña por si acaso
    await prisma.usuario.update({
      where: { email: psicologaEmail },
      data: { password: 'admin123' }
    });
    console.log(`🔑 Contraseña actualizada para psicóloga`);
  }

  // 4. Crear consultas (no necesitan ser únicas por motivo)
  console.log('📋 Creando tipos de consulta...');
  
  // Primero verificar si ya hay consultas
  const consultasCount = await prisma.consulta.count();
  
  if (consultasCount === 0) {
    const consultas = [
      { motivo: 'Consulta inicial', duracion: 60 },
      { motivo: 'Seguimiento', duracion: 45 },
      { motivo: 'Terapia individual', duracion: 50 },
    ];

    for (const consulta of consultas) {
      await prisma.consulta.create({
        data: consulta,
      });
      console.log(`✅ Consulta creada: ${consulta.motivo}`);
    }
  } else {
    console.log(`✅ Ya existen ${consultasCount} consultas en la base de datos`);
  }

  console.log('\n🎉 Seed completado exitosamente!');
  console.log('\n📋 Credenciales para pruebas:');
  console.log('==============================');
  console.log('👩‍⚕️ Psicóloga:');
  console.log('  Email: psicologa@quiroga.com');
  console.log('  Password: admin123');
  console.log('\n💡 Nota: Si las credenciales no funcionan, verifica la contraseña exacta en la base de datos');
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });