import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  @Get('profile')
  @UseGuards(AuthGuard())
  getProfile() {
    return { message: 'Vous êtes authentifié !' };
  }
}