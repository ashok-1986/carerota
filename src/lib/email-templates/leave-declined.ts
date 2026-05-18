import { baseLayout } from './base';

type Props = {
  staffName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  managerNotes?: string | null;
};

export function leaveDeclinedHtml(p: Props): string {
  return baseLayout(
    'Leave Declined',
    `
    <div style="text-align:center;margin-bottom:24px;">
      <div style="display:inline-block;width:48px;height:48px;border-radius:50%;background-color:#6B7280;color:#ffffff;font-size:24px;line-height:48px;font-weight:700;">&#10007;</div>
    </div>
    <h1 style="font-size:18px;font-weight:700;color:#1A2642;margin:0 0 8px 0;text-align:center;">Leave Declined</h1>
    <p style="font-size:14px;color:#6B7280;margin:0 0 24px 0;text-align:center;">
      Your <strong style="color:#1A2642;">${p.leaveType}</strong> leave request for <strong style="color:#1A2642;">${p.startDate}</strong> to <strong style="color:#1A2642;">${p.endDate}</strong> has been declined.
    </p>
    ${p.managerNotes ? `
    <div style="padding:12px 16px;background-color:#F8F6F0;border-radius:8px;margin-bottom:24px;">
      <p style="font-size:12px;color:#6B7280;margin:0 0 4px 0;">Manager's note:</p>
      <p style="font-size:14px;color:#1A2642;margin:0;">${p.managerNotes}</p>
    </div>` : ''}
    <p style="font-size:13px;color:#6B7280;text-align:center;margin:0;">
      Please speak with your manager if you would like to discuss this further.
    </p>
    `,
  );
}
