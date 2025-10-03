import { Skeleton } from "./skeleton";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarGroup, SidebarGroupContent, SidebarGroupLabel } from "./sidebar";

interface SkeletonSidebarProps {
  className?: string;
  collapsed?: boolean;
}

export function SkeletonSidebar({ className, collapsed = false }: SkeletonSidebarProps) {
  return (
    <Sidebar variant="inset" collapsible="icon" className={className}>
      <SidebarHeader>
        <SidebarGroup>
          <SidebarGroupLabel className="text-primary font-bold text-lg">
            {!collapsed && <Skeleton className="h-6 w-24" />}
          </SidebarGroupLabel>
        </SidebarGroup>
      </SidebarHeader>
      
      <SidebarContent>
        {Array.from({ length: 5 }).map((_, groupIndex) => (
          <SidebarGroup key={groupIndex}>
            <SidebarGroupLabel>
              {!collapsed && <Skeleton className="h-4 w-20" />}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {Array.from({ length: Math.floor(Math.random() * 3) + 1 }).map((_, itemIndex) => (
                  <SidebarMenuItem key={itemIndex}>
                    <SidebarMenuButton>
                      <Skeleton className="h-4 w-4" />
                      {!collapsed && <Skeleton className="h-4 w-16 ml-2" />}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      
      <SidebarFooter>
        <SidebarMenu>
          {Array.from({ length: 3 }).map((_, i) => (
            <SidebarMenuItem key={i}>
              <SidebarMenuButton>
                <Skeleton className="h-4 w-4" />
                {!collapsed && <Skeleton className="h-4 w-16 ml-2" />}
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}