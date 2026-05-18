import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface Breadcrumb {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: Breadcrumb[];
  action?: React.ReactNode;
}

export function PageHeader({ title, description, breadcrumbs, action }: PageHeaderProps) {
  return (
    <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center space-x-1 text-sm text-slate mb-2">
            {breadcrumbs.map((crumb, i) => (
              <div key={i} className="flex items-center">
                {crumb.href ? (
                  <Link href={crumb.href} className="hover:text-midnight transition-colors">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-midnight font-medium">{crumb.label}</span>
                )}
                {i < breadcrumbs.length - 1 && (
                  <ChevronRight className="w-4 h-4 mx-1 text-slate/50" />
                )}
              </div>
            ))}
          </nav>
        )}
        <h1 className="text-3xl font-display font-bold text-midnight">{title}</h1>
        {description && (
          <p className="text-slate mt-1">{description}</p>
        )}
      </div>
      
      {action && (
        <div className="flex-shrink-0">
          {action}
        </div>
      )}
    </div>
  );
}
