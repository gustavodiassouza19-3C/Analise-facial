import * as React from 'react';
import { cn } from '../../lib/utils';

const TabsContext = React.createContext(null);

const Tabs = React.forwardRef(({ defaultValue, value, onValueChange, className, children, ...props }, ref) => {
  const [activeTab, setActiveTab] = React.useState(value || defaultValue);
  const controlled = value !== undefined;
  const current = controlled ? value : activeTab;

  const handleChange = React.useCallback(
    (v) => {
      if (!controlled) setActiveTab(v);
      onValueChange?.(v);
    },
    [controlled, onValueChange]
  );

  return (
    <TabsContext.Provider value={{ value: current, onChange: handleChange }}>
      <div ref={ref} className={cn('flex flex-col', className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
});
Tabs.displayName = 'Tabs';

const TabsList = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex flex-col gap-1 p-1',
      className
    )}
    {...props}
  />
));
TabsList.displayName = 'TabsList';

const TabsTrigger = React.forwardRef(({ value, className, children, ...props }, ref) => {
  const ctx = React.useContext(TabsContext);
  const isActive = ctx?.value === value;

  return (
    <button
      ref={ref}
      onClick={() => ctx?.onChange(value)}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
        isActive
          ? 'bg-brand-accent text-background shadow-[0_0_15px_rgba(211,171,57,0.25)]'
          : 'text-text-secondary hover:text-text-primary hover:bg-white/5',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
});
TabsTrigger.displayName = 'TabsTrigger';

const TabsContent = React.forwardRef(({ value, className, ...props }, ref) => {
  const ctx = React.useContext(TabsContext);
  if (ctx?.value !== value) return null;

  return (
    <div ref={ref} className={cn('flex-1', className)} {...props} />
  );
});
TabsContent.displayName = 'TabsContent';

export { Tabs, TabsList, TabsTrigger, TabsContent };
