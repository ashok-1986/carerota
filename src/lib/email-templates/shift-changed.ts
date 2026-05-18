import { baseLayout } from './base';

type Props = {
  staffName: string;
  date: string;
  oldCode: string;
  newCode: string;
};

export function shiftChangedHtml(p: Props): string {
  return baseLayout(
    'Shift Changed',
    `
    <div style="text-align:center;margin-bottom:24px;">
      <div style="display:inline-block;width:48px;height:48px;border-radius:50%;background-color:#6B4C9A;color:#ffffff;font-size:24px;line-height:48px;font-weight:700;">&#8635;</div>
    </div>
    <h1 style="font-size:18px;font-weight:700;color:#1A2642;margin:0 0 8px 0;text-align:center;">Shift Updated</h1>
    <p style="font-size:14px;color:#6B7280;margin:0 0 24px 0;text-align:center;">
      Hi <strong style="color:#1A2642;">${p.staffName}</strong>, your shift on <strong style="color:#1A2642;">${p.date}</strong> has been changed.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="padding:12px 16px;background-color:#F8F6F0;border-radius:8px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="font-size:12px;color:#6B7280;padding-bottom:4px;">Previous</td>
              <td style="font-size:14px;color:#6B7280;font-weight:600;text-align:right;padding-bottom:4px;text-decoration:line-through;">${p.oldCode}</td>
            </tr>
            <tr>
              <td style="font-size:12px;color:#6B7280;">New</td>
              <td style="font-size:14px;color:#008B8B;font-weight:700;text-align:right;">${p.newCode}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    <p style="font-size:13px;color:#6B7280;text-align:center;margin:0;">
      Please review your updated schedule in the app.
    </p>
    `,
  );
}
