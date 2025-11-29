"use client";

import { GreetUser } from "@/components/GreetUser";
import { Recents } from "@/components/Recents";
import { ForYouTabs } from "@/components/ForYouTabs";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <div className="w-full min-h-screen min-w-0">
      <main className="w-full max-w-7xl mx-auto flex flex-col items-start justify-start gap-y-8 lg:gap-y-10 py-8 sm:py-10 md:py-12 px-4 sm:px-6 lg:px-8">
        <motion.div
          className="w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <GreetUser />
        </motion.div>
        <motion.div
          className="w-full max-w-full overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          <Recents />
        </motion.div>
        <motion.div
          className="w-full max-w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <ForYouTabs />
        </motion.div>
      </main>
    </div>
  );
}
