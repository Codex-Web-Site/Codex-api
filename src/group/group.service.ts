
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { MailService } from '../mail/mail.service';
import { ConfigService } from '@nestjs/config';
import { createClient, User } from '@supabase/supabase-js';

@Injectable()
export class GroupService {
  private supabase;

  constructor(
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL')!;
    const supabaseAnonKey = this.configService.get<string>('SUPABASE_ANON_KEY')!;
    const supabaseServiceRoleKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

    this.supabase = createClient(
      supabaseUrl,
      supabaseAnonKey,
    );
  }

  async createGroup(createGroupDto: { name: string; description?: string; avatar_url?: string }, userId: string, accessToken: string) {
    const { name, description, avatar_url } = createGroupDto;

    // Créer un client Supabase avec le token d'accès de l'utilisateur
    const supabase = createClient(
      this.configService.get<string>('SUPABASE_URL')!,
      this.configService.get<string>('SUPABASE_ANON_KEY')!,
      {
        global: {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      }
    );

    // 1. Créer le groupe
    const generateCode = (length: number) => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let result = '';
      for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };
    const invitation_code = generateCode(10);

    const { data: group, error: groupError } = await supabase
      .from('groups')
      .insert({
        name,
        description,
        avatar_url,
        created_by: userId,
        invitation_code,
      })
      .select()
      .single();

    if (groupError) {
      throw new HttpException('Failed to create group.', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    // 2. Ajouter le créateur comme premier membre (admin)
    const { error: memberError } = await supabase // Utiliser le client authentifié
      .from('group_members')
      .insert({
        group_id: group.id,
        user_id: userId,
        role: 'admin', // Le créateur est admin par défaut
      });

    if (memberError) {
      // Idéalement, il faudrait une transaction pour annuler la création du groupe
      throw new HttpException('Failed to add creator to group.', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return group;
  }

  

  

  async deleteGroup(groupId: string, userId: string, accessToken: string): Promise<void> {
    // Créer un client Supabase avec le token d'accès de l'utilisateur
    const supabase = createClient(
      this.configService.get<string>('SUPABASE_URL')!,
      this.configService.get<string>('SUPABASE_ANON_KEY')!,
      {
        global: {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      }
    );

    // La politique RLS sur la table 'groups' (Allow creator to delete their own groups)
    // et sur 'group_members' (Allow group admin to remove members) gérera les permissions.
    // Si la table group_members a une contrainte ON DELETE CASCADE sur group_id,
    // les membres seront automatiquement supprimés.
    const { error } = await supabase
      .from('groups')
      .delete()
      .eq('id', groupId)
      .eq('created_by', userId); // Ajouté pour une sécurité supplémentaire côté application, bien que RLS le gère.

    if (error) {
      throw new HttpException('Failed to delete group or not authorized.', HttpStatus.FORBIDDEN);
    }
  }

  async updateGroup(groupId: string, updateGroupDto: { name?: string; description?: string; avatar_url?: string }, accessToken: string) {
    const supabase = createClient(
      this.configService.get<string>('SUPABASE_URL')!,
      this.configService.get<string>('SUPABASE_ANON_KEY')!,
      {
        global: {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      }
    );

    const { data, error } = await supabase
      .from('groups')
      .update(updateGroupDto)
      .eq('id', groupId)
      .select()
      .single();

    if (error) {
      console.error('Error updating group:', error);
      throw new HttpException('Failed to update group.', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return data;
  }

  async joinGroup(invitationCode: string, userId: string, accessToken: string) {
    const supabase = createClient(
      this.configService.get<string>('SUPABASE_URL')!,
      this.configService.get<string>('SUPABASE_ANON_KEY')!,
      {
        global: {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      }
    );

    // 1. Trouver le groupe par code d'invitation
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('id')
      .eq('invitation_code', invitationCode)
      .single();

    if (groupError || !group) {
      throw new HttpException('Code d\'invitation invalide ou expiré.', HttpStatus.BAD_REQUEST);
    }

    // 2. Vérifier si l'utilisateur est déjà membre
    const { data: existingMember, error: memberCheckError } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', group.id)
      .eq('user_id', userId)
      .single();

    if (memberCheckError && memberCheckError.code !== 'PGRST116') { // PGRST116: no rows found
      throw new HttpException('Erreur lors de la vérification des membres.', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    if (existingMember) {
      throw new HttpException('Vous êtes déjà membre de ce groupe.', HttpStatus.CONFLICT);
    }

    // 3. Ajouter l'utilisateur au groupe
    const { error: insertError } = await supabase
      .from('group_members')
      .insert({
        group_id: group.id,
        user_id: userId,
        role: 'member',
      });

    if (insertError) {
      throw new HttpException('Échec de l\'ajout au groupe : ' + insertError.message || 'raison inconnue.', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return { message: 'Groupe rejoint avec succès !' };
  }

  async leaveGroup(groupId: string, userId: string, accessToken: string) {
    const supabase = createClient(
      this.configService.get<string>('SUPABASE_URL')!,
      this.configService.get<string>('SUPABASE_ANON_KEY')!,
      {
        global: {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      }
    );

    // Vérifier si l utilisateur est bien membre du groupe
    const { data: member, error: memberError } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .single();

    if (memberError || !member) {
      throw new HttpException('Vous n\'êtes pas membre de ce groupe ou le groupe n\'existe pas.', HttpStatus.NOT_FOUND);
    }

    // Supprimer l utilisateur du groupe
    const { error: deleteError } = await supabase
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', userId);

    if (deleteError) {
      console.error('Error leaving group:', deleteError);
      throw new HttpException('Échec de la sortie du groupe.', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return { message: 'Vous avez quitté le groupe avec succès.' };
  }

  async regenerateInvitationCode(groupId: string, accessToken: string) {
    const supabase = createClient(
      this.configService.get<string>('SUPABASE_URL')!,
      this.configService.get<string>('SUPABASE_ANON_KEY')!,
      {
        global: {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      }
    );

    const generateCode = (length: number) => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let result = '';
      for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };
    const newCode = generateCode(10);

    const { data, error } = await supabase
      .from('groups')
      .update({ invitation_code: newCode })
      .eq('id', groupId)
      .select('invitation_code')
      .single();

    if (error) {
      throw new HttpException('Impossible de régénérer le code d\'invitation.', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return data;
  }
}
