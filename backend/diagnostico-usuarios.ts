// Crea este archivo temporal: backend/diagnostico-usuarios.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function diagnosticar() {
  console.log('🔍 === DIAGNÓSTICO DE USUARIOS ===\n');
  
  const usuarios = await prisma.usuario.findMany({
    include: { paciente: true }
  });
  
  console.log(`📊 Total de usuarios: ${usuarios.length}\n`);
  
  usuarios.forEach((usuario, index) => {
    console.log(`👤 Usuario ${index + 1}:`);
    console.log(`   Email: ${usuario.email}`);
    console.log(`   Tipo: ${usuario.tipo}`);
    console.log(`   Contraseña: ${usuario.password.substring(0, 30)}...`);
    console.log(`   Longitud: ${usuario.password.length}`);
    console.log(`   ¿Es bcrypt? ${usuario.password.startsWith('$2')}`);
    console.log(`   ¿Empieza con $2a$? ${usuario.password.startsWith('$2a$')}`);
    console.log(`   ¿Empieza con $2b$? ${usuario.password.startsWith('$2b$')}`);
    console.log(`   ¿Contiene /? ${usuario.password.includes('/')}`);
    console.log(`   ¿Contiene .? ${usuario.password.includes('.')}`);
    console.log('---\n');
  });
  
  await prisma.$disconnect();
}

diagnosticar().catch(console.error);