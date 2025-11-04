// Temporary shims for third-party UI libraries and local JS/JSX modules
// These are intentionally permissive 'any' shims to unblock type-checking while
// we decide whether to install the real packages or add proper types.

// Wildcard shortcuts (catch many @radix-ui packages at once)
declare module '@radix-ui/*';
declare module 'react-*';

declare module '@radix-ui/react-accordion';
declare module '@radix-ui/react-alert-dialog';
declare module '@radix-ui/react-aspect-ratio';
declare module '@radix-ui/react-avatar';
declare module '@radix-ui/react-checkbox';
declare module '@radix-ui/react-collapsible';
declare module '@radix-ui/react-context-menu';
declare module '@radix-ui/react-dialog';
declare module '@radix-ui/react-dropdown-menu';
declare module '@radix-ui/react-hover-card';
declare module '@radix-ui/react-menubar';
declare module '@radix-ui/react-navigation-menu';
declare module '@radix-ui/react-popover';
declare module '@radix-ui/react-progress';
declare module '@radix-ui/react-radio-group';
declare module '@radix-ui/react-scroll-area';
declare module '@radix-ui/react-separator';
declare module '@radix-ui/react-slider';
declare module '@radix-ui/react-switch';
declare module '@radix-ui/react-toggle-group';
declare module '@radix-ui/react-toggle';
declare module '@radix-ui/react-tooltip';

declare module 'react-day-picker';
declare module 'embla-carousel-react';
declare module 'recharts';
declare module 'cmdk';
declare module 'vaul';
declare module 'react-resizable-panels';
declare module 'input-otp';
declare module 'react-hook-form';
declare module 'next-themes';
declare module 'sonner';
declare module 'class-variance-authority';

// Local JS/JSX modules without types yet (alias-aware)
declare module '@/components/ImageUploader';
declare module '@/hooks/useScreenSize';
declare module '@/components/ScreenSizeRestriction';
declare module '@/components/OnboardingFlow';
declare module '@/lib/supabase';

// Generic extensions
declare module '*.jsx';
declare module '*.js';

export {};
