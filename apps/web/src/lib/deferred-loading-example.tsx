import React, { Suspense } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useSuspenseQuery, useQueryClient } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
  joinedAt: string;
}

interface UserActivity {
  id: string;
  userId: string;
  action: string;
  timestamp: string;
  metadata: Record<string, any>;
}

interface UserAnalytics {
  userId: string;
  totalActions: number;
  actionsByType: Record<string, number>;
  activityByHour: Array<{ hour: number; count: number }>;
  topActions: Array<{ action: string; count: number }>;
}

// ============================================================================
// MOCK SERVICES (In a real app, these would make API calls)
// ============================================================================

const userService = {
  // Fast API call - returns basic user profile
  getUserProfile: async (userId: string): Promise<UserProfile> => {
    // Simulate a fast API call (500ms)
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      id: userId,
      name: 'John Doe',
      email: 'john.doe@example.com',
      avatar: 'https://picsum.photos/seed/user123/200/200.jpg',
      role: 'Administrator',
      joinedAt: '2023-01-15T10:30:00Z',
    };
  },
  
  // Slow API call - returns detailed user activity
  getUserActivity: async (userId: string, limit = 50): Promise<UserActivity[]> => {
    // Simulate a slow API call (2000ms)
    await new Promise(resolve => setTimeout(resolve, 2000));
    const actions = ['login', 'view_page', 'edit_content', 'delete_item', 'create_item'];
    return Array.from({ length: limit }, (_, i) => ({
      id: `activity-${i}`,
      userId,
      action: actions[i % 5] as string,
      timestamp: new Date(Date.now() - i * 3600000).toISOString(),
      metadata: { page: `/page-${i % 10}`, ip: '192.168.1.1' },
    }));
  },
  
  // Very slow API call - returns analytics data
  getUserAnalytics: async (userId: string): Promise<UserAnalytics> => {
    // Simulate a very slow API call (3000ms)
    await new Promise(resolve => setTimeout(resolve, 3000));
    return {
      userId,
      totalActions: 150,
      actionsByType: {
        login: 30,
        view_page: 60,
        edit_content: 25,
        delete_item: 15,
        create_item: 20,
      },
      activityByHour: Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        count: Math.floor(Math.random() * 20),
      })),
      topActions: [
        { action: 'view_page', count: 60 },
        { action: 'login', count: 30 },
        { action: 'edit_content', count: 25 },
      ],
    };
  },
};

// ============================================================================
// QUERY OPTIONS
// ============================================================================

// Define query keys
const userQueryKeys = {
  profile: (userId: string) => ['user', 'profile', userId],
  activity: (userId: string, limit?: number) => ['user', 'activity', userId, limit],
  analytics: (userId: string) => ['user', 'analytics', userId],
};

