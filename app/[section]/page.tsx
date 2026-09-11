import Link from "next/link";
import { notFound } from "next/navigation";
import { navigation } from "@/src/config/navigation";

export default async function SectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const entry = navigation.find((item) => item.href === `/${section}`);
  if (!entry) notFound();

  return (
    <main className="placeholder">
      <div className="brandMark">O</div>
      <p className="eyebrow">ODDMODISH OS · BOOTSTRAP V1</p>
      <h1>{entry.label}</h1>
      <p>This route is reserved and mapped to the product architecture. The first implementation slice will connect it to shared operational data and role-based access.</p>
      <Link className="primary linkButton" href="/">← Return to Control Tower</Link>
    </main>
  );
}
