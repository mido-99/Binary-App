import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const SLIDES = [
  {
    image: "/media/products/Sale.png",
    title: "SALE!",
    subtitle: "Limited time offers across the store",
  },
  {
    image: "/media/products/Electronics.jpg",
    title: "Up to 50% off",
    subtitle: "Electronics",
  },
  {
    image: "/media/products/red sneakers.jpg",
    title: "New in Fashion",
    subtitle: "Fresh styles for the season",
  },
  {
    image: "/media/products/chair.jpg",
    title: "Home & Living",
    subtitle: "Deals on furniture and decor",
  },
  {
    image: "/media/products/green water bottle.jpg",
    title: "Sports & Outdoors",
    subtitle: "Gear for your active life",
  },
];

const ROTATE_MS = 5000;

export function HeroBanner() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % SLIDES.length);
    }, ROTATE_MS);
    return () => clearInterval(t);
  }, []);

  const slide = SLIDES[index];

  return (
    <section className="relative w-full overflow-hidden rounded-2xl border bg-muted" aria-label="Promotional banner">
      <div className="relative aspect-[21/9] min-h-[180px] sm:min-h-[220px] md:min-h-[280px]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={index}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0"
          >
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${slide.image})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-center px-6 sm:px-10 md:px-14">
              <motion.p
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                className="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white drop-shadow-lg"
              >
                {slide.title}
              </motion.p>
              <motion.p
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.35, duration: 0.4 }}
                className="mt-2 text-lg sm:text-xl text-white/95 drop-shadow"
              >
                {slide.subtitle}
              </motion.p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => setIndex(i)}
            className={`h-2 rounded-full transition-all ${
              i === index ? "w-6 bg-primary" : "w-2 bg-white/60 hover:bg-white/80"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
