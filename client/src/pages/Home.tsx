import { motion } from "framer-motion";
import truckImage from "@assets/generated_images/Busy2.png";

export default function Home() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background p-4 overflow-hidden relative selection:bg-primary selection:text-white">
      
      {/* Main Content Container */}
      <main className="flex flex-col items-center justify-center z-10 w-full max-w-4xl relative">
        
        {/* Truck Animation Container */}
        <div className="relative w-full flex flex-col items-center justify-center py-12">
          
          {/* The Truck */}
          <motion.div
            animate={{ 
              y: [0, -4, 0],
              rotate: [0, 0.5, 0, -0.5, 0]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
            className="relative z-20 w-64 md:w-96 aspect-[16/9] flex items-center justify-center"
          >
            <img 
              src={truckImage} 
              alt="Minimalist Coffee Truck" 
              className="w-full h-full object-contain drop-shadow-xl"
            />
          </motion.div>

          {/* The Road */}
          <div className="absolute bottom-18 w-full h-1 bg-primary/10 rounded-full overflow-hidden max-w-xl mx-auto z-10">
             {/* Moving Road Markers */}
             <motion.div
              className="absolute top-0 left-0 w-full h-full flex space-x-12"
              animate={{ x: [-300, -100] }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity, 
                ease: "linear" 
              }}
             >
               {[...Array(20)].map((_, i) => (
                 <div key={i} className="w-8 h-full bg-primary/40 shrink-0 rounded-full" />
               ))}
             </motion.div>
          </div>
        </div>

        {/* Text Content */}
        <div className="text-center space-y-6 ">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="space-y-2"
          >
            <h1 className="text-5xl md:text-7xl font-serif italic text-primary">
              Busy Brewing ...
            </h1>
            <p className="text-xl md:text-2xl font-serif text-foreground/80">
              Chasing the perfect shot.
            </p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 1 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="h-px w-12 bg-primary/30" />
            <p className="text-muted-foreground font-sans text-xs md:text-sm tracking-[0.3em] uppercase">
              Coming to your neighborhood soon
            </p>
          </motion.div>
        </div>

      </main>

      {/* Subtle Background Elements for Texture/Depth (Optional, keeping it very clean as requested) */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] mix-blend-multiply"></div>
      
    </div>
  );
}
