import type { ComponentChildren } from 'preact';

function Svg({ size = 22, width = 2, children }: { size?: number; width?: number; children: ComponentChildren }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width={width}
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

type P = { size?: number };

export const IconChevronLeft = ({ size }: P) => <Svg size={size}><path d="M15 5l-7 7 7 7" /></Svg>;
export const IconChevronRight = ({ size }: P) => <Svg size={size}><path d="M9 5l7 7-7 7" /></Svg>;
export const IconPlus = ({ size = 18 }: P) => <Svg size={size} width={2.4}><path d="M12 5v14M5 12h14" /></Svg>;
export const IconMinus = ({ size = 18 }: P) => <Svg size={size} width={2.4}><path d="M5 12h14" /></Svg>;
export const IconCheck = ({ size = 14 }: P) => <Svg size={size} width={2.4}><path d="M5 12.5l4.5 4.5L19 7.5" /></Svg>;
export const IconClose = ({ size = 20 }: P) => <Svg size={size}><path d="M6 6l12 12M18 6L6 18" /></Svg>;
export const IconLock = ({ size = 14 }: P) => (
  <Svg size={size} width={2.2}>
    <rect x="5" y="10.5" width="14" height="10" rx="2.5" />
    <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
  </Svg>
);
export const IconAlert = ({ size = 14 }: P) => (
  <Svg size={size} width={2.2}>
    <path d="M12 4l9 16H3z" />
    <path d="M12 10v4M12 17v.01" />
  </Svg>
);
export const IconTrash = ({ size = 18 }: P) => (
  <Svg size={size} width={1.8}>
    <path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13" />
  </Svg>
);
export const IconToday = ({ size = 24 }: P) => (
  <Svg size={size} width={1.8}>
    <rect x="3.5" y="5" width="17" height="15" rx="3" />
    <path d="M3.5 10h17M8 3v4M16 3v4M9 15l2 2 4-4" />
  </Svg>
);
export const IconMonth = ({ size = 24 }: P) => <Svg size={size} width={1.8}><path d="M5 20v-8M12 20V5M19 20v-11" /></Svg>;
export const IconUser = ({ size = 24 }: P) => (
  <Svg size={size} width={1.8}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c1.5-3.5 4.5-5 8-5s6.5 1.5 8 5" />
  </Svg>
);
export const IconRules = ({ size = 24 }: P) => (
  <Svg size={size} width={1.8}>
    <rect x="5" y="3.5" width="14" height="17" rx="2.5" />
    <path d="M8.5 8.5h7M8.5 12h7M8.5 15.5h4" />
  </Svg>
);
export const IconShield = ({ size = 22 }: P) => (
  <Svg size={size} width={1.8}>
    <path d="M12 3l7.5 3v5.5c0 4.5-3.2 8-7.5 9.5-4.3-1.5-7.5-5-7.5-9.5V6z" />
    <path d="M8.5 12l2.5 2.5 4.5-4.5" />
  </Svg>
);
export const IconDumbbell = ({ size = 22 }: P) => <Svg size={size}><path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11" /></Svg>;
export const IconEye = ({ size = 16 }: P) => (
  <Svg size={size}>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
  </Svg>
);
export const IconSearch = ({ size = 18 }: P) => (
  <Svg size={size}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="M16 16l4.5 4.5" />
  </Svg>
);
