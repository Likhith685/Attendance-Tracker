/** Small inline icons shared by forms. Decorative, so hidden from assistive technology. */

const iconProps = (size) => ({ width: size, height: size, 'aria-hidden': true, focusable: false });

export function UserIcon({ size = 16, style }) {
  return (
    <svg {...iconProps(size)} viewBox="0 0 16 16" style={style}>
      <path
        fill="currentColor"
        d="M8 0a4 4 0 100 8 4 4 0 000-8zM2 14c0-3.31 2.69-6 6-6s6 2.69 6 6H2z"
      />
    </svg>
  );
}

export function RoleIcon({ size = 16, style }) {
  return (
    <svg {...iconProps(size)} viewBox="0 0 16 16" style={style}>
      <path
        fill="currentColor"
        d="M8 8a3 3 0 100-6 3 3 0 000 6zm2-3a2 2 0 11-4 0 2 2 0 014 0zm4 8c0-1.66-3.58-3-8-3s-8 1.34-8 3v1h16v-1z"
      />
    </svg>
  );
}

export function IdCardIcon({ size = 16, style }) {
  return (
    <svg {...iconProps(size)} viewBox="0 0 16 16" style={style}>
      <path
        fill="currentColor"
        d="M2 2a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V2zm3 1a1 1 0 011-1h4a1 1 0 110 2H6a1 1 0 01-1-1zm0 3a1 1 0 011-1h4a1 1 0 110 2H6a1 1 0 01-1-1zm0 3a1 1 0 011-1h4a1 1 0 110 2H6a1 1 0 01-1-1z"
      />
    </svg>
  );
}

export function MailIcon({ size = 16, style }) {
  return (
    <svg {...iconProps(size)} viewBox="0 0 16 16" style={style}>
      <path
        fill="currentColor"
        d="M0 3a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H2a2 2 0 01-2-2V3zm2 0v.5l6 3.5 6-3.5V3H2zm12 2.5l-6 3.5-6-3.5V13h12V5.5z"
      />
    </svg>
  );
}

export function LockIcon({ size = 16, style }) {
  return (
    <svg {...iconProps(size)} viewBox="0 0 16 16" style={style}>
      <path
        fill="currentColor"
        d="M13 7h-1V5a4 4 0 00-8 0v2H3a1 1 0 00-1 1v6a1 1 0 001 1h10a1 1 0 001-1V8a1 1 0 00-1-1zM6 5a2 2 0 114 0v2H6V5z"
      />
    </svg>
  );
}

export function BookIcon({ size = 16, style }) {
  return (
    <svg {...iconProps(size)} viewBox="0 0 16 16" style={style}>
      <path
        fill="currentColor"
        d="M2 2a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V2zm2 0v12h8V2H4z"
      />
    </svg>
  );
}

export function TagIcon({ size = 16, style }) {
  return (
    <svg {...iconProps(size)} viewBox="0 0 16 16" style={style}>
      <path
        fill="currentColor"
        d="M8 0a3 3 0 00-3 3v1H3a1 1 0 00-1 1v10a1 1 0 001 1h10a1 1 0 001-1V5a1 1 0 00-1-1h-2V3a3 3 0 00-3-3zM7 3a1 1 0 112 0v1H7V3zm3 5a1 1 0 11-2 0 1 1 0 012 0z"
      />
    </svg>
  );
}

export function PlusIcon({ size = 18, style }) {
  return (
    <svg {...iconProps(size)} viewBox="0 0 18 18" style={style}>
      <path
        fill="currentColor"
        d="M9 0a1 1 0 011 1v7h7a1 1 0 110 2h-7v7a1 1 0 11-2 0v-7H1a1 1 0 110-2h7V1a1 1 0 011-1z"
      />
    </svg>
  );
}

export function CheckIcon({ size = 18, style }) {
  return (
    <svg {...iconProps(size)} viewBox="0 0 16 16" style={style}>
      <path
        fill="currentColor"
        d="M13.854 3.646a.5.5 0 010 .708l-7 7a.5.5 0 01-.708 0l-3.5-3.5a.5.5 0 11.708-.708L6.5 10.293l6.646-6.647a.5.5 0 01.708 0z"
      />
    </svg>
  );
}

export function ArrowRightIcon({ size = 16, style }) {
  return (
    <svg {...iconProps(size)} viewBox="0 0 16 16" style={style}>
      <path fill="currentColor" d="M8 0L6.59 1.41 12.17 7H0v2h12.17l-5.58 5.59L8 16l8-8z" />
    </svg>
  );
}

export function EyeIcon({ size = 20, crossed = false }) {
  return (
    <svg {...iconProps(size)} viewBox="0 0 20 20" fill="none">
      <path
        fill="currentColor"
        d="M10 6C6.793 6 3.942 8.327 3.26 11.602a.5.5 0 01-.98-.204C3.057 7.673 6.289 5 10 5c3.711 0 6.943 2.673 7.72 6.398a.5.5 0 01-.98.204C16.057 8.327 13.206 6 10 6z"
      />
      <path fill="currentColor" d="M10 9a2 2 0 100 4 2 2 0 000-4z" />
      {crossed && (
        <path d="M2 2l16 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      )}
    </svg>
  );
}

/** Animated "..." used in modal titles while a request is running. */
export function LoadingDots({ children }) {
  const dot = { display: 'inline-block', animation: 'loadingDots 1.4s infinite' };
  return (
    <>
      <span style={dot}>.</span>
      <span style={dot}>.</span>
      <span style={dot}>.</span> {children} <span style={dot}>.</span>
      <span style={dot}>.</span>
      <span style={dot}>.</span>
    </>
  );
}

export function Spinner({ size = 16 }) {
  return (
    <span
      aria-hidden="true"
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        border: '2px solid rgba(255, 255, 255, 0.3)',
        borderTop: '2px solid #fff',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }}
    />
  );
}
