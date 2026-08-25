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
        <Line />
        <Contact />
      </main>
      <ContactModal />
    </Scroll>
  );
}
