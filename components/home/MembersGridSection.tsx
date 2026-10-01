import { PortfolioScrollGrid, type PortfolioScrollGridImage } from "@/components/ui/portfolio-scroll-grid";

/** Portrait photos (Unsplash, free licence), cropped to the grid's box ratio. */
const unsplash = (id: string) => `https://images.unsplash.com/${id}?w=640&h=620&fit=crop&crop=faces&q=80`;

const MEMBER_PHOTOS: PortfolioScrollGridImage[] = [
  "photo-1500648767791-00dcc994a43e",
  "photo-1517841905240-472988babdf9",
  "photo-1507003211169-0a1dd7228f2d",
  "photo-1534528741775-53994a69daeb",
  "photo-1506794778202-cad84cf45f1d",
  "photo-1438761681033-6461ffad8d80",
  "photo-1539571696357-5a69c17a67c6",
  "photo-1544005313-94ddf0286df2",
  "photo-1519085360753-af0119f7cbe7",
  "photo-1494790108377-be9c29b29330",
  "photo-1531746020798-e6953c6e8e04",
  "photo-1524504388940-b1c1722653e1",
].map((id) => ({ src: unsplash(id), alt: "Duo member portrait" }));

/** Below the hero: "Find your Duo" pinned behind a scrolling grid of member portraits. */
export function MembersGridSection() {
  return <PortfolioScrollGrid title="Find your Duo" images={MEMBER_PHOTOS} rows={6} className="bg-surface" />;
}
