import * as React from 'react';

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener('change', onChange);
    // `window` does not exist during the server render, so the first real read
    // can only happen after mount. Until it does the hook reports false, which
    // IS a guess — the trade is a possible layout shift on first paint against
    // not being renderable on the server at all.
    // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return !!isMobile;
}
