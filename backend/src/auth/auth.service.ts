// backend/src/auth/auth.service.ts
import { ConflictException, Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    console.log('🔐 === INICIANDO LOGIN ===');
    
    const usuario = await this.prisma.usuario.findUnique({
      where: { email: loginDto.email },
      include: {
        paciente: true,
        psicologa: true,
      }
    });
    
    if (!usuario) {
      console.log('❌ Usuario no encontrado para email:', loginDto.email);
      throw new UnauthorizedException('Credenciales inválidas');
    }
    
    console.log('👤 Usuario encontrado:', usuario.email);
    console.log('🔑 Contraseña proporcionada:', loginDto.password);
    console.log('💾 Hash almacenado en BD:', usuario.password.substring(0, 30) + '...');
    
    // Comparar contraseña
    let isValidPassword = false;
    
    if (usuario.password.startsWith('$2')) {
      console.log('🔍 Comparando con bcrypt...');
      isValidPassword = await bcrypt.compare(loginDto.password, usuario.password);
      console.log('✅ Resultado bcrypt.compare:', isValidPassword);
    } else {
      console.log('⚠️  AVISO: Contraseña en texto plano detectada');
      console.log('🔄 Comparando texto plano...');
      isValidPassword = (loginDto.password === usuario.password);
      
      if (isValidPassword) {
        console.log('🔄 Migrando contraseña a bcrypt automáticamente...');
        try {
          const hashedPassword = await bcrypt.hash(loginDto.password, 10);
          await this.prisma.usuario.update({
            where: { id_usuario: usuario.id_usuario },
            data: { password: hashedPassword },
          });
          console.log('✅ Contraseña migrada exitosamente a bcrypt');
        } catch (migrationError) {
          console.error('❌ Error migrando contraseña:', migrationError);
        }
      }
    }
    
    if (!isValidPassword) {
      console.log('❌ CONTRASEÑA INVÁLIDA');
      throw new UnauthorizedException('Credenciales inválidas');
    }
    
    console.log('🎉 Login exitoso para:', usuario.email);
    
    // ✅ CORRECCIÓN: Construir payload y userResponse correctamente
    const payload: any = { 
      sub: usuario.id_usuario, 
      email: usuario.email,
      tipo: usuario.tipo,
    };
    
    let userResponse: any = {
      id: usuario.id_usuario,
      email: usuario.email,
      tipo: usuario.tipo,
    };
    
    if (usuario.tipo === 'paciente' && usuario.paciente) {
      payload.id_paciente = usuario.paciente.id_paciente;
      userResponse.nombre = usuario.paciente.nombre;
      userResponse.telefono = usuario.paciente.telefono;
      userResponse.id_paciente = usuario.paciente.id_paciente;
      console.log('👤 Es paciente, id:', usuario.paciente.id_paciente);
    } else if (usuario.tipo === 'psicologa' && usuario.psicologa) {
      payload.id_psicologa = usuario.psicologa.id_psicologa;
      userResponse.nombre = usuario.psicologa.nombre;
      userResponse.id_psicologa = usuario.psicologa.id_psicologa;
      console.log('👩‍⚕️ Es psicóloga, id:', usuario.psicologa.id_psicologa);
    }
    
    const access_token = this.jwtService.sign(payload);
    
    console.log('📤 Enviando respuesta al frontend:', {
      tokenPreview: access_token.substring(0, 30) + '...',
      userResponse
    });
    
    return {
      access_token,
      user: userResponse
    };
  }
  
  async register(registerDto: RegisterDto) {
    const { email, password, nombre, telefono } = registerDto;

    // Validaciones básicas
    if (!email || !password || !nombre || !telefono) {
      throw new BadRequestException('Todos los campos son obligatorios');
    }

    // Verificar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new BadRequestException('El formato del email no es válido');
    }

    // Verificar si el email ya existe
    const existingUser = await this.prisma.usuario.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('El email ya está registrado');
    }

    // 🔐 SIEMPRE hashear la contraseña
    console.log('🔐 Hasheando contraseña...');
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('✅ Contraseña hasheada exitosamente');

    // ✅ CORRECCIÓN: Transacción corregida
    const newUser = await this.prisma.$transaction(async (prisma) => {
      const usuario = await prisma.usuario.create({
        data: {
          email,
          password: hashedPassword,
          tipo: 'paciente',
        },
      });

      const paciente = await prisma.paciente.create({
        data: {
          nombre,
          telefono,
          id_usuario: usuario.id_usuario,
        },
      });

      return { usuario, paciente };
    });

    const payload: any = {
      sub: newUser.usuario.id_usuario,
      email: newUser.usuario.email,
      tipo: newUser.usuario.tipo,
      id_paciente: newUser.paciente.id_paciente,
    };

    return {
      access_token: this.jwtService.sign(payload, { expiresIn: '8h' }),
      user: {
        id: newUser.usuario.id_usuario,
        email: newUser.usuario.email,
        tipo: newUser.usuario.tipo,
        nombre: newUser.paciente.nombre,
        telefono: newUser.paciente.telefono,
        id_paciente: newUser.paciente.id_paciente,
      },
      message: 'Registro exitoso. Bienvenido/a ' + nombre,
    };
  }

  // 🔧 MÉTODO PARA MIGRAR TODOS LOS USUARIOS A BCRYPT
  async migrateAllUsersToBcrypt() {
    console.log('🔄 === INICIANDO MIGRACIÓN COMPLETA A BCRYPT ===');
    
    const usuarios = await this.prisma.usuario.findMany();
    console.log(`🔍 Encontrados ${usuarios.length} usuarios`);
    
    let migratedCount = 0;
    let skippedCount = 0;
    
    for (const usuario of usuarios) {
      // Si ya es un hash bcrypt, saltar
      if (usuario.password.startsWith('$2')) {
        console.log(`✅ ${usuario.email}: Ya tiene bcrypt`);
        skippedCount++;
        continue;
      }
      
      console.log(`🔄 ${usuario.email}: Migrando...`);
      console.log(`   Contraseña actual (texto plano): ${usuario.password}`);
      
      try {
        // Hashear la contraseña existente
        const hashedPassword = await bcrypt.hash(usuario.password, 10);
        
        await this.prisma.usuario.update({
          where: { id_usuario: usuario.id_usuario },
          data: { password: hashedPassword },
        });
        
        migratedCount++;
        console.log(`✅ ${usuario.email}: Migrado exitosamente`);
      } catch (error) {
        console.error(`❌ ${usuario.email}: Error en migración:`, error);
      }
    }
    
    console.log('🎉 MIGRACIÓN COMPLETADA');
    console.log(`✅ ${migratedCount} usuarios migrados`);
    console.log(`⏭️  ${skippedCount} usuarios ya tenían bcrypt`);
    
    return { migratedCount, skippedCount };
  }
}