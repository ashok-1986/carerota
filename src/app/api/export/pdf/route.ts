import { NextRequest, NextResponse } from 'next/server';
import { getStaffByHome } from '@/db/queries/staff';
import { getRotaEntriesForPeriod } from '@/db/queries/rota';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { homeFloors } from '@/db/schema/floors';
import { eq } from 'drizzle-orm';
import { addMonths, subDays, parseISO, format } from 'date-fns';
import { insertAuditLog } from '@/db/queries/audit';
import { getClientIp } from '@/lib/client-ip';
import { getHomeById } from '@/db/queries/homes';
import { hasRole, PUBLISH_ROLES } from '@/lib/authz';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || !session.user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const homeId = session.user.homeId;
  const role = session.user.role;
  const userId = session.user.id;

  if (!homeId) {
    return new NextResponse('Forbidden: Home association missing', { status: 403 });
  }

  if (!hasRole(role, PUBLISH_ROLES)) {
    return new NextResponse('Forbidden: Only managers can export pdf noticeboards', { status: 403 });
  }

  try {
    const { payPeriodStart, floorIds } = await req.json();
    if (!payPeriodStart || !Array.isArray(floorIds)) {
      return new NextResponse('Invalid request body', { status: 400 });
    }

    const startDate = payPeriodStart;
    const start = parseISO(startDate);
    const end = subDays(addMonths(start, 1), 1);
    const endDateStr = format(end, 'yyyy-MM-dd');

    const [home, staffList, entries, floors] = await Promise.all([
      getHomeById(homeId),
      getStaffByHome(homeId),
      getRotaEntriesForPeriod(homeId, startDate, endDateStr),
      db.select().from(homeFloors).where(eq(homeFloors.homeId, homeId)),
    ]);

    const homeName = home?.name || 'Marlborough Court Care Home';

    // Filter floors based on selection
    const selectedFloors = floors.filter(f => floorIds.includes(f.id));

    // Audit log the export
    await insertAuditLog({
      homeId,
      userId,
      action: 'PDF_EXPORTED',
      entityType: 'home',
      entityId: homeId,
      afterValue: { payPeriodStart, floorIds },
      ipAddress: getClientIp(req),
    });

    // Generate a simple, valid text-based PDF containing noticeboard schedule
    // A standard Helvetica PDF structure
    let pdfText = `BT\n/F1 14 Tf\n50 750 Td\n(${homeName.toUpperCase()} ROTA NOTICEBOARD) Tj\n`;
    pdfText += `0 -25 Td\n(PERIOD: ${format(start, 'dd MMM yyyy')} - ${format(end, 'dd MMM yyyy')}) Tj\n`;
    pdfText += `0 -35 Td\n(Generated: ${format(new Date(), 'dd MMM yyyy HH:mm')}) Tj\n`;
    pdfText += `0 -25 Td\n(--------------------------------------------------------) Tj\n`;

    let yPosition = 665;

    for (const floor of selectedFloors) {
      if (yPosition < 100) {
        // Simple page break emulation in stream text
        pdfText += `ET\nshowpage\nBT\n/F1 14 Tf\n50 750 Td\n(${floor.name.toUpperCase()} ROTA - CONTINUED) Tj\n0 -25 Td\n`;
        yPosition = 725;
      }

      pdfText += `0 -30 Td\n(FLOOR: ${floor.name.toUpperCase()}) Tj\n`;
      yPosition -= 30;

      const floorStaff = staffList.filter(s => s.homeFloorId === floor.id && s.isActive);

      if (floorStaff.length === 0) {
        pdfText += `0 -15 Td\n(  No active staff assigned to this floor.) Tj\n`;
        yPosition -= 15;
      } else {
        for (const staffMember of floorStaff) {
          if (yPosition < 80) {
            pdfText += `ET\nshowpage\nBT\n/F1 14 Tf\n50 750 Td\n(${floor.name.toUpperCase()} ROTA - CONTINUED) Tj\n0 -25 Td\n`;
            yPosition = 725;
          }

          const staffEntries = entries.filter(e => e.staffId === staffMember.id && e.homeFloorId === floor.id && e.category === 'work');
          const shiftsCount = staffEntries.length;

          pdfText += `0 -18 Td\n(  * ${staffMember.name} (${staffMember.role}) - ${shiftsCount} shifts scheduled) Tj\n`;
          yPosition -= 18;
        }
      }

      pdfText += `0 -15 Td\n( ) Tj\n`;
      yPosition -= 15;
    }

    pdfText += `ET`;

    // Basic PDF 1.4 wrapper
    const stream = Buffer.from(pdfText, 'utf-8');
    const streamLength = stream.length;

    const pdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length ${streamLength} >>
stream
${pdfText}
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000056 00000 n 
0000000111 00000 n 
0000000244 00000 n 
0000000350 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
441
%%EOF`;

    const filename = `noticeboard-rota-${payPeriodStart}.pdf`;

    return new Response(pdfContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('Error generating noticeboard PDF export:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
