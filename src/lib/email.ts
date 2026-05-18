import { Resend } from 'resend';
import { leaveRequestNotificationHtml } from './email-templates/leave-request-notification';
import { leaveApprovedHtml } from './email-templates/leave-approved';
import { leaveDeclinedHtml } from './email-templates/leave-declined';
import { rotaPublishedHtml } from './email-templates/rota-published';
import { shiftChangedHtml } from './email-templates/shift-changed';

function getResend() {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY is not set. Emails will be logged to console.');
    return null;
  }
  return new Resend(process.env.RESEND_API_KEY);
}

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const resend = getResend();
  if (!resend) {
    console.log('[EMAIL LOG] Would send:', { to, subject, html: html.substring(0, 100) + '...' });
    return { success: true };
  }

  try {
    const data = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@alchemetryx.com',
      to,
      subject,
      html,
    });
    return { success: true, data };
  } catch (error) {
    console.error('Email send failed:', error);
    return { success: false, error };
  }
}

export async function sendLeaveRequestNotification(
  request: { staffId: string; leaveType: string; startDate: string; endDate: string; notes?: string | null },
  staffName: string,
  managerEmail: string,
) {
  const html = leaveRequestNotificationHtml({
    staffName,
    leaveType: request.leaveType,
    startDate: request.startDate,
    endDate: request.endDate,
    notes: request.notes,
    dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/leave`,
  });

  const result = await sendEmail({
    to: managerEmail,
    subject: `New Leave Request — ${staffName} (${request.leaveType})`,
    html,
  });

  if (!result.success) {
    console.error('Failed to send leave request notification email');
  }

  return result;
}

export async function sendLeaveApprovalEmail(
  request: { startDate: string; endDate: string; leaveType: string },
  staffName: string,
  staffEmail: string,
) {
  const html = leaveApprovedHtml({
    staffName,
    leaveType: request.leaveType,
    startDate: request.startDate,
    endDate: request.endDate,
  });

  const result = await sendEmail({
    to: staffEmail,
    subject: 'Leave Approved',
    html,
  });

  if (!result.success) {
    console.error('Failed to send leave approval email');
  }

  return result;
}

export async function sendLeaveDeclineEmail(
  request: { startDate: string; endDate: string; leaveType: string },
  staffName: string,
  staffEmail: string,
  managerNotes?: string | null,
) {
  const html = leaveDeclinedHtml({
    staffName,
    leaveType: request.leaveType,
    startDate: request.startDate,
    endDate: request.endDate,
    managerNotes,
  });

  const result = await sendEmail({
    to: staffEmail,
    subject: 'Leave Declined',
    html,
  });

  if (!result.success) {
    console.error('Failed to send leave decline email');
  }

  return result;
}

export async function sendRotaPublishedEmail(
  staffEmail: string,
  staffName: string,
  shifts: { date: string; code: string | null; time: string; floor: string }[],
) {
  const html = rotaPublishedHtml({ staffName, shifts });

  const result = await sendEmail({
    to: staffEmail,
    subject: 'Your Rota Has Been Published',
    html,
  });

  if (!result.success) {
    console.error('Failed to send rota published email');
  }

  return result;
}

export async function sendShiftChangedEmail(
  staffEmail: string,
  staffName: string,
  date: string,
  oldCode: string,
  newCode: string,
) {
  const html = shiftChangedHtml({ staffName, date, oldCode, newCode });

  const result = await sendEmail({
    to: staffEmail,
    subject: 'Shift Change Notification',
    html,
  });

  if (!result.success) {
    console.error('Failed to send shift change email');
  }

  return result;
}
