import { BookOpen } from "lucide-react";
import { pubmedItems } from "../_data/sidebars";

export function RecentPubmed() {
  return (
    <div className="bacteria-card p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[16px] font-semibold flex items-center gap-2">
          <BookOpen className="size-4" style={{ color: "var(--primary)" }} />
          Recent PubMed
        </h2>
      </div>
      <ul>
        {pubmedItems.map((item) => (
          <li key={item.title + item.date} className="bacteria-pub-item">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="bacteria-badge text-[10px]">{item.journal}</span>
              <span className="font-mono text-[10.5px] text-muted-foreground">{item.date}</span>
            </div>
            <p className="bacteria-pub-title text-[13.5px]">
              <a href="#">
                {item.title}
                {item.titleEm ? <em>{item.titleEm}</em> : null}
                {item.titleEmAfter}
              </a>
            </p>
            <p className="text-[11.5px] mt-1 text-muted-foreground">{item.authors}</p>
          </li>
        ))}
      </ul>
      <a href="#" className="mt-3 inline-block text-[13px] font-medium" style={{ color: "var(--primary)" }}>
        Show more →
      </a>
    </div>
  );
}
