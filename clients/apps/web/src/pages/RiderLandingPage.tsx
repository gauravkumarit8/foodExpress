import { motion } from 'framer-motion';

export function RiderLandingPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-20 text-center">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="flex h-16 w-16 items-center justify-center rounded-full bg-route-100"
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M5 11l4-7h6l4 7M5 11h14M5 11l-1.5 8h15L17 11M9 15h6"
            stroke="#2E5EAA"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05, ease: 'easeOut' }}
        className="mt-5 font-display text-2xl font-bold text-ink"
      >
        You're set up as a rider
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1, ease: 'easeOut' }}
        className="mt-2 text-sm leading-relaxed text-ink/60"
      >
        Deliveries — going online, seeing your assignments, marking pickups and
        drop-offs — happen in the FoodExpress rider app on mobile, not here.
        This web app is for browsing and ordering as a customer, or managing a
        restaurant.
      </motion.p>
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mt-6 rounded-ticket bg-cook-100 px-3 py-1.5 text-xs font-medium text-cook-700"
      >
        Rider app — coming soon
      </motion.span>
    </div>
  );
}
