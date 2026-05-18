import { baseLayout } from './base';

type ShiftRow = {
  date: string;
  time: string;
  code: string | null;
  floor: string;
};

type Props = {
  staffName: string;
  shifts: ShiftRow[];
};

export function rotaPublishedHtml(p: Props): string {
  const rows = p.shifts
    .map(
      (s) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #F3F2ED;font-size:13px;color:#1A2642;">${s.date}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #F3F2ED;font-size:13px;color:#1A2642;">${s.time}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #F3F2ED;font-size:13px;color:#1A2642;">${s.code || '-'}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #F3F2ED;font-size:13px;color:#1A2642;">${s.floor}</td>
    </tr>`,
    )
    .join('');

  return baseLayout(
    'Rota Published',
    `
    <div style="text-align:center;margin-bottom:24px;">
      <div style="display:inline-block;width:48px;height:48px;border-radius:50%;background-color:#D4AF37;color:#1A2642;font-size:24px;line-height:48px;font-weight:700;">&#9992;</div>
    </div>
    <h1 style="font-size:18px;font-weight:700;color:#1A2642;margin:0 0 8px 0;text-align:center;">Your Rota is Ready</h1>
    <p style="font-size:14px;color:#6B7280;margin:0 0 24px 0;text-align:center;">
      Hi <strong style="color:#1A2642;">${p.staffName}</strong>, your shifts for the upcoming period have been published.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <thead>
        <tr>
          <th style="padding:8px 12px;background-color:#1A2642;color:#ffffff;font-size:12px;font-weight:600;text-align:left;border-radius:8px 0 0 0;">Date</th>
          <th style="padding:8px 12px;background-color:#1A2642;color:#ffffff;font-size:12px;font-weight:600;text-align:left;">Time</th>
          <th style="padding:8px 12px;background-color:#1A2642;color:#ffffff;font-size:12px;font-weight:600;text-align:left;">Code</th>
          <th style="padding:8px 12px;background-color:#1A2642;color:#ffffff;font-size:12px;font-weight:600;text-align:left;border-radius:0 8px 0 0;">Floor</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
    <p style="font-size:13px;color:#6B7280;text-align:center;margin:0;">
      Please check your schedule and speak with your manager if you have any questions.
    </p>
    `,
  );
}
