
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SupabaseStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    const supabaseUrl = configService.get<string>('SUPABASE_URL');
    const supabaseAnonKey = configService.get<string>('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase URL or Anon Key is not defined in environment variables.');
    }

    const jwtSecret = configService.get<string>('SUPABASE_JWT_SECRET');

    if (!jwtSecret) {
      throw new Error('Supabase JWT Secret is not defined in environment variables.');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret, // Utilisez la clé secrète JWT de Supabase
      issuer: `${supabaseUrl}/auth/v1`,
      audience: 'authenticated',
    });
  }

  async validate(payload: any) {
    // Le payload est le contenu décodé du JWT.
    // passport-jwt a déjà validé la signature et l'expiration.
    // Nous pouvons faire confiance à ce payload.
    if (payload.aud !== 'authenticated') {
      throw new UnauthorizedException('Invalid token audience');
    }
    // Retourne les informations utilisateur qui seront attachées à req.user
    return { id: payload.sub, email: payload.email, ...payload };
  }
}
