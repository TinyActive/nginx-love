import { useTranslation } from 'react-i18next';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useLocation } from '@tanstack/react-router';
import { Link } from '@tanstack/react-router';

interface DashboardHeaderProps {
  title?: string;
  breadcrumbs?: Array<{
    label: string;
    href?: string;
  }>;
}

export function DashboardHeader({ title, breadcrumbs }: DashboardHeaderProps) {
  const { t } = useTranslation();
  const location = useLocation();

  // Generate breadcrumbs based on current path if not provided
  const generateBreadcrumbs = () => {
    if (breadcrumbs) return breadcrumbs;
    
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const builtBreadcrumbs: Array<{ label: string; href?: string }> = [];
    
    // Add path segments
    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === pathSegments.length - 1;
      
      builtBreadcrumbs.push({
        label: t(`nav.${segment}`, segment.charAt(0).toUpperCase() + segment.slice(1)),
        href: isLast ? undefined : currentPath
      });
    });
    
    return builtBreadcrumbs;
  };

  const generatedBreadcrumbs = generateBreadcrumbs();
  const pageTitle = title || generatedBreadcrumbs[generatedBreadcrumbs.length - 1]?.label || 'Dashboard';

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        
        <Breadcrumb>
          <BreadcrumbList>
            {generatedBreadcrumbs.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <BreadcrumbItem>
                  {item.href ? (
                    <Link to={item.href}>
                      <BreadcrumbLink className="text-muted-foreground hover:text-foreground">
                        {item.label}
                      </BreadcrumbLink>
                    </Link>
                  ) : (
                    <BreadcrumbPage className="text-base font-medium">
                      {item.label}
                    </BreadcrumbPage>
                  )}
                </BreadcrumbItem>
                {index < generatedBreadcrumbs.length - 1 && (
                  <BreadcrumbSeparator className="text-muted-foreground" />
                )}
              </div>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </header>
  );
}