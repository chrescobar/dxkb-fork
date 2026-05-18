import { bacteriaTabs } from "../_data/tabs";

export function TabStrip() {
  return (
    <nav className="border-b bg-card border-[var(--border)]">
      <div className="mx-auto w-full px-12">
        <div className="bacteria-tab-strip">
          {bacteriaTabs.map((tab) => (
            <a key={tab.label} href={tab.href} className="bacteria-tab" data-active={tab.active ? "true" : "false"}>
              {tab.label}
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
}