// Query options for different data types
export const userQueryOptions = {
  // Fast data - user profile
  profile: (userId: string) => ({
    queryKey: userQueryKeys.profile(userId),
    queryFn: () => userService.getUserProfile(userId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  }),
  
  // Slow data - user activity
  activity: (userId: string, limit = 50) => ({
    queryKey: userQueryKeys.activity(userId, limit),
    queryFn: () => userService.getUserActivity(userId, limit),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  }),
  
  // Very slow data - user analytics
  analytics: (userId: string) => ({
    queryKey: userQueryKeys.analytics(userId),
    queryFn: () => userService.getUserAnalytics(userId),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  }),
};

// ============================================================================
// HOOKS
// ============================================================================

// Regular hooks for non-deferred loading
export const useUserProfile = (userId: string) => {
  return useQuery(userQueryOptions.profile(userId));
};

export const useUserActivity = (userId: string, limit = 50) => {
  return useQuery(userQueryOptions.activity(userId, limit));
};

export const useUserAnalytics = (userId: string) => {
  return useQuery(userQueryOptions.analytics(userId));
};

// Suspense hooks for deferred loading pattern
export const useSuspenseUserProfile = (userId: string) => {
  return useSuspenseQuery(userQueryOptions.profile(userId));
};

export const useSuspenseUserActivity = (userId: string, limit = 50) => {
  return useSuspenseQuery(userQueryOptions.activity(userId, limit));
};

export const useSuspenseUserAnalytics = (userId: string) => {
  return useSuspenseQuery(userQueryOptions.analytics(userId));
};

// ============================================================================
// COMPONENTS
// ============================================================================

// Loading components
const ProfileSkeleton = () => (
  <Card>
    <CardHeader>
      <div className="flex items-center space-x-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <div className="space-y-2">
        <Skeleton className="h-4 w-[150px]" />
        <Skeleton className="h-4 w-[100px]" />
      </div>
    </CardContent>
  </Card>
);

const ActivitySkeleton = () => (
  <Card>
    <CardHeader>
      <Skeleton className="h-6 w-[150px]" />
    </CardHeader>
    <CardContent>
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-[200px]" />
            <Skeleton className="h-4 w-[100px]" />
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

const AnalyticsSkeleton = () => (
  <Card>
    <CardHeader>
      <Skeleton className="h-6 w-[150px]" />
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        <Skeleton className="h-4 w-[100px]" />
        <Skeleton className="h-32 w-full" />
      </div>
    </CardContent>
  </Card>
);

// Data components
const UserProfileCard = ({ userId }: { userId: string }) => {
  const { data: profile } = useSuspenseUserProfile(userId);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>User Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-4">
          <img
            src={profile.avatar}
            alt={profile.name}
            className="h-12 w-12 rounded-full"
          />
          <div>
            <h3 className="text-lg font-medium">{profile.name}</h3>
            <p className="text-sm text-gray-500">{profile.email}</p>
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <div className="flex items-center space-x-2">
            <Badge variant="secondary">{profile.role}</Badge>
            <span className="text-sm text-gray-500">
              Joined: {new Date(profile.joinedAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const UserActivityCard = ({ userId }: { userId: string }) => {
  const { data: activities } = useSuspenseUserActivity(userId, 20);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {activities.slice(0, 10).map((activity) => (
            <div key={activity.id} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                <span className="text-sm">{activity.action}</span>
              </div>
              <span className="text-xs text-gray-500">
                {new Date(activity.timestamp).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const UserAnalyticsCard = ({ userId }: { userId: string }) => {
  const { data: analytics } = useSuspenseUserAnalytics(userId);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>User Analytics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium">Total Actions: {analytics.totalActions}</h4>
          </div>
          
          <div>
            <h4 className="text-sm font-medium mb-2">Actions by Type</h4>
            <div className="space-y-1">
              {Object.entries(analytics.actionsByType).map(([action, count]) => (
                <div key={action} className="flex justify-between text-sm">
                  <span>{action}</span>
                  <span>{count}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium mb-2">Top Actions</h4>
            <div className="space-y-1">
              {analytics.topActions.map(({ action, count }) => (
                <div key={action} className="flex justify-between text-sm">
                  <span>{action}</span>
                  <span>{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// ============================================================================
// MAIN COMPONENT WITH DEFERRED LOADING PATTERN
// ============================================================================

const DeferredLoadingExample = ({ userId }: { userId: string }) => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Deferred Loading Example</h1>
        <p className="text-gray-500">
          This example demonstrates the deferred data loading pattern with TanStack Query.
        </p>
      </div>
      
      {/* Immediate loading - critical data */}
      <Suspense fallback={<ProfileSkeleton />}>
        <UserProfileCard userId={userId} />
      </Suspense>
      
      {/* Deferred loading - less critical data */}
      <Suspense fallback={<ActivitySkeleton />}>
        <UserActivityCard userId={userId} />
      </Suspense>
      
      {/* Deferred loading - analytics data (least critical) */}
      <Suspense fallback={<AnalyticsSkeleton />}>
        <UserAnalyticsCard userId={userId} />
      </Suspense>
      
      <Alert>
        <AlertDescription>
          <strong>Notice:</strong> The profile loads immediately, while activity and analytics data
          load progressively. Check the network tab to see the timing differences.
        </AlertDescription>
      </Alert>
    </div>
  );
};

// ============================================================================
// ROUTE DEFINITION WITH LOADER
// ============================================================================

// Example route definition with deferred loading pattern
// To use this pattern in your routes, create a route file like this:
/*
import { createFileRoute } from '@tanstack/react-router';
import { DeferredLoadingExample } from '@/lib/deferred-loading-example';

export const Route = createFileRoute('/_auth/user/$userId')({
  component: () => <DeferredLoadingExample userId="user123" />,
  
  // Route loader for critical data only
  loader: async ({ context, params }) => {
    const { queryClient } = context;
    const userId = params.userId;
    
    // CRITICAL: Load the user profile immediately and wait for it
    // This ensures the most important data is available before rendering
    await queryClient.ensureQueryData(userQueryOptions.profile(userId));
    
    // DEFERRED: Prefetch activity data but don't wait for it
    // This will start loading in the background but won't block rendering
    queryClient.prefetchQuery(userQueryOptions.activity(userId, 20));
    
    // DEFERRED: Prefetch analytics data but don't wait for it
    // This is the least critical data, so we just prefetch it
    queryClient.prefetchQuery(userQueryOptions.analytics(userId));
    
    return { userId };
  },
});
*/

// ============================================================================
// COMPARISON WITH TRADITIONAL APPROACH
// ============================================================================

/**
 * TRADITIONAL APPROACH (Blocking):
 * 
 * ```tsx
 * export const Route = createFileRoute('/user/$userId')({
 *   component: UserComponent,
 *   loader: async ({ context, params }) => {
 *     const { queryClient } = context;
 *     const userId = params.userId;
 *     
 *     // Wait for ALL data before rendering
 *     return Promise.all([
 *       queryClient.ensureQueryData(userQueryOptions.profile(userId)),
 *       queryClient.ensureQueryData(userQueryOptions.activity(userId)),
 *       queryClient.ensureQueryData(userQueryOptions.analytics(userId)),
 *     ]);
 *   },
 * });
 * 
 * const UserComponent = () => {
 *   // All data is already loaded, no Suspense needed
 *   const profile = useUserProfile(userId);
 *   const activity = useUserActivity(userId);
 *   const analytics = useUserAnalytics(userId);
 *   
 *   return (
 *     <div>
 *       <ProfileCard profile={profile.data} />
 *       <ActivityCard activities={activity.data} />
 *       <AnalyticsCard analytics={analytics.data} />
 *     </div>
 *   );
 * };
 * ```
 * 
 * Pros:
 * - Simple to understand
 * - All data available at once
 * 
 * Cons:
 * - Slower initial page load (waits for slowest request)
 * - Poor user experience for slow connections
 * - No progressive loading
 * 
 * ============================================================================
 * 
 * DEFERRED LOADING APPROACH (Non-blocking):
 * 
 * ```tsx
 * export const Route = createFileRoute('/user/$userId')({
 *   component: UserComponent,
 *   loader: async ({ context, params }) => {
 *     const { queryClient } = context;
 *     const userId = params.userId;
 *     
 *     // Only load critical data
 *     await queryClient.ensureQueryData(userQueryOptions.profile(userId));
 *     
 *     // Prefetch non-critical data in background
 *     queryClient.prefetchQuery(userQueryOptions.activity(userId));
 *     queryClient.prefetchQuery(userQueryOptions.analytics(userId));
 *     
 *     return { userId };
 *   },
 * });
 * 
 * const UserComponent = () => {
 *   return (
 *     <div>
 *       <Suspense fallback={<ProfileSkeleton />}>
 *         <ProfileCard userId={userId} />
 *       </Suspense>
 *       
 *       <Suspense fallback={<ActivitySkeleton />}>
 *         <ActivityCard userId={userId} />
 *       </Suspense>
 *       
 *       <Suspense fallback={<AnalyticsSkeleton />}>
 *         <AnalyticsCard userId={userId} />
 *       </Suspense>
 *     </div>
 *   );
 * };
 * ```
 * 
 * Pros:
 * - Faster initial page load
 * - Progressive loading of content
 * - Better user experience
 * - More resilient to network issues
 * 
 * Cons:
 * - More complex implementation
 * - Requires Suspense boundaries
 * - Content may appear incrementally
 * 
 * ============================================================================
 * 
 * WHEN TO USE PREFETCHQUERY VS ENSUREQUERYDATA:
 * 
 * 1. use `ensureQueryData` for:
 *    - Critical data that must be available before rendering
 *    - Data needed for SEO or initial page view
 *    - Small, fast-loading data
 *    - Data that other components depend on
 * 
 * 2. use `prefetchQuery` for:
 *    - Non-critical data that can load in background
 *    - Large datasets or slow API calls
 *    - Data that appears "below the fold"
 *    - Optional or secondary content
 * 
 * ============================================================================
 * 
 * BEST PRACTICES:
 * 
 * 1. Identify critical vs non-critical data:
 *    - Critical: User info, essential page content
 *    - Non-critical: Analytics, recommendations, secondary content
 * 
 * 2. Use appropriate loading states:
 *    - Skeletons for content that's about to appear
 *    - Spinners for indeterminate loading time
 *    - Placeholders for completely optional content
 * 
 * 3. Set appropriate staleTime and gcTime:
 *    - Shorter staleTime for frequently changing data
 *    - Longer gcTime for data that's expensive to fetch
 * 
 * 4. Consider network conditions:
 *    - On slow connections, prioritize critical data
 *    - Use React Query's network-aware features
 * 
 * 5. Test with different network speeds:
 *    - Verify the progressive loading experience
 *    - Ensure content appears in a logical order
 * 
 * 6. Handle errors gracefully:
 *    - Show appropriate error states for each section
 *    - Provide retry mechanisms where appropriate
 */

export default DeferredLoadingExample;