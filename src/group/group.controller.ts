
import { Controller, Post, Body, UseGuards, Req, Get, Query, UnauthorizedException, Delete, Param, Patch } from '@nestjs/common';
import { GroupService } from './group.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('groups')
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  async createGroup(@Body() createGroupDto: { name: string; description?: string; avatar_url?: string }, @Req() req) {
    const userId = req.user.id;
    const accessToken = req.headers.authorization?.split(' ')[1]; // Extraire le token Bearer

    if (!accessToken) {
      throw new UnauthorizedException('Access token not found.');
    }

    const group = await this.groupService.createGroup(createGroupDto, userId, accessToken);
    return group;
  }

  

  @Delete(':groupId')
  @UseGuards(AuthGuard('jwt'))
  async deleteGroup(@Param('groupId') groupId: string, @Req() req) {
    const userId = req.user.id;
    const accessToken = req.headers.authorization?.split(' ')[1];

    if (!accessToken) {
      throw new UnauthorizedException('Access token not found.');
    }

    await this.groupService.deleteGroup(groupId, userId, accessToken);
    return { message: 'Groupe supprimé avec succès.' };
  }

  @Patch(':groupId')
  @UseGuards(AuthGuard('jwt'))
  async updateGroup(@Param('groupId') groupId: string, @Body() updateGroupDto: { name?: string; description?: string; avatar_url?: string }, @Req() req) {
    const accessToken = req.headers.authorization?.split(' ')[1];

    if (!accessToken) {
      throw new UnauthorizedException('Access token not found.');
    }

    const group = await this.groupService.updateGroup(groupId, updateGroupDto, accessToken);
    return group;
  }

  @Post('join')
  @UseGuards(AuthGuard('jwt'))
  async joinGroup(@Body() body: { invitationCode: string }, @Req() req) {
    const userId = req.user.id;
    const accessToken = req.headers.authorization?.split(' ')[1];

    if (!accessToken) {
      throw new UnauthorizedException('Access token not found.');
    }

    return this.groupService.joinGroup(body.invitationCode, userId, accessToken);
  }

  @Delete(':groupId/leave')
  @UseGuards(AuthGuard('jwt'))
  async leaveGroup(@Param('groupId') groupId: string, @Req() req) {
    const userId = req.user.id;
    const accessToken = req.headers.authorization?.split(' ')[1];

    if (!accessToken) {
      throw new UnauthorizedException('Access token not found.');
    }

    return this.groupService.leaveGroup(groupId, userId, accessToken);
  }

  @Patch(':groupId/regenerate-code')
  @UseGuards(AuthGuard('jwt'))
  async regenerateInvitationCode(@Param('groupId') groupId: string, @Req() req) {
    const accessToken = req.headers.authorization?.split(' ')[1];

    if (!accessToken) {
      throw new UnauthorizedException('Access token not found.');
    }

    return this.groupService.regenerateInvitationCode(groupId, accessToken);
  }
}
