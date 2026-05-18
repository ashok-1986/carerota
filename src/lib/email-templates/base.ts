export function baseLayout(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Urbanist:wght@400;600;700&display=swap" rel="stylesheet" />
</head>
<body style="margin:0;padding:0;background-color:#F8F6F0;font-family:'Urbanist',-apple-system,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F8F6F0;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;">
          <tr>
            <td style="padding:0 0 24px 0;text-align:center;">
              <span style="font-size:22px;font-weight:700;color:#1A2642;letter-spacing:-0.5px;">
                Gold Care <span style="color:#D4AF37;">Rota</span>
              </span>
            </td>
          </tr>
          <tr>
            <td style="background-color:#ffffff;border-radius:12px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
              ${body}
            </td>
          </tr>
          <tr>
            <td style="padding:24px 0 0 0;text-align:center;font-size:12px;color:#6B7280;">
              <p style="margin:0 0 4px 0;">Gold Care Home Rota Management</p>
              <p style="margin:0;">This is an automated notification — please do not reply directly.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
