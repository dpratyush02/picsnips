export function SectionHeading({
  eyebrow,
  title,
  body,
  as: HeadingTag = "h2",
}: {
  eyebrow: string;
  title: string;
  body: string;
  as?: "h1" | "h2";
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-sm font-medium text-muted-foreground">{eyebrow}</p>
      <HeadingTag className="mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
        {title}
      </HeadingTag>
      <p className="mt-4 text-base leading-7 text-pretty text-muted-foreground">{body}</p>
    </div>
  );
}
