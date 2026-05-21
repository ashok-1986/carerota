import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, ExternalLink, Shield } from 'lucide-react';

export default function DataPrivacyTab() {
  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Data Export</CardTitle>
          <CardDescription>Download your data for external analysis or compliance.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-md">
            <div>
              <div className="font-medium">Export all rota data (CSV)</div>
              <div className="text-sm text-slate-500">Includes all historic published rotas.</div>
            </div>
            <a href="/api/export/csv" target="_blank">
              <Button variant="outline" className="flex items-center gap-2">
                <Download className="h-4 w-4" /> Download
              </Button>
            </a>
          </div>
          <div className="flex items-center justify-between p-4 border rounded-md">
            <div>
              <div className="font-medium">Export audit log (CSV)</div>
              <div className="text-sm text-slate-500">Security and action trail for all managers.</div>
            </div>
            <a href="/api/export/audit-log" target="_blank">
              <Button variant="outline" className="flex items-center gap-2">
                <Download className="h-4 w-4" /> Download
              </Button>
            </a>
          </div>
          <div className="flex items-center justify-between p-4 border rounded-md">
            <div>
              <div className="font-medium">Export staff data</div>
              <div className="text-sm text-slate-500">Current staff directory and contract info.</div>
            </div>
            <a href="/api/staff/me/export" target="_blank">
              <Button variant="outline" className="flex items-center gap-2">
                <Download className="h-4 w-4" /> Download
              </Button>
            </a>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Retention</CardTitle>
          <CardDescription>Automatic data deletion policies.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div className="flex justify-between py-2 border-b">
              <span className="text-slate-600">Rota data</span>
              <span className="font-medium">12 months</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-slate-600">Audit logs</span>
              <span className="font-medium">3 years</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-600">Staff records</span>
              <span className="font-medium">12 months post-departure</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Manage your CareRota account and legal agreements.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
            <Shield className="h-4 w-4" />
            <a href="/privacy" target="_blank">View privacy policy</a>
          </div>
          <div className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
            <ExternalLink className="h-4 w-4" />
            <a href="#" target="_blank">Download Data Processing Agreement (DPA)</a>
          </div>
          <div className="pt-4 border-t">
            <a href="mailto:support@alchemetryx.com?subject=Account Deletion Request">
              <Button variant="destructive">
                Request account deletion
              </Button>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
