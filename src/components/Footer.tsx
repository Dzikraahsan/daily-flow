export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative mt-12 pt-6 pb-0 text-center text-xs md:text-sm lg:text-sm text-muted-foreground">
      
      {/* Gradient top border */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-border to-transparent" />

      <p>
        © {year} Daily Tracker. All rights reserved.
      </p>

    </footer>
  );
}