export default function Footer() {
  return (
    <footer className="px-4 py-6 text-center">
      <p className="text-xs text-muted-foreground/60">
        No licenses. All rights reserved © {new Date().getFullYear()} Kusler Consulting
      </p>
    </footer>
  );
}
