import { Scroll } from "@/components/Scroll";
import { Preloader } from "@/components/Preloader";
import { Hero, LinesDraw, Wash, Markets, Services } from "@/components/Sections";
import { Board, TwoPaths, PlatformSign } from "@/components/Sections2";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Page() {
  return (
    <>
      <Preloader />
      <ThemeToggle />
      <Scroll>
        <main>
          <Hero />
          <LinesDraw />
          <Wash />
          <Markets />
          <Services />
          <Board />
          <TwoPaths />
        </main>
        <PlatformSign />
      </Scroll>
    </>
  );
}
