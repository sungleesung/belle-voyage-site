import { Masthead } from "@/components/Masthead";
import { Line } from "@/components/Line";
import { Contact } from "@/components/Contact";
import { Scroll } from "@/components/Scroll";

export default function Page() {
  return (
    <Scroll>
      <Masthead />
      <main>
        <Line />
        <Contact />
      </main>
    </Scroll>
  );
}
