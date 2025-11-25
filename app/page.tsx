"use client";

import { GreetUser } from "@/components/GreetUser";
import { Recents } from "@/components/Recents";
import { ForYouTabs } from "@/components/ForYouTabs";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <div className="w-full min-h-screen min-w-0 bg-linear-to-t from-primary/10 to-white dark:from-primary/10 dark:to-background">
      <main className="w-full mx-auto flex flex-col items-start justify-start gap-y-8 py-8 sm:py-12 md:py-16 lg:py-20 px-4 sm:px-6 md:px-8 lg:px-12">
        <motion.div
          className="w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <GreetUser />
        </motion.div>
        <motion.div
          className="w-full max-w-full overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
        >
          <Recents />
        </motion.div>
        <div className="w-full max-w-full">
          <ForYouTabs />
        </div>
      </main>
    </div>
  );
}
