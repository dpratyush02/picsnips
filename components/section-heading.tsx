export function SectionHeading({
  eyebrow,
  title,
  body,
  as: HeadingTag = "h2",
  align = "left",
}: {
  eyebrow?: string;
  title: string;
  body?: string;
  as?: "h1" | "h2";
  align?: "left" | "center";
}) {
  return (
    <div className={align === "center" ? "mx-auto max-w-[42rem] text-center" : "max-w-[42rem]"}>
      {eyebrow && <p className="mb-3 font-mono text-xs uppercase tracking-[0.06em] text-muted-foreground">{eyebrow}</p>}
      <HeadingTag className={HeadingTag === "h1" ? "display-title" : "section-title"}>{title}</HeadingTag>
      {body && <p className="mt-3 text-base leading-6 text-pretty text-muted-foreground">{body}</p>}
    </div>
  );
}
