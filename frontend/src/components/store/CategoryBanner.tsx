import { motion } from "framer-motion";

const CATEGORY_BANNERS: Record<string, { image: string; title: string; subtitle: string }> = {
  electronics: {
    image: "/media/products/Electronics.jpg",
    title: "Electronics",
    subtitle: "Tech deals and gadgets",
  },
  fashion: {
    image: "/media/products/red sneakers.jpg",
    title: "Fashion",
    subtitle: "Style for every occasion",
  },
  home: {
    image: "/media/products/chair.jpg",
    title: "Home & Living",
    subtitle: "Furniture and decor",
  },
  sports: {
    image: "/media/products/green water bottle.jpg",
    title: "Sports & Outdoors",
    subtitle: "Gear for your active life",
  },
  beauty: {
    image: "/media/products/pink lipstick.jpg",
    title: "Beauty",
    subtitle: "Skincare and makeup",
  },
  other: {
    image: "/media/products/plant pot.jpg",
    title: "Other",
    subtitle: "More to explore",
  },
};

interface CategoryBannerProps {
  category: string;
  categoryDisplay: string;
}

export function CategoryBanner({ category, categoryDisplay }: CategoryBannerProps) {
  const banner = CATEGORY_BANNERS[category] ?? CATEGORY_BANNERS.other;
  const title = banner.title !== categoryDisplay ? categoryDisplay : banner.title;

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="relative w-full overflow-hidden rounded-xl border bg-muted"
      aria-label={`${title} category`}
    >
      <div className="relative aspect-[3/1] min-h-[120px] sm:min-h-[140px]">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${banner.image})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-center px-6 sm:px-10">
          <h2 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-white drop-shadow-lg">
            {title}
          </h2>
          <p className="mt-1 text-sm sm:text-base text-white/90 drop-shadow">{banner.subtitle}</p>
        </div>
      </div>
    </motion.section>
  );
}
