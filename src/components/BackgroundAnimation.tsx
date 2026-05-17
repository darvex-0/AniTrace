import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const BackgroundAnimation = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: (e.clientY / window.innerHeight) * 2 - 1,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-background">
      {/* Anime Energy Pattern */}
      <motion.img 
        src="/anime_energy.png" 
        alt="Anime Energy"
        className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-screen"
        animate={{
          scale: [1, 1.05, 1],
          opacity: [0.2, 0.4, 0.2]
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Dynamic Gradient Background */}
      <div 
        className="absolute inset-0 opacity-40 mix-blend-color-burn"
        style={{
          background: "radial-gradient(circle at 50% 50%, hsl(var(--primary) / 0.2) 0%, transparent 70%)",
          transform: `translate(${mousePosition.x * 20}px, ${mousePosition.y * 20}px)`,
          transition: "transform 0.1s ease-out",
        }}
      />

      {/* Anime Speed Lines Effect */}
      <div className="absolute inset-0 anime-speed-lines opacity-20" />

      {/* Anime Silhouette Parallax Layer */}
      <motion.div 
        className="absolute inset-0 flex items-center justify-center opacity-15 pointer-events-none mix-blend-screen"
        style={{
          transform: `translate(${mousePosition.x * -40}px, ${mousePosition.y * -40}px)`,
          transition: "transform 0.1s ease-out",
        }}
      >
        <img src="/anime_silhouette.png" alt="Anime Silhouette" className="h-[120%] w-auto max-w-none object-contain" />
      </motion.div>

      {/* Floating Shards */}
      {Array.from({ length: 15 }).map((_, i) => {
        const size = Math.random() * 100 + 50;
        const initialX = Math.random() * 100;
        const initialY = Math.random() * 100;
        const duration = Math.random() * 20 + 10;
        const delay = Math.random() * 5;

        return (
          <motion.div
            key={i}
            className="absolute rounded-lg opacity-30 shard-blur"
            style={{
              width: size,
              height: size,
              background: i % 2 === 0 ? "hsl(var(--primary))" : "hsl(var(--primary-glow))",
              filter: "blur(40px)",
              left: `${initialX}%`,
              top: `${initialY}%`,
            }}
            animate={{
              y: [0, -100, 0],
              x: [0, Math.random() * 50 - 25, 0],
              scale: [1, 1.2, 1],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: duration,
              repeat: Infinity,
              delay: delay,
              ease: "easeInOut",
            }}
          />
        );
      })}

      {/* Overlay to ensure text readability */}
      <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px]" />
    </div>
  );
};

export default BackgroundAnimation;
