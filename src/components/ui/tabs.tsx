'use client';

import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';

import { cn } from '@/lib/utils';

type TabsVariant = 'pill' | 'underline';

const TabsVariantContext = React.createContext<TabsVariant>('pill');

const Tabs = TabsPrimitive.Root;

function TabsList({
  className,
  variant = 'pill',
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> & { variant?: TabsVariant }) {
  return (
    <TabsVariantContext.Provider value={variant}>
      <TabsPrimitive.List
        data-slot="tabs-list"
        className={cn(
          'inline-flex items-center',
          variant === 'pill'
            ? 'h-9 gap-1 rounded-lg border border-border bg-muted/60 p-1'
            : 'h-auto w-full gap-5 overflow-x-auto border-b border-border p-0',
          className,
        )}
        {...props}
      />
    </TabsVariantContext.Provider>
  );
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  const variant = React.useContext(TabsVariantContext);

  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        'inline-flex items-center justify-center gap-1.5 whitespace-nowrap text-[13px] font-medium text-muted-foreground outline-none transition-all hover:text-foreground disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4',
        variant === 'pill'
          ? 'h-7 rounded-md px-3 data-[state=active]:bg-surface data-[state=active]:text-foreground data-[state=active]:shadow-xs'
          : '-mb-px shrink-0 border-b-2 border-transparent px-0.5 pb-2.5 pt-1 data-[state=active]:border-primary data-[state=active]:text-foreground',
        className,
      )}
      {...props}
    />
  );
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn('mt-5 outline-none', className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
