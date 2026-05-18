import { baseLayout } from './base';

type Props = {
  staffName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
};

export function leaveApprovedHtml(p: Props): string {
  return baseLayout(
    'Leave Approved',
    `
    <div style="text-align:center;margin-bottom:24px;">
      <div style="display:inline-block;width:48px;height:48px;border-radius:50%;background-color:#008B8B;color:#ffffff;font-size:24px;line-height:48px;font-weight:700;">&#10003;</div>
    </div>
    <h1 style="font-size:18px;font-weight:700;color:#1A2642;margin:0 0 8px 0;text-align:center;">Leave Approved</h1>
    <p style="font-size:14px;color:#6B7280;margin:0 0 24px 0;text-align:center;">
      Your <strong style="color:#1A2642;">${p.leaveType}</strong> leave has been approved.
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
          </table>
        </td>
      </tr>
    </table>
    <p style="font-size:13px;color:#6B7280;text-align:center;margin:0;">
      The rota has been updated to reflect your approved leave.
    </p>
    `,
  );
}
