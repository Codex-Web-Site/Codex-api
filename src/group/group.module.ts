
import { Module } from '@nestjs/common';
import { GroupController } from './group.controller';
import { GroupService } from './group.service';
import { MailModule } from '../mail/mail.module';
import { AuthModule } from '../auth/auth.module'; // Importer AuthModule

@Module({
  imports: [MailModule, AuthModule], // Ajouter AuthModule aux imports
  controllers: [GroupController],
  providers: [GroupService],
})
export class GroupModule {}
