import { Masthead } from "@/components/Masthead";
import { Line } from "@/components/Line";
import { Contact } from "@/components/Contact";
import { Scroll } from "@/components/Scroll";
import { ContactModal } from "@/components/ContactModal";

export default function Page() {
  return (
    <Scroll>
      <Masthead />
      <main>
        {/* The page has no visible heading by design — the line is the whole
            statement. This is the one a crawler and a screen reader need. */}
        <h1 className="sr">
          Belle Voyage Estates — sales, letting and management across Canada,
          the United States and Europe
        </h1>
        <Line />
        <Contact />
      </main>
      <ContactModal />
    </Scroll>
  );
}
