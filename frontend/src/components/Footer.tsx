import { EXPLORER_ADDRESS_URL, STUDIONET_CONTRACT_ADDRESS } from '../config/chains';

export default function Footer() {
  return (
    <footer className="border-t border-file-line bg-paper-dim">
      <div className="mx-auto max-w-6xl px-6 py-10 grid gap-8 md:grid-cols-3 text-sm">
        <div>
          <p className="font-display font-semibold text-ink mb-2">DomainClaim</p>
          <p className="text-file leading-relaxed">
            Domain-control attestation, judged against RDAP alone — never a
            screenshot, never a submitted URL.
          </p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wide text-file mb-2">Contract</p>
          <a
            href={EXPLORER_ADDRESS_URL(STUDIONET_CONTRACT_ADDRESS)}
            target="_blank"
            rel="noreferrer"
            className="font-mono text-xs text-ink-soft break-all underline decoration-file-line hover:text-registry"
          >
            {STUDIONET_CONTRACT_ADDRESS}
          </a>
          <p className="text-file mt-1">StudioNet</p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wide text-file mb-2">Built on</p>
          <a
            href="https://genlayer.com"
            target="_blank"
            rel="noreferrer"
            className="text-ink-soft underline decoration-file-line hover:text-registry"
          >
            GenLayer
          </a>
        </div>
      </div>
    </footer>
  );
}
