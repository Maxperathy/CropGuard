import { useState } from 'react';
import { Card } from './ui/Card';
import { Search, BookOpen, ChevronRight, ShieldAlert, HeartHandshake } from 'lucide-react';

interface CropInfo {
  id: string;
  name: string;
  scientific: string;
  image: string;
  description: string;
  diseases: {
    name: string;
    scientific: string;
    symptoms: string[];
    prevention: string;
  }[];
}

const CROP_DATA: CropInfo[] = [
  {
    id: 'c1',
    name: 'Maize',
    scientific: 'Zea mays',
    image: 'https://images.unsplash.com/photo-1530026405186-ed1ea0ac7a63?auto=format&fit=crop&q=80&w=400',
    description: 'A staple cereal grain cultivated widely. It serves as a major source of starch and feed.',
    diseases: [
      {
        name: 'Leaf Rust',
        scientific: 'Puccinia sorghi',
        symptoms: ['Small, powdery, golden-brown pustules on both leaf surfaces', 'Yellowing leaves and premature leaf drop'],
        prevention: 'Plant resistant hybrids, practice crop rotation, apply Mancozeb early if conditions are wet.',
      },
      {
        name: 'Maize Streak Virus',
        scientific: 'Mastrevirus MSV',
        symptoms: ['Broken yellow stripes along leaf veins', 'Stunted growth and poorly filled ears'],
        prevention: 'Control leafhopper vectors, use certified disease-free seeds.',
      }
    ]
  },
  {
    id: 'c2',
    name: 'Tomato',
    scientific: 'Solanum lycopersicum',
    image: 'https://images.unsplash.com/photo-1592841208221-a5808df73648?auto=format&fit=crop&q=80&w=400',
    description: 'An essential agricultural crop in Ghana, highly susceptible to fungal wilts and blight during wet seasons.',
    diseases: [
      {
        name: 'Early Blight',
        scientific: 'Alternaria solani',
        symptoms: ['Concentric dark spots forming target patterns on older leaves', 'Stem lesions and blossom end rot'],
        prevention: 'Apply mulch to prevent soil splashing, spray copper-based fungicides.',
      }
    ]
  },
  {
    id: 'c3',
    name: 'Cocoa',
    scientific: 'Theobroma cacao',
    image: 'https://images.unsplash.com/photo-1610970881699-44a5587caaec?auto=format&fit=crop&q=80&w=400',
    description: 'Ghana’s primary export crop. Requires intensive care to prevent black pod disease and capsid damage.',
    diseases: [
      {
        name: 'Black Pod Rot',
        scientific: 'Phytophthora palmivora',
        symptoms: ['Brown spots on cocoa pods that rapidly expand and turn black', 'Pods become covered in white powdery mold'],
        prevention: 'Prune trees regularly to increase aeration, weed orchard floor, apply copper fungicide.',
      }
    ]
  },
  {
    id: 'c4',
    name: 'Cassava',
    scientific: 'Manihot esculenta',
    image: 'https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?auto=format&fit=crop&q=80&w=400',
    description: 'A root vegetable highly resilient to drought but vulnerable to mosaic viruses.',
    diseases: [
      {
        name: 'Cassava Mosaic Disease',
        scientific: 'Cassava mosaic geminivirus',
        symptoms: ['Chlorosis and yellow-green mottling of leaves', 'Distorted, curled, and stunted leaf structures'],
        prevention: 'Use resistant cassava cultivars, clean planting material, control whiteflies.',
      }
    ]
  }
];

export function CropLibrary() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCrop, setSelectedCrop] = useState<CropInfo | null>(CROP_DATA[0]);

  const filteredCrops = CROP_DATA.filter((crop) =>
    crop.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Sidebar List of Crops */}
      <div className="lg:col-span-1 flex flex-col gap-4">
        <div className="relative shrink-0">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search crop library..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-zinc-200 rounded-xl text-xs bg-white focus:outline-none focus:border-primary transition-all shadow-sm"
          />
        </div>

        <div className="flex flex-col gap-2 overflow-y-auto max-h-[500px] pr-1">
          {filteredCrops.map((crop) => (
            <div
              key={crop.id}
              onClick={() => setSelectedCrop(crop)}
              className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                selectedCrop?.id === crop.id
                  ? 'bg-primary text-white border-primary shadow-md shadow-primary/10'
                  : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <img src={crop.image} alt={crop.name} className="w-10 h-10 object-cover rounded-xl shrink-0" />
                <div className="min-w-0">
                  <h4 className="text-xs font-bold leading-none">{crop.name}</h4>
                  <p className={`text-[10px] mt-0.5 font-medium truncate ${selectedCrop?.id === crop.id ? 'text-white/80' : 'text-zinc-400'}`}>
                    {crop.scientific}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 shrink-0" />
            </div>
          ))}
          {filteredCrops.length === 0 && (
            <p className="text-xs text-zinc-400 text-center py-6 font-medium">No crops match your search query.</p>
          )}
        </div>
      </div>

      {/* Main Encyclopedia Pane */}
      <div className="lg:col-span-2">
        {selectedCrop ? (
          <Card className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <img src={selectedCrop.image} alt={selectedCrop.name} className="w-20 h-20 object-cover rounded-2xl border border-zinc-100" />
              <div>
                <h2 className="text-xl font-bold text-zinc-950 font-sans tracking-tight">{selectedCrop.name}</h2>
                <p className="text-xs text-zinc-400 italic font-bold">{selectedCrop.scientific}</p>
                <p className="text-xs text-zinc-500 font-medium mt-1 leading-normal max-w-md">{selectedCrop.description}</p>
              </div>
            </div>

            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Common Pathological Threats</h3>

            <div className="flex flex-col gap-4">
              {selectedCrop.diseases.map((dis, idx) => (
                <div key={idx} className="border border-zinc-100 rounded-2xl p-4 bg-zinc-50/50">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
                    <h4 className="text-xs font-bold text-zinc-900 leading-none">
                      {dis.name} <span className="text-[10px] text-zinc-400 italic font-medium">({dis.scientific})</span>
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                    <div>
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Key Symptoms</span>
                      <ul className="list-disc list-inside text-[10px] text-zinc-600 font-medium leading-relaxed">
                        {dis.symptoms.map((sym, sIdx) => (
                          <li key={sIdx}>{sym}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Prevention & Care</span>
                      <p className="text-[10px] text-zinc-600 font-medium leading-normal flex items-start gap-1">
                        <HeartHandshake className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                        <span>{dis.prevention}</span>
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ) : (
          <Card className="flex items-center justify-center p-12 text-center h-full">
            <div>
              <BookOpen className="w-12 h-12 text-zinc-300 mx-auto mb-2" />
              <p className="text-xs text-zinc-400 font-semibold">Select a crop from the sidebar to inspect detailed agronomic guidelines.</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
