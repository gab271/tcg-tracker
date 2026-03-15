const fs = require('fs');

const heroPath = 'src/components/home/HeroSection.tsx';
let hero = fs.readFileSync(heroPath, 'utf8');

hero = hero.replace('pt-24 pb-12', 'py-24');
hero = hero.replace('hidden lg:block relative h-[600px] w-full', 'hidden md:block relative h-[600px] w-full');
// Hero titles
// The instructions says "All section titles: reduce font size on mobile (text-3xl md:text-5xl)"
hero = hero.replace('className="text-5xl md:text-6xl lg:text-7xl', 'className="text-3xl md:text-5xl lg:text-7xl');

fs.writeFileSync(heroPath, hero);

const contentPath = 'src/components/home/HomeContent.tsx';
let content = fs.readFileSync(contentPath, 'utf8');

// Title size updates
content = content.replace(/text-4xl md:text-5xl font-bold/g, 'text-3xl md:text-5xl font-bold');
content = content.replace(/text-4xl font-bold/g, 'text-3xl md:text-5xl font-bold');

// Pricing reverse 
content = content.replace('className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center"', 'className="flex flex-col-reverse md:grid md:grid-cols-2 gap-8 items-center"');

// Stats bar padding
content = content.replace('className="w-full border-t border-[#D4A017]/20 py-16 bg-[#0a0a0a]', 'className="w-full border-t border-[#D4A017]/20 py-24 bg-[#0a0a0a]');

// CTA padding
content = content.replace('section className="py-32 relative overflow-hidden"', 'section className="py-24 relative overflow-hidden"');
content = content.replace('text-5xl md:text-7xl font-bold', 'text-3xl md:text-5xl lg:text-7xl font-bold'); // CTA title

// Feature blocks replace
content = content.replace(
  /<div className="w-full md:w-1\/2 aspect-video rounded-3xl bg-gradient-to-[a-z]+ from-\[#D4A017\]\/20 to-[a-z#\[\]]+ border border-\[#D4A017\]\/20 flex items-center justify-center(?: relative overflow-hidden group)? shadow-\[0_0_50px_rgba\(212,160,23,0\.1\)\]">[\s\S]*?<\/div>/g,
  (match) => {
    // Determine which image to use based on content
    let imgUrl = "";
    if (match.includes("Gallery")) {
      imgUrl = "https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?q=80&w=800&auto=format&fit=crop"; 
    } else if (match.includes("Dashboard")) {
      imgUrl = "https://images.unsplash.com/photo-1642790106117-e829e14a795f?q=80&w=800&auto=format&fit=crop";
    } else {
      imgUrl = "https://images.unsplash.com/photo-1639322537228-f710d846310a?q=80&w=800&auto=format&fit=crop";
    }

    return `<motion.div 
              whileHover={{ boxShadow: "0 0 30px rgba(212, 175, 55, 0.4)", borderColor: "rgba(212, 175, 55, 0.8)" }}
              className="w-full md:w-1/2 aspect-video rounded-3xl border border-[#D4A017]/20 flex items-center justify-center relative overflow-hidden shadow-[0_0_50px_rgba(212,160,23,0.1)] transition-colors duration-300"
            >
              <img src="${imgUrl}" alt="Feature Mockup" className="w-full h-full object-cover" />
            </motion.div>`;
  }
);


fs.writeFileSync(contentPath, content);
