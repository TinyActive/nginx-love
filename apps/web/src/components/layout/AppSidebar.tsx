import { Link, useMatchRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'next-themes';
import {
  LayoutDashboard,
  Globe,
  Shield,
  Lock,
  FileText,
  Bell,
  UserCog,
  Activity,
  Database,
  Users,
  Server,
  Sun,
  Moon,
  Monitor,
  Languages,
  User,
  Settings,
  LogOut
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
  useSidebar
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/auth';
import { useRouter } from '@tanstack/react-router';

const menuGroups = [
  {
    title: 'Main',
    items: [
      { key: 'dashboard', icon: LayoutDashboard, path: '/dashboard' },
    ]
  },
  {
    title: 'Domain Management',
    items: [
      { key: 'domains', icon: Globe, path: '/domains' },
      { key: 'ssl', icon: Lock, path: '/ssl' },
    ]
  },
  {
    title: 'Security',
    items: [
      { key: 'modsecurity', icon: Shield, path: '/modsecurity' },
      { key: 'acl', icon: UserCog, path: '/acl' },
    ]
  },
  {
    title: 'Monitoring',
    items: [
      { key: 'logs', icon: FileText, path: '/logs' },
      { key: 'alerts', icon: Bell, path: '/alerts' },
      { key: 'performance', icon: Activity, path: '/performance' },
    ]
  },
  {
    title: 'System',
    items: [
      { key: 'backup', icon: Database, path: '/backup' },
      { key: 'users', icon: Users, path: '/users' },
      { key: 'nodes', icon: Server, path: '/nodes' },
    ]
  }
];

export function AppSidebar() {
  const { t, i18n } = useTranslation();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';
  const { theme, setTheme } = useTheme();
  const { user: currentUser, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    await router.invalidate();
    router.navigate({ to: '/login' });
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader>
        <SidebarGroup>
          <SidebarGroupLabel className="text-primary font-bold text-lg">
            {!isCollapsed && 'Nginx Admin'}
          </SidebarGroupLabel>
        </SidebarGroup>
      </SidebarHeader>
      
      <SidebarContent>
        {menuGroups.map((group, groupIndex) => (
          <SidebarGroup key={groupIndex}>
            <SidebarGroupLabel>
              {!isCollapsed && t(`nav.groups.${group.title.toLowerCase()}`, group.title)}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  // Use useMatchRoute to determine if the current route is active
                  const matchRoute = useMatchRoute();
                  const isActive = matchRoute({ to: item.path, fuzzy: true });
                  
                  return (
                    <SidebarMenuItem key={item.key}>
                      <SidebarMenuButton asChild>
                        <Link
                          to={item.path}
                          className={`hover:bg-accent ${isActive ? 'bg-primary/10 text-primary font-medium' : ''}`}
                        >
                          <item.icon className="h-4 w-4" />
                          {!isCollapsed && <span>{t(`nav.${item.key}`)}</span>}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton>
                  <Languages className="h-4 w-4" />
                  {!isCollapsed && <span>Language</span>}
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => changeLanguage('en')}>
                  English
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLanguage('vi')}>
                  Tiếng Việt
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
          
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton>
                  {theme === 'dark' ? (
                    <Moon className="h-4 w-4" />
                  ) : theme === 'light' ? (
                    <Sun className="h-4 w-4" />
                  ) : (
                    <Monitor className="h-4 w-4" />
                  )}
                  {!isCollapsed && <span>Theme</span>}
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme('light')}>
                  <Sun className="mr-2 h-4 w-4" />
                  Light
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('dark')}>
                  <Moon className="mr-2 h-4 w-4" />
                  Dark
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('system')}>
                  <Monitor className="mr-2 h-4 w-4" />
                  System
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
          
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton>
                  <Avatar className="h-6 w-6">
                    <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=admin" />
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  {!isCollapsed && <span>{currentUser?.username || 'User'}</span>}
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => router.navigate({ to: '/account' })}>
                  <Settings className="mr-2 h-4 w-4" />
                  Account Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
