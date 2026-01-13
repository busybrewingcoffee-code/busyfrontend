import { motion } from "framer-motion";
import truckImage from "@assets/generated_images/minimalist_vintage_coffee_truck_side_view_vector_illustration.png";

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
          <div className="absolute bottom-10 w-full h-1 bg-border/30 rounded-full overflow-hidden max-w-xl mx-auto z-10">
             {/* Moving Road Markers */}
             <motion.div
              className="absolute top-0 left-0 w-full h-full flex space-x-12"
              animate={{ x: [-100, -300] }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity, 
                ease: "linear" 
              }}
             >
               {[...Array(20)].map((_, i) => (
                 <div key={i} className="w-8 h-full bg-foreground/20 shrink-0 rounded-full" />
               ))}
             </motion.div>
          </div>
        </div>

        {/* Text Content */}
        <div className="text-center space-y-4 mt-8">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-4xl md:text-6xl font-serif font-medium tracking-tight text-foreground"
          >
            Brewing...
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-muted-foreground font-sans text-sm md:text-base tracking-widest uppercase"
          >
            Something fresh is hitting the road
          </motion.p>
        </div>

      </main>

      {/* Subtle Background Elements for Texture/Depth (Optional, keeping it very clean as requested) */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] mix-blend-multiply"></div>
      
    </div>
  );
}
