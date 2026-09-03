import type { Metadata } from "next";
import { Doc, CONTACT } from "@/components/Doc";

export const metadata: Metadata = {
  alternates: { canonical: "/ai-usage" },
  title: "AI usage policy — Belle Voyage Estates",
  description: "Where AI is and is not used at Belle Voyage Estates, and what we commit to where a person is affected.",
};

export default function Page() {
  return (
    <Doc title="AI usage policy" updated="21 August 2026">
      <p>
        Most sites that publish one of these say nothing in particular. This one
        says what is true of this website, and what we commit to where a person
        is affected.
      </p>

      <h2>This website</h2>
      <p>
        There is no AI running on this site. No chatbot, no assistant, no
        automated scoring, no recommendation engine. Everything you see is
        drawn, written and served directly; nothing about you is sent to a model
        provider by visiting.
      </p>

      <h2>Your enquiry</h2>
      <p>
        An enquiry sent through this site goes to a person and is answered by a
        person. It is not summarised, ranked, screened or replied to
        automatically, and it is not used as training data.
      </p>

      <h2>Decisions about people</h2>
      <p>
        We do not use AI to decide who is offered a tenancy, a viewing or a
        price. Decisions of that kind are made by a person who can explain them,
        and you may ask us to explain one.
      </p>
      <p>
        This matters beyond politeness: automated tenant screening has a
        documented record of reproducing the biases in the data it was trained
        on. The way to avoid that is not to use it.
      </p>

      <h2>Where we do use it</h2>
      <p>
        We use AI tools the way most businesses now do — drafting, research,
        tidying up text, and building software, including parts of this site.
        Anything produced that way is reviewed by a person before it is
        published or sent.
      </p>
      <p>
        Where an image or a property description has been generated or
        materially altered by AI, it is labelled as such on the listing. A
        photograph of a property is a photograph of that property.
      </p>

      <h2>Questions</h2>
      <p>
        If you want to know whether AI was involved in something specific, ask{" "}
        <a href={`mailto:${CONTACT}`}>{CONTACT}</a> and we will tell you
        straight.
      </p>
    </Doc>
  );
}
