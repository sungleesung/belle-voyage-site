import { Arrow } from "./Arrow";

/* One form, two doorways — the section at the foot of the page and the popup
   Contact opens. The same component in both, so there is no second copy to
   drift. Fields are wrapped in their labels, so nothing needs an id and two
   instances can sit in the DOM together without colliding. */
export function EnquiryForm() {
  return (
    <form className="ct-form" action="/api/enquiry" method="post">
      <div className="ct-row">
        <label className="ct-f">
          <span>Name</span>
          <input name="name" type="text" autoComplete="name" required />
        </label>
        <label className="ct-f">
          <span>Email</span>
          <input name="email" type="email" autoComplete="email" required />
        </label>
      </div>
      <label className="ct-f">
        <span>Subject</span>
        <input name="subject" type="text" required />
      </label>
      <label className="ct-f">
        <span>Message</span>
        <textarea name="message" rows={5} required />
      </label>
      <button className="ct-send" type="submit">
        Send <Arrow dir="right" size={20} />
      </button>
    </form>
  );
}
