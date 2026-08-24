import { Link, useLocation } from 'react-router-dom';
import { useGenLayer } from '../hooks/useGenLayer';

function truncate(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export default function Navbar() {
  const { account, connect, connecting } = useGenLayer();
  const location = useLocation();

  const navLink = (to: string, label: string) => (
    <Link
      to={to}
      className={`text-sm transition-colors ${
        location.pathname === to ? 'text-ink font-medium' : 'text-file hover:text-ink'
      }`}
    >
      {label}
    </Link>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-file-line bg-paper/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2.5">
          <img src="/favicon.svg" alt="" width={28} height={28} />
          <span className="font-display font-semibold text-lg tracking-tight">DomainClaim</span>
        </Link>

        <div className="hidden md:flex items-center gap-7">
          {navLink('/', 'File')}
          {navLink('/challenge', 'Challenge')}
          {navLink('/docs', 'Docs')}
        </div>

        <button
          onClick={() => !account && connect()}
          className="rounded-sm border border-ink px-4 py-2 text-xs font-medium tracking-wide hover:bg-ink hover:text-paper transition-colors"
        >
          {connecting ? 'Connecting…' : account ? truncate(account) : 'Connect wallet'}
        </button>
      </nav>

      <div className="flex md:hidden items-center justify-center gap-6 border-t border-file-line py-2.5">
        {navLink('/', 'File')}
        {navLink('/challenge', 'Challenge')}
        {navLink('/docs', 'Docs')}
      </div>
    </header>
  );
}
