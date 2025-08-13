import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { SupabaseStrategy } from './supabase.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    ConfigModule,
  ],
  providers: [AuthService, SupabaseStrategy],
  controllers: [AuthController],
  exports: [PassportModule, SupabaseStrategy], // Exporter pour que les autres modules puissent l'utiliser
})
export class AuthModule {}

