import { baseLayout } from './base';

type Props = {
  staffName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  notes?: string | null;
  dashboardUrl: string;
};

export function leaveRequestNotificationHtml(p: Props): string {
  return baseLayout(
    'New Leave Request',
    `
    <div style="text-align:center;margin-bottom:24px;">
      <div style="display:inline-block;width:48px;height:48px;border-radius:50%;background-color:#D4AF37;color:#1A2642;font-size:24px;line-height:48px;font-weight:700;">!</div>
    </div>
    <h1 style="font-size:18px;font-weight:700;color:#1A2642;margin:0 0 8px 0;text-align:center;">New Leave Request</h1>
    <p style="font-size:14px;color:#6B7280;margin:0 0 24px 0;text-align:center;">
      <strong style="color:#1A2642;">${p.staffName}</strong> has submitted a leave request.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="padding:12px 16px;background-color:#F8F6F0;border-radius:8px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="font-size:12px;color:#6B7280;padding-bottom:4px;">Leave Type</td>
              <td style="font-size:14px;color:#1A2642;font-weight:600;text-align:right;padding-bottom:4px;">${p.leaveType}</td>
            </tr>
            <tr>
              <td style="font-size:12px;color:#6B7280;padding-bottom:4px;">Start Date</td>
              <td style="font-size:14px;color:#1A2642;font-weight:600;text-align:right;padding-bottom:4px;">${p.startDate}</td>
            </tr>
            <tr>
              <td style="font-size:12px;color:#6B7280;">End Date</td>
              <td style="font-size:14px;color:#1A2642;font-weight:600;text-align:right;">${p.endDate}</td>
            </tr>
            ${p.notes ? `
            <tr>
              <td colspan="2" style="font-size:12px;color:#6B7280;padding-top:12px;">Notes</td>
            </tr>
            <tr>
              <td colspan="2" style="font-size:13px;color:#1A2642;padding-top:4px;">${p.notes}</td>
            </tr>` : ''}
          </table>
        </td>
      </tr>
    </table>
    <a href="${p.dashboardUrl}"
       style="display:block;text-align:center;background-color:#1A2642;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:8px;">
      Review Request
    </a>
    `,
  );
}
