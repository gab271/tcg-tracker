const fs = require('fs');
const contentPath = 'src/components/home/HomeContent.tsx';
let content = fs.readFileSync(contentPath, 'utf8');

const targetStr = `<div className="w-full md:w-1/2 aspect-video rounded-3xl bg-gradient-to-bl from-[#D4A017]/20 to-[#0a0a0a] border border-[#D4A017]/20 flex items-center justify-center shadow-[0_0_50px_rgba(212,160,23,0.1)]">
              <div className="text-[#D4A017]/50 font-mono text-xl text-center">
                Dashboard Value Chart <br/>
                <span className="text-sm">Data Viz Prototype</span>
              </div>
            </div>`;

const newStr = `<motion.div 
              whileHover={{ boxShadow: "0 0 30px rgba(212, 175, 55, 0.4)", borderColor: "rgba(212, 175, 55, 0.8)" }}
              className="w-full md:w-1/2 aspect-video rounded-3xl border border-[#D4A017]/20 flex items-center justify-center relative overflow-hidden shadow-[0_0_50px_rgba(212,160,23,0.1)] transition-colors duration-300"
            >
              <img src="https://images.unsplash.com/photo-1642790106117-e829e14a795f?q=80&w=800&auto=format&fit=crop" alt="Dashboard Mockup" className="w-full h-full object-cover" />
            </motion.div>`;

content = content.replace(targetStr, newStr);
fs.writeFileSync(contentPath, content);
