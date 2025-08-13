
import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587', 10),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async sendGroupInvitation(
    to: string,
    groupName: string,
    inviterName: string,
    invitationLink: string,
  ) {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to,
      subject: `Invitation à rejoindre le club de lecture ${groupName} sur Codex`, 
      html: `
        <p>Bonjour,</p>
        <p>${inviterName} vous a invité(e) à rejoindre le club de lecture <strong>${groupName}</strong> sur Codex.</p>
        <p>Pour accepter l'invitation, veuillez cliquer sur le lien ci-dessous :</p>
        <p><a href="${invitationLink}">Rejoindre le club ${groupName}</a></p>
        <p>Si vous n'avez pas de compte Codex, vous serez invité(e) à en créer un avant de rejoindre le club.</p>
        <p>À bientôt sur Codex !</p>
        <p>L'équipe Codex</p>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('MailService: Error sending email:', error);
      throw new Error('Failed to send email.');
    }
  }
}
